import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Attendance } from "@/models/Attendance";
import { Student } from "@/models/Student";

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const courseId = searchParams.get("courseId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!branchId || !courseId || !startDateStr || !endDateStr) {
      return NextResponse.json({ error: "Missing required query parameters" }, { status: 400 });
    }

    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    // Find all students in this branch and course
    const students = await Student.find({
      selectedBranch: branchId,
      selectedProgram: courseId
    }).select('_id');

    const studentIds = students.map(s => s._id);

    if (studentIds.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No students found in this branch/course." });
    }

    // Delete all attendance records for these students in the date range
    const result = await Attendance.deleteMany({
      student: { $in: studentIds },
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    return NextResponse.json({ success: true, count: result.deletedCount });
  } catch (error) {
    console.error("Attendance Reset DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
