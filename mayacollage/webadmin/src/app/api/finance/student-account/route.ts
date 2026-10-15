import { NextResponse } from 'next/server';
import { query as pgQuery } from '@/lib/postgres';
import { getCache, setCache, DEFAULT_CACHE_TTL } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString() || 'all';
    const cacheKey = `fee:student-accounts:${queryString}`;

    // 1. Check Redis cache (30 min TTL)
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: { "X-Cache-Source": "Upstash-Redis" }
      });
    }

    const search = searchParams.get('search') || '';
    const branchId = searchParams.get('branchId') || '';
    const courseId = searchParams.get('courseId') || '';
    const osStatus = searchParams.get('status') || 'all'; // all, os_due, cleared

    const conditions: string[] = ["s.student_status = 'Active'"];
    const params: any[] = [];
    let pIdx = 1;

    if (branchId && branchId !== 'all') {
      conditions.push(`s.selected_branch = $${pIdx++}`);
      params.push(branchId);
    }
    if (courseId && courseId !== 'all') {
      conditions.push(`s.selected_program = $${pIdx++}`);
      params.push(courseId);
    }
    if (search && search.trim() !== '') {
      conditions.push(`(
        s.first_name ILIKE $${pIdx} OR 
        s.last_name ILIKE $${pIdx} OR 
        s.enrollment_number ILIKE $${pIdx} OR 
        s.admission_number ILIKE $${pIdx} OR 
        s.mobile ILIKE $${pIdx}
      )`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        s.id,
        s.enrollment_number,
        s.admission_number,
        s.student_id,
        s.first_name,
        s.middle_name,
        s.last_name,
        s.mobile,
        s.email,
        s.applicant_photo,
        s.fees,
        s.total_fee,
        s.paid_fee,
        s.fee_balance,
        s.fee_status,
        s.selected_branch,
        s.selected_program,
        s.course_year,
        b.name as branch_name,
        b.code as branch_code,
        c.name as course_name,
        c.code as course_code,
        c.tuition_fee as course_tuition_fee,
        c.duration as course_duration,
        COALESCE(SUM(t.amount), 0) as total_txn_paid
      FROM students s
      LEFT JOIN branches b ON s.selected_branch = b.id
      LEFT JOIN courses c ON s.selected_program = c.id
      LEFT JOIN fee_transactions t ON s.id = t.student_id AND t.status = 'Completed'
      ${whereClause}
      GROUP BY s.id, b.name, b.code, c.name, c.code, c.tuition_fee, c.duration
      ORDER BY s.first_name ASC
    `;

    const res = await pgQuery(sql, params);

    // Format student accounts
    let studentAccounts = res.rows.map((row: any) => {
      const courseTuition = Number(row.course_tuition_fee) || 0;
      let feesObj: any = typeof row.fees === 'string' ? JSON.parse(row.fees) : (row.fees || {});

      let totalAssessed = 0;
      let totalPaid = Number(row.total_txn_paid) || 0;

      if (feesObj.isConfigured && Array.isArray(feesObj.years) && feesObj.years.length > 0) {
        let scAssessed = 0;
        let scPaid = 0;
        feesObj.years.forEach((y: any) => {
          let yrGross = 0;
          let yrPaid = 0;
          if (y.components && y.components.length > 0) {
            y.components.forEach((c: any) => {
              yrGross += Number(c.amount) || 0;
              yrPaid += Number(c.paid) || 0;
            });
          } else {
            yrGross += (Number(y.tuition?.total) || 0) + (Number(y.exam?.total) || 0) + (Number(y.transport?.total) || 0) + (Number(y.other?.total) || 0);
            yrPaid += (Number(y.tuition?.paid) || 0) + (Number(y.exam?.paid) || 0) + (Number(y.transport?.paid) || 0) + (Number(y.other?.paid) || 0);
          }
          const yrDiscount = Number(y.discount) || 0;
          scAssessed += Math.max(0, yrGross - yrDiscount);
          scPaid += yrPaid;
        });
        totalAssessed = scAssessed;
        if (scPaid > totalPaid) totalPaid = scPaid;
      } else {
        totalAssessed = courseTuition;
      }

      const outstandingAmount = Math.max(0, totalAssessed - totalPaid);
      let status = 'Cleared';
      if (totalPaid === 0 && totalAssessed > 0) status = 'Unpaid';
      else if (outstandingAmount > 0) status = 'Partial';
      else status = 'Paid';

      return {
        _id: row.id,
        id: row.id,
        enrollmentNumber: row.enrollment_number || 'N/A',
        admissionNumber: row.admission_number || '',
        studentId: row.student_id || row.admission_number || '',
        name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
        mobile: row.mobile || '',
        email: row.email || '',
        applicantPhoto: row.applicant_photo || '',
        branchName: row.branch_name || 'N/A',
        branchCode: row.branch_code || '',
        courseName: row.course_name || 'N/A',
        courseCode: row.course_code || '',
        courseYear: row.course_year || 1,
        totalAssessed,
        totalPaid,
        outstandingAmount,
        status,
        isConfigured: Boolean(feesObj.isConfigured)
      };
    });

    if (osStatus === 'os_due') {
      studentAccounts = studentAccounts.filter(s => s.outstandingAmount > 0);
    } else if (osStatus === 'cleared') {
      studentAccounts = studentAccounts.filter(s => s.totalPaid > 0);
    }

    // 2. Cache in Redis for 30 minutes
    await setCache(cacheKey, studentAccounts, DEFAULT_CACHE_TTL);

    return NextResponse.json(studentAccounts, {
      headers: { "X-Cache-Source": "Neon-PostgreSQL" }
    });

  } catch (error: any) {
    console.error('Error in GET /api/finance/student-account:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch student accounts' }, { status: 500 });
  }
}
