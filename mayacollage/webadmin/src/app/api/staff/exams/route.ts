import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Exam } from "@/models/Exam";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();
        
        // Fetch exams
        const exams = await Exam.find().sort({ date: 1 });

        return NextResponse.json({ exams });
    } catch (error) {
        console.error("Exams API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
