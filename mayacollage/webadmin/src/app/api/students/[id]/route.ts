import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { Course } from "@/models/Course"; // We might need these to populate
import { Branch } from "@/models/Branch";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    // Use .populate if Course and Branch models exist. Otherwise just findById.
    // If we just do findById, we can populate selectedBranch and selectedProgram
    const student = await Student.findById(id)
      .populate("selectedBranch")
      .populate("selectedProgram")
      .lean();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("GET /api/students/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch student details" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const body = await request.json();

    const updatedStudent = await Student.findByIdAndUpdate(id, body, { new: true });
    if (!updatedStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(updatedStudent);
  } catch (error: any) {
    console.error("PUT /api/students/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    
    const deletedStudent = await Student.findByIdAndDelete(id);
    if (!deletedStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/students/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
