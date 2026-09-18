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
    const { applyToStudents, ...courseData } = body;

    const course = await Course.findByIdAndUpdate(id, courseData, { new: true, runValidators: true }).populate("branchId");
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (applyToStudents && (course.tuitionFee || course.semesterFees?.length > 0)) {
      const { Student } = await import("@/models/Student");
      const duration = course.duration || 4;
      let totalFee = course.tuitionFee || 0;
      if (course.semesterFees && course.semesterFees.length > 0) {
        const sumSem = course.semesterFees.reduce((acc: number, sf: any) => acc + (Number(sf.fee) || 0), 0);
        if (sumSem > 0) totalFee = sumSem;
      }
      const annualFee = Math.round(totalFee / duration);

      const studentsInCourse = await Student.find({ selectedProgram: course._id });
      for (const st of studentsInCourse) {
        const years = Array.from({ length: duration }).map((_, idx) => ({
          year: idx + 1,
          tuition: { total: annualFee, paid: st.fees?.years?.[idx]?.tuition?.paid || 0 },
          exam: { total: 0, paid: st.fees?.years?.[idx]?.exam?.paid || 0 },
          transport: { total: 0, paid: st.fees?.years?.[idx]?.transport?.paid || 0 },
          other: { total: 0, paid: st.fees?.years?.[idx]?.other?.paid || 0 }
        }));
        st.fees = {
          isConfigured: true,
          years
        };
        st.markModified('fees');
        await st.save();
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
