import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { Attendance } from "@/models/Attendance";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();
        
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('auth_token');
        
        if (!tokenCookie || !tokenCookie.value) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get('courseId');
        const branchId = searchParams.get('branchId');
        const dateStr = searchParams.get('date');
        const subject = searchParams.get('subject');

        if (!courseId || !branchId || !dateStr || !subject) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        const [year, month, day] = dateStr.split('-');
        const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        targetDate.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch students matching the timetable criteria
        let query: any = {
            selectedProgram: courseId,
            selectedBranch: branchId
        };

        const students = await Student.find(query).select("_id firstName lastName enrollmentNumber studentId").lean();

        // Fetch existing attendance for these students on this date for this subject
        const attendances = await Attendance.find({
            date: { $gte: targetDate, $lte: endOfDay },
            subject: subject,
            student: { $in: students.map(s => s._id) }
        }).lean();

        const attendanceMap = new Map();
        for (const att of attendances) {
            attendanceMap.set(att.student.toString(), att.status);
        }

        const responseStudents = students.map((s: any) => ({
            id: s._id,
            name: `${s.firstName} ${s.lastName || ''}`.trim(),
            enrollmentNumber: s.enrollmentNumber || s.studentId || 'N/A',
            status: attendanceMap.get(s._id.toString()) || 'Not Marked' // Default to Not Marked if not marked yet
        }));

        // Sort alphabetically by name
        responseStudents.sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({ students: responseStudents });
    } catch (error) {
        console.error("Attendance Students API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
