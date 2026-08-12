import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Timetable } from "@/models/Timetable";
import { Student } from "@/models/Student";
import { Exam } from "@/models/Exam";
import { Notice } from "@/models/Notice";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { User } from "@/models/User";
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

        // 1. Get total students (mock logic: all students)
        const totalStudents = await Student.countDocuments();
        
        // 2. Get upcoming exams (mock logic: all upcoming)
        const pendingExams = await Exam.countDocuments({ status: "Grading" });

        // 3. Get notices (limit 3)
        const notices = await Notice.find().sort({ createdAt: -1 }).limit(3);

        // 4. Get schedule for TODAY
        const todayDayName = DAYS[new Date().getDay()];
        const timetables = await Timetable.find({ targetType: "Class" }).populate('courseId branchId').lean();
        
        let todayClasses: any[] = [];
        let uniqueCourses = new Set<string>();
        let weeklyClassesCount = 0;

        for (const tt of timetables) {
            if (!tt.schedule) continue;
            
            // Collect unique courses the staff teaches
            let teachesHere = false;
            for (const dayPlan of tt.schedule) {
                if (dayPlan.slots) {
                    const mySlots = dayPlan.slots.filter((s: any) => s.facultyUserId?.toString() === staffId);
                    if (mySlots.length > 0) {
                        teachesHere = true;
                        weeklyClassesCount += mySlots.length;
                    }
                }
            }
            if (teachesHere && tt.courseId) {
                uniqueCourses.add((tt.courseId as any).name || "Unknown Course");
            }

            for (const dayPlan of tt.schedule) {
                if (dayPlan.day !== todayDayName || !dayPlan.slots) continue;
                
                const mySlots = dayPlan.slots.filter((s: any) => s.facultyUserId?.toString() === staffId);
                for (const slot of mySlots) {
                    let className = "N/A";
                    if (tt.courseId) {
                        const courseName = (tt.courseId as any).name || '';
                        const branchName = (tt.branchId as any)?.name ? ` - ${(tt.branchId as any).name}` : '';
                        className = `${courseName}${branchName}`;
                    }

                    // Determine status (mocked based on current time could be added, just defaulting to Upcoming)
                    todayClasses.push({
                        subject: slot.subject || "Subject",
                        class: className,
                        time: `${slot.startTime} - ${slot.endTime}`,
                        room: slot.location || "TBA",
                        status: "Upcoming"
                    });
                }
            }
        }
        
        // Fetch the user to personalize the dashboard
        const staffUser = await User.findById(staffId).lean() as any;
        const staffName = staffUser ? `${staffUser.firstName} ${staffUser.lastName}` : "Staff";

        return NextResponse.json({
            kpis: {
                classesToday: todayClasses.length,
                programsTaught: uniqueCourses.size || 0,
                weeklyClasses: weeklyClassesCount
            },
            schedule: todayClasses,
            notices: notices,
            staffProfile: { 
                name: staffName,
                profilePhoto: staffUser?.profilePhoto || null
            }
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
