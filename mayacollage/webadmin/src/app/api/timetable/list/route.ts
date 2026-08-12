import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Timetable } from "@/models/Timetable";
import { User } from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    // Fetch class timetables
    const timetables = await Timetable.find({ targetType: "Class" }).populate('courseId branchId', 'name').lean();
    const result = timetables.map((tt: any) => ({
        _id: tt._id,
        branchName: tt.branchId?.name || "Unknown Branch",
        courseName: tt.courseId?.name || "Unknown Course",
        semester: tt.semester || 1,
        section: (tt.section && tt.section !== "All") ? tt.section : "A",
        updatedAt: tt.updatedAt || tt.createdAt,
        targetType: tt.targetType,
        branchId: tt.branchId?._id || tt.branchId,
        courseId: tt.courseId?._id || tt.courseId,
    }));
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/timetable/list error:", error);
    return NextResponse.json({ error: "Failed to fetch timetables" }, { status: 500 });
  }
}
