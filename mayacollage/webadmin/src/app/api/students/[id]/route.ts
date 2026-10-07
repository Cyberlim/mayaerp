import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { Course } from "@/models/Course";
import { Branch } from "@/models/Branch";
import { getCache, setCache, delCache, delCachePattern, DEFAULT_CACHE_TTL } from "@/lib/redis";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cacheKey = `student:${id}`;

    // 1. Try serving from Redis cache (30 min TTL)
    const cachedStudent = await getCache(cacheKey);
    if (cachedStudent) {
      return NextResponse.json(cachedStudent);
    }

    await connectDB();
    const student = await Student.findById(id)
      .populate("selectedBranch")
      .populate("selectedProgram")
      .lean();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // 2. Cache student profile for 30 minutes (1800s)
    await setCache(cacheKey, student, DEFAULT_CACHE_TTL);

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

    const updatedStudent = await Student.findByIdAndUpdate(id, body, { new: true })
      .populate("selectedBranch")
      .populate("selectedProgram");

    if (!updatedStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Update / invalidate cache immediately
    const cacheKey = `student:${id}`;
    await Promise.all([
      setCache(cacheKey, updatedStudent, DEFAULT_CACHE_TTL),
      delCachePattern("students:*"),
      delCache(`fee:student-account:${id}`),
      delCachePattern("fee:student-accounts:*"),
      delCachePattern("fee:alerts:*")
    ]);

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

    // Invalidate cache
    await Promise.all([
      delCache(`student:${id}`),
      delCachePattern("students:*"),
      delCache(`fee:student-account:${id}`),
      delCachePattern("fee:student-accounts:*"),
      delCachePattern("fee:transactions:*"),
      delCachePattern("fee:alerts:*")
    ]);

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/students/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
