import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { FeeTransaction } from "@/models/FeeTransaction";
import { Student } from "@/models/Student";
import { Course } from "@/models/Course";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    // Fetch transactions with populated student and course data
    const transactions = await FeeTransaction.find({})
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
