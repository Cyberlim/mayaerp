import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Course } from "@/models/Course";
import { Student } from "@/models/Student";

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { feeStructureTemplate, applyToStudents } = body;

    const course = await Course.findByIdAndUpdate(
      id,
      { $set: { feeStructureTemplate } },
      { new: true }
    );

    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    if (applyToStudents) {
      await Student.updateMany(
        { selectedProgram: course._id },
        { 
          $set: { 
            "fees.isConfigured": false,
            "fees.years": []
          } 
        }
      );
    }

    return NextResponse.json({ message: "Fee structure updated successfully", course });
  } catch (error: any) {
    console.error("Error updating course fees:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
