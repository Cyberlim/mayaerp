import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Course } from "@/models/Course";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const course = await Course.findById(id).populate("branchId");
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    return NextResponse.json(course);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const body = await request.json();
    const { id } = await params;
    const { updateStudents, applyToStudents, ...courseData } = body;
    const shouldSync = updateStudents || applyToStudents;

    const course = await Course.findByIdAndUpdate(id, courseData, { new: true, runValidators: true }).populate("branchId");
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (shouldSync) {
      const { Student } = await import("@/models/Student");
      
      // Update all students in this course to reset their manual fee configurations
      // This forces them to inherit the new dynamic course feeStructureTemplate
      await Student.updateMany(
        { selectedProgram: course._id },
        { 
          $set: { 
            "fees.isConfigured": false,
            "fees.years": []
          } 
        }
      );
      
      // We must clear the Redis cache for all these student accounts reliably without using KEYS
      const studentsToClear = await Student.find({ selectedProgram: course._id }).select('_id').lean();
      if (studentsToClear.length > 0) {
        const { delCache } = await import("@/lib/redis");
        const cacheKeys = studentsToClear.flatMap(s => [
          `fee:student-account:${s._id}`,
          `student:${s._id}`
        ]);
        await delCache(...cacheKeys);
      }
    }

    return NextResponse.json(course);
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Course code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const course = await Course.findByIdAndDelete(id);
    
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
