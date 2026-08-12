import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Course } from "@/models/Course";
import { Branch } from "@/models/Branch";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    
    let query = {};
    if (branchId) {
      query = { branchId };
    }

    const courses = await Course.find(query).populate("branchId").sort({ createdAt: -1 });
    return NextResponse.json(courses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const course = await Course.create(body);
    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Course code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
