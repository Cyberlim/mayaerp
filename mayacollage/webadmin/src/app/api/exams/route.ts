import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Exam } from "@/models/Exam";

import { Branch } from "@/models/Branch";
import { Course } from "@/models/Course";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const courseId = searchParams.get("courseId");

    let query: any = {};
    if (branchId) query.branchId = branchId;
    if (courseId) query.courseId = courseId;

    const exams = await Exam.find(query)
      .sort({ createdAt: -1 })
      .populate({ path: 'branchId', model: Branch, select: 'name' })
      .populate({ path: 'courseId', model: Course, select: 'name' });
    return NextResponse.json(exams);
  } catch (error) {
    console.error("Exams GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    
    if (!body.branchId || !body.courseId || !body.examName || !body.dateSheet) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const exam = new Exam({
      branchId: body.branchId,
      courseId: body.courseId,
      examName: body.examName,
      dateSheet: body.dateSheet
    });

    await exam.save();
    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    console.error("Exams POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Exam ID required" }, { status: 400 });

    const body = await req.json();
    const updated = await Exam.findByIdAndUpdate(id, body, { new: true });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Exams PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Exam ID required" }, { status: 400 });

    await Exam.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Exams DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
