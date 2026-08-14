import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Exam } from "@/models/Exam";

import { Branch } from "@/models/Branch";
import { Course } from "@/models/Course";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();
        
        // Fetch exams
        const exams = await Exam.find()
            .sort({ createdAt: -1 })
            .populate({ path: 'branchId', model: Branch, select: 'name' })
            .populate({ path: 'courseId', model: Course, select: 'name' });

        return NextResponse.json({ exams });
    } catch (error) {
        console.error("Exams API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
