import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Course } from "@/models/Course";
import { Student } from "@/models/Student";

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;
    const body = await request.json();
    const { feeStructureTemplate } = body;

    const course = await Course.findByIdAndUpdate(
      id,
      { $set: { feeStructureTemplate } },
      { new: true }
    );

    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    // Note: We don't forcefully overwrite existing student fee templates here
    // to prevent messing up paid fees. 
    // They will inherit this template when they are admitted or when "Reset Fees" is explicitly clicked.

    return NextResponse.json({ message: "Fee structure updated successfully", course });
  } catch (error: any) {
    console.error("Error updating course fees:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
