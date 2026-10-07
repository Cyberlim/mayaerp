import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { FeeTransaction } from '@/models/FeeTransaction';
import { Payout } from '@/models/Payout';
import { Student } from '@/models/Student';
import { User } from '@/models/User';
import { Course } from '@/models/Course';
import { Branch } from '@/models/Branch';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'student', 'employee', 'all'
    const query = searchParams.get('query') || '';
    const id = searchParams.get('id');

    if (id) {
      // Direct lookup by ID or receiptNumber
      if (type === 'student' || type === 'all') {
        const studentTxn = await FeeTransaction.findById(id)
          .populate({ path: 'studentId', model: Student, populate: [{ path: 'selectedBranch' }, { path: 'selectedProgram' }] })
          .populate({ path: 'courseId', model: Course })
          .lean();

        if (studentTxn) {
          return NextResponse.json({
            type: 'student',
            receipt: formatStudentReceipt(studentTxn)
          });
        }
      }

      if (type === 'employee' || type === 'all') {
        const employeePayout = await Payout.findById(id)
          .populate({ path: 'payeeId', model: User, select: 'firstName lastName email role department phone employeeId' })
          .lean();

        if (employeePayout) {
          return NextResponse.json({
            type: 'employee',
            receipt: formatEmployeeReceipt(employeePayout)
          });
        }
      }

      return NextResponse.json({ error: 'Receipt record not found' }, { status: 404 });
    }

    // List recent receipts for both branches
    const [studentTxns, payouts] = await Promise.all([
      FeeTransaction.find({})
        .populate({ path: 'studentId', model: Student, select: 'firstName lastName studentId enrollmentNumber admissionNumber' })
        .populate({ path: 'courseId', model: Course, select: 'name code' })
        .sort({ paymentDate: -1 })
        .limit(50)
        .lean(),
      Payout.find({})
        .populate({ path: 'payeeId', model: User, select: 'firstName lastName email role department' })
        .sort({ paymentDate: -1 })
        .limit(50)
        .lean()
    ]);

    const formattedStudentReceipts = studentTxns.map(t => formatStudentReceipt(t));
    const formattedEmployeeReceipts = payouts.map(p => formatEmployeeReceipt(p));

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

    return NextResponse.json(combined);

  } catch (error: any) {
    console.error('Error in GET /api/finance/receipts:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch receipts' }, { status: 500 });
  }
}

function formatStudentReceipt(txn: any) {
  const student = txn.studentId || {};
  const course = txn.courseId || student.selectedProgram || {};
  const branch = student.selectedBranch || {};

  return {
    receiptType: 'Student Fee Receipt',
    type: 'student',
    _id: txn._id,
    receiptNumber: txn.receiptNumber || `RCP-STU-${txn._id.toString().slice(-8).toUpperCase()}`,
    transactionId: txn.transactionId || `TXN-${txn._id.toString().slice(-6)}`,
    date: txn.paymentDate || txn.createdAt,
    name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student',
    idNumber: student.enrollmentNumber || student.admissionNumber || student.studentId || 'N/A',
    enrollmentNumber: student.enrollmentNumber || 'N/A',
    admissionNumber: student.admissionNumber || 'N/A',
    program: course.name || 'Academic Program',
    programCode: course.code || '',
    branch: branch.name || 'Main Campus',
    semester: txn.semester || 1,
    academicYear: txn.academicYear || 'Year 1',
    category: txn.category || 'tuition',
    categoryName: txn.categoryName || 'Tuition Fee',
    amount: txn.amount || 0,
    paymentMethod: txn.paymentMethod || 'Cash',
    status: txn.status || 'Completed',
    collectedBy: txn.collectedBy || 'Admin Finance',
    notes: txn.notes || 'Institutional fee deposit receipt',
    items: [
      {
        description: txn.categoryName || `${txn.category || 'Tuition'} Fee (${txn.academicYear || 'Year 1'}, Sem ${txn.semester || 1})`,
        amount: txn.amount || 0
      }
    ]
  };
}

function formatEmployeeReceipt(payout: any) {
  const payee = payout.payeeId || {};
  const name = payout.payeeName || `${payee.firstName || ''} ${payee.lastName || ''}`.trim() || 'Employee';

  return {
    receiptType: 'Employee Payment Voucher',
    type: 'employee',
    _id: payout._id,
    receiptNumber: payout.receiptNumber || `RCP-EMP-${payout._id.toString().slice(-8).toUpperCase()}`,
    transactionId: payout.transactionId || `TXN-${payout._id.toString().slice(-6)}`,
    date: payout.paymentDate || payout.createdAt,
    name,
    idNumber: payee.employeeId || payee._id?.toString().slice(-6) || 'EMP-001',
    designation: payout.designation || payee.role || 'Staff Member',
    department: payout.department || payee.department || 'Administration',
    payoutType: payout.payoutType || 'Salary / Disbursal',
    amount: payout.amount || 0,
    paymentMethod: payout.paymentMethod || 'Bank Transfer',
    status: payout.status || 'Completed',
    disbursedBy: payout.disbursedBy || 'Finance Controller',
    notes: payout.notes || 'Institutional remuneration disbursal',
    items: [
      {
        description: `${payout.payoutType || 'Salary'} Disbursal - ${payout.monthYear || 'Current Cycle'}`,
        amount: payout.amount || 0
      }
    ]
  };
}
