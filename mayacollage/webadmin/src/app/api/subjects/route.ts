import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Course } from "@/models/Course";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json([]);
    }

    const course = await Course.findById(courseId);
    if (!course || !course.curriculum) {
      return NextResponse.json([]);
    }

    // Extract all unique subjects from the course curriculum
    const subjectMap = new Map();
    
    course.curriculum.forEach((sem: any) => {
      if (sem.sections) {
        sem.sections.forEach((sec: any) => {
          if (sec.subjects) {
            sec.subjects.forEach((sub: any) => {
              if (sub.name && !subjectMap.has(sub.name)) {
                subjectMap.set(sub.name, {
                  _id: sub._id || sub.code || sub.name,
                  subjectName: sub.name,
                  subjectCode: sub.code
                });
              }
            });
          }
        });
      }
    });

    const subjects = Array.from(subjectMap.values());
    subjects.sort((a: any, b: any) => a.subjectName.localeCompare(b.subjectName));

    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Subjects GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
