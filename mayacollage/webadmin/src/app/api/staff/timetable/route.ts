import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Timetable } from "@/models/Timetable";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { Course } from "@/models/Course";
import { Branch } from "@/models/Branch";

export const dynamic = 'force-dynamic';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

        // Fetch all class timetables and extract only the slots assigned to this staff member
        const timetables = await Timetable.find({ targetType: "Class" }).populate('courseId branchId').lean();
        
        const mySchedule = DAYS.map(day => ({ day, slots: [] as any[] }));

        for (const tt of timetables) {
            if (!tt.schedule) continue;
            for (const dayPlan of tt.schedule) {
                if (!dayPlan.slots) continue;
                const mySlots = dayPlan.slots.filter((s: any) => s.facultyUserId?.toString() === staffId);
                if (mySlots.length > 0) {
                    const dayIndex = mySchedule.findIndex(d => d.day === dayPlan.day);
                    if (dayIndex !== -1) {
                        const augmentedSlots = mySlots.map((s: any) => {
                            let calculatedClassInfo = s.classInfo || '';
                            if (tt.courseId) {
                                const courseName = (tt.courseId as any).name || '';
                                const branchName = (tt.branchId as any)?.name ? ` (${(tt.branchId as any).name})` : '';
                                const semText = tt.semester ? ` | Sem ${tt.semester}` : '';
                                const secText = tt.section ? ` | Sec ${tt.section}` : '';
                                calculatedClassInfo = `${courseName}${branchName}${semText}${secText}`;
                            }
                            return { ...s, classInfo: calculatedClassInfo };
                        });
                        mySchedule[dayIndex].slots.push(...augmentedSlots);
                    }
                }
            }
        }

        // Sort slots by start time
        for (const day of mySchedule) {
            day.slots.sort((a, b) => {
                if (!a.startTime && !b.startTime) return 0;
                if (!a.startTime) return 1;
                if (!b.startTime) return -1;
                return a.startTime.localeCompare(b.startTime);
            });
        }

        return NextResponse.json({ schedule: mySchedule });
    } catch (error) {
        console.error("Timetable API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
