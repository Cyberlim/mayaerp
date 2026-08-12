import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Student } from "@/models/Student";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const selectedProgram = searchParams.get("selectedProgram");
    const selectedBranch = searchParams.get("selectedBranch");
    const batch = searchParams.get("batch");
    const courseYear = searchParams.get("courseYear");
    const selectedSemester = searchParams.get("selectedSemester");
    const selectedSection = searchParams.get("selectedSection");
    const countOnly = searchParams.get("countOnly") === "true";

    const search = searchParams.get("search");

    let query: any = {};
    if (selectedProgram) query.selectedProgram = selectedProgram;
    if (selectedBranch) query.selectedBranch = selectedBranch;
    if (batch) query.batch = batch;
    if (courseYear) query.courseYear = Number(courseYear);
    if (selectedSemester) query.selectedSemester = Number(selectedSemester);
    if (selectedSection) query.selectedSection = selectedSection;
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
        { admissionNumber: { $regex: search, $options: "i" } }
      ];
    }

    if (countOnly) {
      const count = await Student.countDocuments(query);
      return NextResponse.json({ count });
    }

    const students = await Student.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(students);
  } catch (error) {
    console.error("GET /api/students error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    if (body.studentId) {
      const existing = await Student.findOne({ studentId: body.studentId });
      if (existing) {
        return NextResponse.json({ error: "Student ID already exists" }, { status: 400 });
      }
    }

    const newStudent = new Student(body);
    await newStudent.save();

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/students error:", error);
    return NextResponse.json({ error: error.message || "Failed to create student" }, { status: 500 });
  }
}
