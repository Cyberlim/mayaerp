import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
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
        const studentId = searchParams.get('studentId');
        const subject = searchParams.get('subject'); // Optional, to filter by current subject

        if (!studentId) {
            return NextResponse.json({ error: "Missing student ID" }, { status: 400 });
        }

        let query: any = { student: studentId };
        if (subject) {
            query.subject = subject;
        }

        // Fetch last 30 days of attendance
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        query.date = { $gte: thirtyDaysAgo };

        const history = await Attendance.find(query).sort({ date: -1 }).lean();

        return NextResponse.json({ history });
    } catch (error) {
        console.error("Attendance History API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
