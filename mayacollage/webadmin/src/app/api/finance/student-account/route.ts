import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Student } from '@/models/Student';
import { Course } from '@/models/Course';
import { Branch } from '@/models/Branch';
import { FeeTransaction } from '@/models/FeeTransaction';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const branchId = searchParams.get('branchId') || '';
    const courseId = searchParams.get('courseId') || '';
    const osStatus = searchParams.get('status') || 'all'; // all, os_due, cleared

    const query: any = { studentStatus: 'Active' };
    if (branchId && branchId !== 'all') query.selectedBranch = branchId;
    if (courseId && courseId !== 'all') query.selectedProgram = courseId;

    const [students, courses, transactions] = await Promise.all([
      Student.find(query)
        .populate('selectedBranch', 'name code')
        .populate('selectedProgram', 'name code tuitionFee totalSemesters duration semesterFees')
        .lean(),
      Course.find({}).lean(),
      FeeTransaction.find({ status: 'Completed' }).lean()
    ]);

    // Build lookup for student transactions
    const txnMap = new Map<string, any[]>();
    for (const t of transactions) {
      const sId = t.studentId?.toString();
      if (!sId) continue;
      if (!txnMap.has(sId)) txnMap.set(sId, []);
      txnMap.get(sId)!.push(t);
    }

    // Process OS (Outstanding) calculations for each student
    let studentAccounts = students.map((s: any) => {
      const course = s.selectedProgram;
      const duration = course?.duration || 4;
      const courseTuition = course?.tuitionFee || 0;
      
      let totalAssessed = 0;
      let totalPaid = 0;

      const studentTxns = txnMap.get(s._id.toString()) || [];
      const txnPaidSum = studentTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      // Check configured fee structure in student record
      if (s.fees?.isConfigured && Array.isArray(s.fees.years) && s.fees.years.length > 0) {
        s.fees.years.forEach((y: any) => {
          totalAssessed += (Number(y.tuition?.total) || 0) + (Number(y.exam?.total) || 0) + (Number(y.transport?.total) || 0) + (Number(y.other?.total) || 0);
          totalPaid += (Number(y.tuition?.paid) || 0) + (Number(y.exam?.paid) || 0) + (Number(y.transport?.paid) || 0) + (Number(y.other?.paid) || 0);
        });
      } else {
        totalAssessed = courseTuition;
        totalPaid = txnPaidSum;
      }

      // If student has recorded more paid transactions than schema indicates, use max
      if (txnPaidSum > totalPaid) {
        totalPaid = txnPaidSum;
      }

      const outstandingAmount = Math.max(0, totalAssessed - totalPaid);
      let status = 'Cleared';
      if (totalPaid === 0 && totalAssessed > 0) status = 'Unpaid';
      else if (outstandingAmount > 0) status = 'Partial';
      else status = 'Paid';

      return {
        _id: s._id,
        enrollmentNumber: s.enrollmentNumber || 'N/A',
        admissionNumber: s.admissionNumber || 'N/A',
        studentId: s.studentId || 'N/A',
        fullName: `${s.firstName || ''} ${s.middleName || ''} ${s.lastName || ''}`.trim(),
        mobile: s.mobile,
        parentMobile: s.parentMobile,
        email: s.email,
        branch: s.selectedBranch?.name || 'N/A',
        branchCode: s.selectedBranch?.code || '',
        course: course?.name || 'Unassigned',
        courseCode: course?.code || '',
        courseDuration: duration,
        selectedSemester: s.selectedSemester || 1,
        courseYear: s.courseYear || Math.ceil((s.selectedSemester || 1) / 2),
        batch: s.batch || s.sessionYear || 'N/A',
        totalAssessed,
        totalPaid,
        outstandingAmount,
        status,
        hasOutstanding: outstandingAmount > 0,
        transactionCount: studentTxns.length,
        lastPaymentDate: studentTxns.length > 0 ? studentTxns[0].paymentDate : null,
        feesConfig: s.fees || null
      };
    });

    if (search && search.trim() !== '') {
      const q = search.toLowerCase();
      studentAccounts = studentAccounts.filter((sa: any) =>
        sa.fullName.toLowerCase().includes(q) ||
        sa.enrollmentNumber.toLowerCase().includes(q) ||
        sa.admissionNumber.toLowerCase().includes(q) ||
        sa.mobile?.includes(q) ||
        sa.courseCode.toLowerCase().includes(q)
      );
    }

    if (osStatus === 'os_due') {
      studentAccounts = studentAccounts.filter((sa: any) => sa.outstandingAmount > 0);
    } else if (osStatus === 'cleared') {
      studentAccounts = studentAccounts.filter((sa: any) => sa.outstandingAmount === 0);
    }

    // Summary statistics for OS Ledger
    const totalInstitutionalReceivable = studentAccounts.reduce((acc, curr) => acc + curr.totalAssessed, 0);
    const totalInstitutionalCollected = studentAccounts.reduce((acc, curr) => acc + curr.totalPaid, 0);
    const totalInstitutionalOS = studentAccounts.reduce((acc, curr) => acc + curr.outstandingAmount, 0);
    const totalDefaulters = studentAccounts.filter((s: any) => s.outstandingAmount > 0).length;

    return NextResponse.json({
      summary: {
        totalStudents: studentAccounts.length,
        totalInstitutionalReceivable,
        totalInstitutionalCollected,
        totalInstitutionalOS,
        totalDefaulters,
        recoveryRate: totalInstitutionalReceivable > 0 ? Math.round((totalInstitutionalCollected / totalInstitutionalReceivable) * 100) : 100
      },
      accounts: studentAccounts
    });

  } catch (error: any) {
    console.error('Error in GET /api/finance/student-account:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch student fee accounts' }, { status: 500 });
  }
}
