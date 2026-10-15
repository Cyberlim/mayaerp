import { NextResponse } from 'next/server';
import { query as pgQuery } from '@/lib/postgres';
import { mapPgTransactions } from '@/lib/financeMapper';
import { getCache, setCache, DEFAULT_CACHE_TTL } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const cacheKey = `fee:student-account:${studentId}`;

    // 1. Try Redis cache (30 min TTL)
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: { "X-Cache-Source": "Upstash-Redis" }
      });
    }

    // 2. Query Neon PostgreSQL for student with branch & course info
    const stuSql = `
      SELECT 
        s.*,
        b.name as branch_name,
        b.code as branch_code,
        c.name as course_name,
        c.code as course_code,
        c.duration as course_duration,
        c.tuition_fee as course_tuition_fee,
        c.total_semesters as course_total_semesters,
        c.semester_fees as course_semester_fees,
        c.coordinator as course_coordinator
      FROM students s
      LEFT JOIN branches b ON s.selected_branch = b.id
      LEFT JOIN courses c ON s.selected_program = c.id
      WHERE s.id = $1
    `;
    const stuRes = await pgQuery(stuSql, [studentId]);
    if (stuRes.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const studentRow = stuRes.rows[0];

    // 3. Query all transactions for this student
    const txnsSql = `
      SELECT 
        t.*,
        c.name as course_name,
        c.code as course_code,
        c.duration as course_duration
      FROM fee_transactions t
      LEFT JOIN courses c ON t.course_id = c.id
      WHERE t.student_id = $1
      ORDER BY t.payment_date DESC, t.created_at DESC
    `;
    const txnsRes = await pgQuery(txnsSql, [studentId]);
    const transactions = mapPgTransactions(txnsRes.rows);

    const duration = Number(studentRow.course_duration) || 4;
    const totalSemesters = Number(studentRow.course_total_semesters) || (duration * 2);
    const courseTuition = Number(studentRow.course_tuition_fee) || 0;

    let feesObj: any = typeof studentRow.fees === 'string' ? JSON.parse(studentRow.fees) : (studentRow.fees || {});
    if (!feesObj || typeof feesObj !== 'object') {
      feesObj = { isConfigured: false, years: [] };
    }

    // Build years list
    let yearsData = [];
    let totalGross = 0;
    let totalDiscount = 0;
    let totalAssessed = 0;
    let totalPaid = 0;

    if (feesObj.isConfigured && Array.isArray(feesObj.years) && feesObj.years.length > 0) {
      yearsData = feesObj.years.map((y: any, idx: number) => {
        const yNum = y.year || idx + 1;
        let yearGross = 0;
        let yearPaid = 0;
        let categories: any = {};
        let components = [];
        const discount = Number(y.discount) || 0;
        const discountReason = y.discountReason || "";

        if (y.components && y.components.length > 0) {
          components = y.components;
          components.forEach((c: any) => {
            const amt = Number(c.amount) || 0;
            const pd = Number(c.paid) || 0;
            yearGross += amt;
            yearPaid += pd;
          });
        } else {
          const tuitionTot = Number(y.tuition?.total) || 0;
          const tuitionPaid = Number(y.tuition?.paid) || 0;
          const examTot = Number(y.exam?.total) || 0;
          const examPaid = Number(y.exam?.paid) || 0;
          const transportTot = Number(y.transport?.total) || 0;
          const transportPaid = Number(y.transport?.paid) || 0;
          const otherTot = Number(y.other?.total) || 0;
          const otherPaid = Number(y.other?.paid) || 0;

          yearGross = tuitionTot + examTot + transportTot + otherTot;
          yearPaid = tuitionPaid + examPaid + transportPaid + otherPaid;

          categories = {
            tuition: { total: tuitionTot, paid: tuitionPaid, os: Math.max(0, tuitionTot - tuitionPaid) },
            exam: { total: examTot, paid: examPaid, os: Math.max(0, examTot - examPaid) },
            transport: { total: transportTot, paid: transportPaid, os: Math.max(0, transportTot - transportPaid) },
            other: { total: otherTot, paid: otherPaid, os: Math.max(0, otherTot - otherPaid) }
          };
        }

        const yearNet = Math.max(0, yearGross - discount);
        const yearOS = Math.max(0, yearNet - yearPaid);
        totalGross += yearGross;
        totalDiscount += discount;
        totalAssessed += yearNet;
        totalPaid += yearPaid;

        return {
          year: yNum,
          components,
          categories,
          yearGross,
          discount,
          discountReason,
          yearNet,
          yearPaid,
          yearOS,
          status: yearOS === 0 && yearNet > 0 ? 'Paid' : (yearPaid > 0 ? 'Partial' : 'Unpaid')
        };
      });
    } else {
      // Default to program course base fee
      const perYear = duration > 0 ? Math.round(courseTuition / duration) : courseTuition;
      for (let i = 1; i <= duration; i++) {
        const yearTxns = transactions.filter((t: any) => t.semester === (i * 2 - 1) || t.semester === (i * 2) || t.academicYear === `Year ${i}`);
        const yrPaid = yearTxns.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
        const yrOS = Math.max(0, perYear - yrPaid);

        totalGross += perYear;
        totalAssessed += perYear;
        totalPaid += yrPaid;

        yearsData.push({
          year: i,
          components: [
            { category: 'Tuition Fee', amount: perYear, paid: yrPaid, os: yrOS, frequency: 'Annual' }
          ],
          categories: {
            tuition: { total: perYear, paid: yrPaid, os: yrOS }
          },
          yearGross: perYear,
          discount: 0,
          discountReason: '',
          yearNet: perYear,
          yearPaid: yrPaid,
          yearOS: yrOS,
          status: yrOS === 0 && perYear > 0 ? 'Paid' : (yrPaid > 0 ? 'Partial' : 'Unpaid')
        });
      }
    }

    // Reconcile total transactions paid sum if higher
    const txnSum = transactions.reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
    if (txnSum > totalPaid) {
      totalPaid = txnSum;
    }

    const totalOutstanding = Math.max(0, totalAssessed - totalPaid);
    let overallStatus = 'Cleared';
    if (totalPaid === 0 && totalAssessed > 0) overallStatus = 'Unpaid';
    else if (totalOutstanding > 0) overallStatus = 'Partial';
    else overallStatus = 'Paid';

    const result = {
      student: {
        _id: studentRow.id,
        id: studentRow.id,
        firstName: studentRow.first_name,
        middleName: studentRow.middle_name,
        lastName: studentRow.last_name,
        enrollmentNumber: studentRow.enrollment_number,
        admissionNumber: studentRow.admission_number,
        studentId: studentRow.student_id,
        mobile: studentRow.mobile,
        parentMobile: studentRow.parent_mobile,
        email: studentRow.email,
        applicantPhoto: studentRow.applicant_photo,
        studentStatus: studentRow.student_status,
        sessionYear: studentRow.session_year,
        courseYear: studentRow.course_year,
        selectedSemester: studentRow.selected_semester,
        selectedBranch: {
          _id: studentRow.selected_branch,
          name: studentRow.branch_name,
          code: studentRow.branch_code
        },
        selectedProgram: {
          _id: studentRow.selected_program,
          name: studentRow.course_name,
          code: studentRow.course_code,
          duration: duration,
          totalSemesters: totalSemesters,
          tuitionFee: courseTuition
        }
      },
      summary: {
        totalGross,
        totalDiscount,
        totalAssessed,
        totalPaid,
        totalOutstanding,
        status: overallStatus
      },
      years: yearsData,
      transactions
    };

    // 4. Cache in Redis for 30 minutes
    await setCache(cacheKey, result, DEFAULT_CACHE_TTL);

    return NextResponse.json(result, {
      headers: { "X-Cache-Source": "Neon-PostgreSQL" }
    });

  } catch (error: any) {
    console.error('Error in GET /api/finance/student-account/[id]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch student account statement' }, { status: 500 });
  }
}
