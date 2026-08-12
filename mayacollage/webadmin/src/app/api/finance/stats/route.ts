import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { FeeTransaction } from "@/models/FeeTransaction";
import { Course } from "@/models/Course";
import { Student } from "@/models/Student";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    const [transactions, students, courses] = await Promise.all([
      FeeTransaction.find({ status: 'Completed' }),
      Student.find({ studentStatus: 'Active' }),
      Course.find({})
    ]);

    const totalCollected = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    let totalReceivable = 0;
    const activeStudentCount = students.length;

    const courseMap = new Map();
    for (const c of courses) {
      courseMap.set(c._id.toString(), c.tuitionFee || 0);
    }

    for (const s of students) {
      if (s.selectedProgram) {
        const fee = courseMap.get(s.selectedProgram.toString()) || 0;
        totalReceivable += fee;
      }
    }

    return NextResponse.json({
      totalCollected,
      totalReceivable,
      activeStudentCount
    });

  } catch (error) {
    console.error("Finance Stats Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
