import { NextResponse } from 'next/server';
import { query as pgQuery } from '@/lib/postgres';
import { getCache, setCache, DEFAULT_CACHE_TTL } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'student', 'employee', 'all'
    const query = searchParams.get('query') || '';
    const id = searchParams.get('id');

    if (id) {
      // Direct lookup by ID or receiptNumber
      if (type === 'student' || type === 'all') {
        const studentTxnRes = await pgQuery(`
          SELECT 
            t.*,
            s.first_name as student_first_name,
            s.last_name as student_last_name,
            s.student_id as student_code,
            s.enrollment_number as student_enrollment_number,
            s.admission_number as student_admission_number,
            s.mobile as student_mobile,
            s.email as student_email,
            b.name as branch_name,
            c.name as course_name,
            c.code as course_code
          FROM fee_transactions t
          LEFT JOIN students s ON t.student_id = s.id
          LEFT JOIN branches b ON s.selected_branch = b.id
          LEFT JOIN courses c ON t.course_id = c.id
          WHERE t.id = $1 OR t.receipt_number = $1 OR t.transaction_id = $1
          LIMIT 1
        `, [id]);

        if (studentTxnRes.rows.length > 0) {
          return NextResponse.json({
            type: 'student',
            receipt: formatStudentReceipt(studentTxnRes.rows[0])
          });
        }
      }

      if (type === 'employee' || type === 'all') {
        const payoutRes = await pgQuery(`
          SELECT p.*
          FROM payouts p
          WHERE p.id = $1 OR p.receipt_number = $1 OR p.transaction_id = $1
          LIMIT 1
        `, [id]);

        if (payoutRes.rows.length > 0) {
          return NextResponse.json({
            type: 'employee',
            receipt: formatEmployeeReceipt(payoutRes.rows[0])
          });
        }
      }

      return NextResponse.json({ error: 'Receipt record not found' }, { status: 404 });
    }

    const cacheKey = `fee:receipts:${type}:${query.toLowerCase()}`;
    const cachedReceipts = await getCache(cacheKey);
    if (cachedReceipts) {
      return NextResponse.json(cachedReceipts, {
        headers: { "X-Cache-Source": "Upstash-Redis" }
      });
    }

    // List recent receipts from PostgreSQL
    const [txnsRes, payoutsRes] = await Promise.all([
      pgQuery(`
        SELECT 
          t.*,
          s.first_name as student_first_name,
          s.last_name as student_last_name,
          s.student_id as student_code,
          s.enrollment_number as student_enrollment_number,
          s.admission_number as student_admission_number,
          s.mobile as student_mobile,
          s.email as student_email,
          b.name as branch_name,
          c.name as course_name,
          c.code as course_code
        FROM fee_transactions t
        LEFT JOIN students s ON t.student_id = s.id
        LEFT JOIN branches b ON s.selected_branch = b.id
        LEFT JOIN courses c ON t.course_id = c.id
        ORDER BY t.payment_date DESC, t.created_at DESC
        LIMIT 100
      `),
      pgQuery(`
        SELECT p.*
        FROM payouts p
        ORDER BY p.payment_date DESC, p.created_at DESC
        LIMIT 100
      `)
    ]);

    const formattedStudentReceipts = txnsRes.rows.map(formatStudentReceipt);
    const formattedEmployeeReceipts = payoutsRes.rows.map(formatEmployeeReceipt);

    let combined = [];
    if (type === 'student') combined = formattedStudentReceipts;
    else if (type === 'employee') combined = formattedEmployeeReceipts;
    else combined = [...formattedStudentReceipts, ...formattedEmployeeReceipts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (query && query.trim() !== '') {
      const q = query.toLowerCase();
      combined = combined.filter((r: any) =>
        r.receiptNumber?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.idNumber?.toLowerCase().includes(q) ||
        r.transactionId?.toLowerCase().includes(q)
      );
    }

    // Cache in Redis
    await setCache(cacheKey, combined, DEFAULT_CACHE_TTL);

    return NextResponse.json(combined, {
      headers: { "X-Cache-Source": "Neon-PostgreSQL" }
    });

  } catch (error: any) {
    console.error('Error in GET /api/finance/receipts:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch receipts' }, { status: 500 });
  }
}

function formatStudentReceipt(row: any) {
  const name = `${row.student_first_name || ''} ${row.student_last_name || ''}`.trim() || 'Student';
  const idNumber = row.student_code || row.student_enrollment_number || row.student_admission_number || 'PENDING';

  return {
    receiptType: 'Student Fee Receipt',
    type: 'student',
    _id: row.id,
    id: row.id,
    receiptNumber: row.receipt_number || `RCP-STU-${row.id?.slice(-8).toUpperCase()}`,
    transactionId: row.transaction_id || `TXN-${row.id?.slice(-6)}`,
    date: row.payment_date || row.created_at,
    name,
    idNumber,
    course: row.course_name || 'Academic Program',
    branch: row.branch_name || 'Main Campus',
    categoryName: row.category_name || row.category?.toUpperCase() || 'TUITION FEE',
    amount: Number(row.amount) || 0,
    paymentMethod: row.payment_method || 'Cash',
    semester: row.semester ? `Semester ${row.semester}` : 'Regular',
    academicYear: row.academic_year || 'Year 1',
    collectedBy: row.collected_by || 'Admin Finance',
    notes: row.notes || 'Institutional tuition and academic dues receipt',
    status: row.status || 'Completed'
  };
}

function formatEmployeeReceipt(row: any) {
  const name = row.payee_name || (row.user_first_name ? `${row.user_first_name} ${row.user_last_name || ''}`.trim() : 'Staff Member');
  const idNumber = row.payee_id || 'STAFF';

  return {
    receiptType: 'Staff Payout Voucher',
    type: 'employee',
    _id: row.id,
    id: row.id,
    receiptNumber: row.receipt_number || `VCH-STAFF-${row.id?.slice(-8).toUpperCase()}`,
    transactionId: row.transaction_id || `PAY-${row.id?.slice(-6)}`,
    date: row.payment_date || row.created_at,
    name,
    idNumber,
    designation: row.designation || 'Faculty / Staff',
    department: row.department || 'Academics',
    payoutType: row.payout_type || 'Salary',
    amount: Number(row.amount) || 0,
    paymentMethod: row.payment_method || 'Bank Transfer',
    monthYear: row.month_year || 'Current Period',
    disbursedBy: row.disbursed_by || 'Admin Finance',
    notes: row.notes || 'Institutional staff compensation disbursement',
    status: row.status || 'Completed'
  };
}
