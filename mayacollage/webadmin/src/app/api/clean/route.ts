import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Timetable } from "@/models/Timetable";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();
        const result = await Timetable.deleteMany({ targetType: "Teacher" });
        return NextResponse.json({ success: true, deletedCount: result.deletedCount });
    } catch (error) {
        console.error("Clean API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
