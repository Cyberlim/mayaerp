import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Timetable } from "@/models/Timetable";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    const branchId = searchParams.get("branchId");
    const courseId = searchParams.get("courseId");
    const semester = searchParams.get("semester");
    const section = searchParams.get("section");

    if (!branchId || !courseId) {
      return NextResponse.json({ error: "Missing required query parameters" }, { status: 400 });
    }

    const query: any = { targetType: "Class", branchId, courseId };
    if (semester) query.semester = parseInt(semester, 10);
    if (section) query.section = section;

    const timetable = await Timetable.findOne(query).lean();

    return NextResponse.json(timetable || { schedule: [] });
  } catch (error) {
    console.error("GET /api/timetable error:", error);
    return NextResponse.json({ error: "Failed to fetch timetable" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { branchId, courseId, semester, section, schedule } = body;

    if (!branchId || !courseId) {
      return NextResponse.json({ error: "Missing required fields for Class timetable" }, { status: 400 });
    }

    const query: any = { targetType: "Class", branchId, courseId };
    if (semester) query.semester = parseInt(semester, 10);
    if (section) query.section = section;

    const timetable = await Timetable.findOneAndUpdate(
      query,
      { $set: { schedule } },
      { new: true, upsert: true }
    );

    return NextResponse.json(timetable);
  } catch (error) {
    console.error("POST /api/timetable error:", error);
    return NextResponse.json({ error: "Failed to save timetable" }, { status: 500 });
  }
}
