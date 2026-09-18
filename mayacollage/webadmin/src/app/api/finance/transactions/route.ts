import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { FeeTransaction } from "@/models/FeeTransaction";
import { Student } from "@/models/Student";
import { Course } from "@/models/Course";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const query: any = {};
    if (studentId) query.studentId = studentId;

    // Fetch transactions with populated student and course data
    const transactions = await FeeTransaction.find(query)
      .populate({ path: 'studentId', model: Student, select: 'firstName lastName studentId' })
      .populate({ path: 'courseId', model: Course, select: 'name code' })
      .sort({ paymentDate: -1 })
      .limit(50); // Just fetch top 50 for dashboard

    return NextResponse.json(transactions);

  } catch (error) {
    console.error("Finance Transactions Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      studentId,
      amount,
      paymentDate,
      paymentMethod = "Cash",
      transactionId,
      year = 1,
      category = "tuition",
      semester = 1,
      notes
    } = body;

    if (!studentId || !amount) {
      return NextResponse.json({ error: "Student ID and amount are required" }, { status: 400 });
    }

    const payNum = Number(amount);
    if (isNaN(payNum) || payNum <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Determine target courseId
    let targetCourseId = body.courseId || (typeof student.selectedProgram === 'object' ? student.selectedProgram?._id : student.selectedProgram);
    if (!targetCourseId) {
      const fallbackCourse = await Course.findOne({});
      if (fallbackCourse) targetCourseId = fallbackCourse._id;
    }

    const yrNum = Number(year) || 1;
    const cat = ['tuition', 'exam', 'transport', 'other'].includes(category) ? category : 'tuition';

    // Update student's fee structure
    if (!student.fees) {
      student.fees = { isConfigured: true, years: [] };
    }
    student.fees.isConfigured = true;

    if (!student.fees.years) {
      student.fees.years = [];
    }

    let yearItem = student.fees.years.find((y: any) => y.year === yrNum);
    if (!yearItem) {
      student.fees.years.push({
        year: yrNum,
        tuition: { total: 0, paid: 0 },
        exam: { total: 0, paid: 0 },
        transport: { total: 0, paid: 0 },
        other: { total: 0, paid: 0 }
      });
      yearItem = student.fees.years[student.fees.years.length - 1];
    }

    if (!yearItem[cat]) {
      yearItem[cat] = { total: 0, paid: 0 };
    }

    yearItem[cat].paid = (Number(yearItem[cat].paid) || 0) + payNum;
    if ((Number(yearItem[cat].total) || 0) < yearItem[cat].paid) {
      yearItem[cat].total = yearItem[cat].paid;
    }

    student.markModified('fees');
    await student.save();

    // Create unique transaction ID if not provided
    const txnId = transactionId && transactionId.trim() !== ""
      ? transactionId.trim()
      : `FEE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let newTxn = null;
    if (targetCourseId) {
      newTxn = await FeeTransaction.create({
        studentId: student._id,
        courseId: targetCourseId,
        amount: payNum,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod: paymentMethod || 'Cash',
        transactionId: txnId,
        status: 'Completed',
        semester: Number(semester) || 1,
        academicYear: `Year ${yrNum}`
      });
    }

    return NextResponse.json({
      success: true,
      message: "Fee payment recorded successfully",
      student,
      transaction: newTxn
    });

  } catch (error: any) {
    console.error("POST /api/finance/transactions error:", error);
    return NextResponse.json({ error: error.message || "Failed to record transaction" }, { status: 500 });
  }
}
