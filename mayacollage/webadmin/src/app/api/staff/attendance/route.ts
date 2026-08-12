import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Timetable } from "@/models/Timetable";
import { Attendance } from "@/models/Attendance";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { Course } from "@/models/Course";
import { Branch } from "@/models/Branch";

export const dynamic = 'force-dynamic';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get('date');
        
        let targetDate = new Date();
        if (dateStr) {
            // Split string to prevent UTC timezone shift
            const [year, month, day] = dateStr.split('-');
            targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }

        const dayOfWeek = DAYS[targetDate.getDay()]; // e.g. 'Monday'

        const timetables = await Timetable.find({ targetType: "Class" }).populate('courseId').populate('branchId').lean();
        
        console.log(`[ATTENDANCE_API] TargetDate: ${targetDate.toISOString()}, DayOfWeek: ${dayOfWeek}`);
        console.log(`[ATTENDANCE_API] Found ${timetables.length} Class timetables. Staff ID: ${staffId}`);

        let classes: any[] = [];

        for (const tt of timetables) {
            if (!tt.schedule) continue;
            
            const dayPlan = tt.schedule.find((d: any) => d.day === dayOfWeek);
            if (!dayPlan || !dayPlan.slots) continue;
            
            const mySlots = dayPlan.slots.filter((s: any) => s.facultyUserId?.toString() === staffId);
            if (mySlots.length > 0) {
                 console.log(`[ATTENDANCE_API] Found ${mySlots.length} slots for this staff on ${dayOfWeek} in Course: ${(tt.courseId as any)?.name}`);
            }
            
            for (const slot of mySlots) {
                // Check if attendance is already marked for this date and slot
                // We check based on subject and date
                const startOfDay = new Date(targetDate);
                startOfDay.setHours(0, 0, 0, 0);
                
                const endOfDay = new Date(targetDate);
                endOfDay.setHours(23, 59, 59, 999);

                const attendanceRecordCount = await Attendance.countDocuments({
                    subject: slot.subject,
                    date: { $gte: startOfDay, $lte: endOfDay }
                });
                
                const courseName = (tt.courseId as any)?.name || 'Unknown Course';
                const branchName = (tt.branchId as any)?.name ? ` - ${(tt.branchId as any).name}` : '';
                const fullClassName = `${courseName}${branchName}`;

                classes.push({
                    id: slot._id || Math.random().toString(),
                    name: slot.subject,
                    className: fullClassName, // Custom property to display
                    time: `${slot.startTime} - ${slot.endTime}`,
                    room: slot.location,
                    completed: attendanceRecordCount > 0,
                    present: attendanceRecordCount > 0 ? await Attendance.countDocuments({ subject: slot.subject, date: { $gte: startOfDay, $lte: endOfDay }, status: 'Present' }) : 0,
                    courseId: tt.courseId?._id,
                    branchId: tt.branchId?._id,
                    subjectCode: slot.subject // mapping subject name as code for now
                });
            }
        }

        return NextResponse.json({ classes });
    } catch (error) {
        console.error("Attendance API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();

        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('auth_token');
        
        if (!tokenCookie || !tokenCookie.value) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { date, subject, subjectCode, course, department, section, attendanceRecords } = body;

        if (!date || !subject || !attendanceRecords) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Validate date (not future, max 2 days past)
        const [year, month, day] = date.split('-');
        const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        targetDate.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - targetDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return NextResponse.json({ error: "Cannot mark attendance for future dates" }, { status: 400 });
        }
        if (diffDays > 2) {
            return NextResponse.json({ error: "Cannot mark attendance for dates older than 2 days" }, { status: 400 });
        }

        // Process attendance records
        const operations = attendanceRecords.map((record: any) => ({
            updateOne: {
                filter: {
                    student: record.studentId, // Mongoose ObjectId
                    date: targetDate,
                    subject: subject
                },
                update: {
                    $set: {
                        studentId: record.enrollmentNumber, // Display ID
                        studentName: record.studentName,
                        status: record.status, // 'Present', 'Absent', 'Late'
                        course: course || 'Unknown',
                        department: department || 'Unknown',
                        section: section || 'Section A',
                        subjectCode: subjectCode || subject
                    }
                },
                upsert: true
            }
        }));

        if (operations.length > 0) {
            await Attendance.bulkWrite(operations);
        }

        return NextResponse.json({ message: "Attendance marked successfully" });
    } catch (error: any) {
        console.error("Attendance API POST Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
