import { NextResponse } from 'next/server';
import { query as pgQuery } from '@/lib/postgres';
import { mapPgFeeAlerts } from '@/lib/financeMapper';
import { getCache, setCache, delCache, delCachePattern, DEFAULT_CACHE_TTL } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'Active';
    const cacheKey = `fee:alerts:${status}`;

    // 1. Try Redis cache (30 min TTL)
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: { "X-Cache-Source": "Upstash-Redis" }
      });
    }

    // 2. Query alerts & students from PostgreSQL
    const alertsCondition = status !== 'all' ? "WHERE a.status = $1" : "";
    const alertParams = status !== 'all' ? [status] : [];

    const alertsSql = `
      SELECT 
        a.*,
        s.first_name as student_first_name,
        s.last_name as student_last_name,
        s.enrollment_number as student_enrollment_number,
        s.admission_number as student_admission_number,
        s.mobile as student_mobile,
        s.parent_mobile as student_parent_mobile,
        s.email as student_email,
        s.selected_program as student_program
      FROM fee_alerts a
      LEFT JOIN students s ON a.student_id = s.id
      ${alertsCondition}
      ORDER BY a.sent_at DESC
      LIMIT 100
    `;

    const studentsSql = `
      SELECT 
        s.id,
        s.first_name,
        s.last_name,
        s.enrollment_number,
        s.admission_number,
        s.mobile,
        s.parent_mobile,
        s.fees,
        s.total_fee,
        s.paid_fee,
        s.fee_balance,
        c.name as course_name,
        c.tuition_fee as course_tuition_fee,
        COALESCE(SUM(t.amount), 0) as txn_paid_sum
      FROM students s
      LEFT JOIN courses c ON s.selected_program = c.id
      LEFT JOIN fee_transactions t ON s.id = t.student_id AND t.status = 'Completed'
      WHERE s.student_status = 'Active'
      GROUP BY s.id, c.name, c.tuition_fee
    `;

    const [alertsRes, studentsRes] = await Promise.all([
      pgQuery(alertsSql, alertParams),
      pgQuery(studentsSql)
    ]);

    const alerts = mapPgFeeAlerts(alertsRes.rows);

    const pendingDefaulters = [];
    for (const row of studentsRes.rows) {
      const courseTuition = Number(row.course_tuition_fee) || 0;
      let assessed = courseTuition;
      let paid = Number(row.txn_paid_sum) || 0;

      let feesObj: any = typeof row.fees === 'string' ? JSON.parse(row.fees) : (row.fees || {});
      if (feesObj.isConfigured && Array.isArray(feesObj.years) && feesObj.years.length > 0) {
        let scAssessed = 0;
        let scPaid = 0;
        feesObj.years.forEach((y: any) => {
          scAssessed += (Number(y.tuition?.total) || 0) + (Number(y.exam?.total) || 0) + (Number(y.transport?.total) || 0) + (Number(y.other?.total) || 0);
          scPaid += (Number(y.tuition?.paid) || 0) + (Number(y.exam?.paid) || 0) + (Number(y.transport?.paid) || 0) + (Number(y.other?.paid) || 0);
        });
        if (scAssessed > 0) assessed = scAssessed;
        if (scPaid > paid) paid = scPaid;
      }

      const os = Math.max(0, assessed - paid);
      if (os > 0) {
        pendingDefaulters.push({
          studentId: row.id,
          name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
          enrollmentNumber: row.enrollment_number || row.admission_number || 'N/A',
          mobile: row.mobile || row.parent_mobile || '',
          course: row.course_name || 'Academic Program',
          outstandingAmount: os,
          paidAmount: paid,
          totalFee: assessed
        });
      }
    }

    const result = {
      summary: {
        totalAlerts: alerts.length,
        totalDefaultersCount: pendingDefaulters.length,
        totalOutstandingSum: pendingDefaulters.reduce((acc, curr) => acc + curr.outstandingAmount, 0),
        highRiskCount: pendingDefaulters.filter(d => d.outstandingAmount >= 25000).length
      },
      alerts,
      defaulters: pendingDefaulters
    };

    // 3. Cache in Redis
    await setCache(cacheKey, result, DEFAULT_CACHE_TTL);

    return NextResponse.json(result, {
      headers: { "X-Cache-Source": "Neon-PostgreSQL" }
    });

  } catch (error: any) {
    console.error('Error in GET /api/finance/alerts:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch fee alerts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, alertType, title, message, outstandingAmount, channel = 'In-App' } = body;

    if (!studentId || !title || !message) {
      return NextResponse.json({ error: 'studentId, title, and message are required' }, { status: 400 });
    }

    const alertId = `alrt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const res = await pgQuery(`
      INSERT INTO fee_alerts (
        id, student_id, alert_type, title, message, outstanding_amount, channel, status, sent_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active', NOW(), NOW(), NOW())
      RETURNING *
    `, [
      alertId,
      studentId,
      alertType || 'Outstanding_Dues',
      title.trim(),
      message.trim(),
      Number(outstandingAmount) || 0,
      channel
    ]);

    // Invalidate alerts and bundle cache
    await Promise.all([
      delCachePattern('fee:alerts:*'),
      delCache('fee:bundle:master')
    ]);

    return NextResponse.json({ success: true, alert: res.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/finance/alerts:', error);
    return NextResponse.json({ error: error.message || 'Failed to send fee alert' }, { status: 500 });
  }
}
