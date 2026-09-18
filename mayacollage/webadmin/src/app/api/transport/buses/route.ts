import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Bus } from "@/models/Bus";
import { Student } from "@/models/Student";
import { Branch } from "@/models/Branch";
import { Course } from "@/models/Course";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        
        // Register models
        if (!Student.schema) Student.init();
        if (!Branch.schema) Branch.init();
        if (!Course.schema) Course.init();
        
        const buses = await Bus.find().sort({ createdAt: -1 }).populate({
            path: 'students.student',
            select: 'firstName lastName email mobile studentId admissionNumber selectedBranch selectedProgram fees courseYear'
        });
        
        return NextResponse.json(buses);
    } catch (error: any) {
        console.error("Transport GET Buses Error:", error);
        return NextResponse.json({ message: "Error fetching buses", error: error.message }, { status: 500 });
    }
}
