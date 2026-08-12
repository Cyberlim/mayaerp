import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Bus } from "@/models/Bus";
import { Student } from "@/models/Student";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        // Register Student model if not already
        Student.init();
        
        const buses = await Bus.find().populate({
            path: 'students.student',
            select: 'firstName lastName studentEmail applicantPhoto selectedBranch selectedProgram'
        });
        return NextResponse.json(buses);
    } catch (error: any) {
        console.error("Transport GET Buses Error:", error);
        return NextResponse.json({ message: "Error fetching buses", error: error.message }, { status: 500 });
    }
}
