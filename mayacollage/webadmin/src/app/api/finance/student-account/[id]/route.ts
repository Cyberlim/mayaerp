import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Student } from '@/models/Student';
import { Course } from '@/models/Course';
import { Branch } from '@/models/Branch';
import { FeeTransaction } from '@/models/FeeTransaction';
import { getCache, setCache, DEFAULT_CACHE_TTL } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const cacheKey = `fee:student-account:${studentId}`;

    // 1. Try Redis cache (30 min TTL)
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    await connectDB();

    const studentDoc = await Student.findById(studentId)
      .populate('selectedBranch', 'name code')
      .populate('selectedProgram', 'name code tuitionFee totalSemesters duration semesterFees coordinator')
      .lean();

    const transactions = await FeeTransaction.find({ studentId }).sort({ paymentDate: -1, createdAt: -1 }).lean();

    if (!studentDoc) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const student: any = studentDoc;
    const course: any = student.selectedProgram;
    const duration = course?.duration || 4;
    const totalSemesters = course?.totalSemesters || duration * 2;
    const courseTuition = course?.tuitionFee || 0;

    // Build years list
    let yearsData = [];
    let totalAssessed = 0;
    let totalPaid = 0;

    if (student.fees?.isConfigured && Array.isArray(student.fees?.years) && student.fees.years.length > 0) {
      yearsData = student.fees.years.map((y: any, idx: number) => {
        const yNum = y.year || idx + 1;
        const tuitionTot = Number(y.tuition?.total) || 0;
        const tuitionPaid = Number(y.tuition?.paid) || 0;
        const examTot = Number(y.exam?.total) || 0;
        const examPaid = Number(y.exam?.paid) || 0;
        const transportTot = Number(y.transport?.total) || 0;
        const transportPaid = Number(y.transport?.paid) || 0;
        const otherTot = Number(y.other?.total) || 0;
        const otherPaid = Number(y.other?.paid) || 0;

        const yearTotal = tuitionTot + examTot + transportTot + otherTot;
        const yearPaid = tuitionPaid + examPaid + transportPaid + otherPaid;
        const yearOS = Math.max(0, yearTotal - yearPaid);

        totalAssessed += yearTotal;
        totalPaid += yearPaid;

        return {
          year: yNum,
          categories: {
            tuition: { total: tuitionTot, paid: tuitionPaid, os: Math.max(0, tuitionTot - tuitionPaid) },
            exam: { total: examTot, paid: examPaid, os: Math.max(0, examTot - examPaid) },
            transport: { total: transportTot, paid: transportPaid, os: Math.max(0, transportTot - transportPaid) },
            other: { total: otherTot, paid: otherPaid, os: Math.max(0, otherTot - otherPaid) },
          },
          yearTotal,
          yearPaid,
          yearOS,
          status: yearOS === 0 && yearTotal > 0 ? 'Cleared' : yearPaid > 0 ? 'Partial' : 'Pending'
        };
      });
    } else {
      const yearlyTuition = duration > 0 ? Math.round(courseTuition / duration) : courseTuition;
      yearsData = Array.from({ length: duration }).map((_, idx) => {
        const yNum = idx + 1;
        const yrTxns = transactions.filter((t: any) => t.academicYear === `Year ${yNum}` || t.semester === (yNum * 2 - 1) || t.semester === (yNum * 2));
        const paidThisYear = yrTxns.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
        const yearTotal = yearlyTuition;
        const yearOS = Math.max(0, yearTotal - paidThisYear);

        totalAssessed += yearTotal;
        totalPaid += paidThisYear;

        return {
          year: yNum,
          categories: {
            tuition: { total: yearlyTuition, paid: paidThisYear, os: yearOS },
            exam: { total: 0, paid: 0, os: 0 },
            transport: { total: 0, paid: 0, os: 0 },
            other: { total: 0, paid: 0, os: 0 }
          },
          yearTotal,
          yearPaid: paidThisYear,
          yearOS,
          status: yearOS === 0 ? 'Cleared' : paidThisYear > 0 ? 'Partial' : 'Pending'
        };
      });
    }

    const totalTxnPaid = transactions.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
    if (totalTxnPaid > totalPaid) {
      totalPaid = totalTxnPaid;
    }

    const outstandingAmount = Math.max(0, totalAssessed - totalPaid);

    const payload = {
      student: {
        _id: student._id,
        enrollmentNumber: student.enrollmentNumber || 'N/A',
        admissionNumber: student.admissionNumber || 'N/A',
        studentId: student.studentId || 'N/A',
        firstName: student.firstName,
        lastName: student.lastName,
        fullName: `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.trim(),
        mobile: student.mobile,
        parentMobile: student.parentMobile,
        email: student.email,
        branch: student.selectedBranch?.name || 'N/A',
        course: course?.name || 'N/A',
        courseCode: course?.code || '',
        duration,
        totalSemesters,
        selectedSemester: student.selectedSemester || 1,
        courseYear: student.courseYear || 1,
        batch: student.batch || student.sessionYear || 'N/A',
        photo: student.applicantPhoto || student.documents?.studentPhoto || null
      },
      ledger: {
        totalAssessed,
        totalPaid,
        outstandingAmount,
        status: outstandingAmount === 0 ? 'Cleared' : totalPaid > 0 ? 'Partial' : 'Pending OS',
        recoveryPercentage: totalAssessed > 0 ? Math.round((totalPaid / totalAssessed) * 100) : 100,
        years: yearsData
      },
      transactions
    };

    // 2. Cache in Redis for 30 minutes
    await setCache(cacheKey, payload, DEFAULT_CACHE_TTL);

    return NextResponse.json(payload);

  } catch (error: any) {
    console.error('Error in GET /api/finance/student-account/[id]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch student account details' }, { status: 500 });
  }
}
