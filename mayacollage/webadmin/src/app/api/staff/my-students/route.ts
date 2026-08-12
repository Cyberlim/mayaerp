import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Timetable } from "@/models/Timetable";
import { Student } from "@/models/Student";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { Course } from "@/models/Course";
import { Branch } from "@/models/Branch";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();
        
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('auth_token');
        
        if (!tokenCookie || !tokenCookie.value) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET || 'fallback_secret') as any;
        const staffId = decoded.id;

        // Find all timetables where this staff teaches
        const timetables = await Timetable.find({ targetType: "Class" }).populate('courseId branchId').lean();
        
        let targetClasses = [];
        for (const tt of timetables) {
            if (!tt.schedule) continue;
            let teachesHere = false;
            for (const dayPlan of tt.schedule) {
                if (dayPlan.slots && dayPlan.slots.some((s: any) => s.facultyUserId?.toString() === staffId)) {
                    teachesHere = true;
                    break;
                }
            }
            if (teachesHere) {
                targetClasses.push({
                    courseId: tt.courseId?._id,
                    branchId: tt.branchId?._id,
                    semester: tt.semester,
                    section: tt.section || 'Section A',
                    courseName: (tt.courseId as any)?.name || 'Unknown',
                    branchName: (tt.branchId as any)?.name || ''
                });
            }
        }

        // Group students by class
        let groupedStudents = [];

        for (const tc of targetClasses) {
            const query: any = {
                selectedProgram: tc.courseId,
                selectedBranch: tc.branchId,
            };
            if (tc.semester) query.selectedSemester = tc.semester;
            if (tc.section) query.selectedSection = tc.section;

            const students = await Student.find(query).select('firstName lastName studentId profilePhoto selectedSemester').lean();
            
            const className = `${tc.courseName} ${tc.branchName ? '- ' + tc.branchName : ''} (Sem ${tc.semester || 1})`;
            
            groupedStudents.push({
                className,
                classId: `${tc.courseId}_${tc.branchId}_${tc.semester}`,
                students: students
            });
        }

        return NextResponse.json({ groupedStudents });
    } catch (error) {
        console.error("GET /api/staff/my-students error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
