import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Timetable } from "@/models/Timetable";
import { Course } from "@/models/Course";
import { Branch } from "@/models/Branch";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        let courseId = searchParams.get("courseId");
        let branchId = searchParams.get("branchId");
        let semester = searchParams.get("semester");
        let section = searchParams.get("section") || "Section A";

        if (!courseId || !branchId || !semester) {
            return NextResponse.json({ error: "Missing required query parameters" }, { status: 400 });
        }

        // Try to resolve names to IDs if they aren't valid ObjectIds (Backend logic compatibility)
        if (courseId && !mongoose.Types.ObjectId.isValid(courseId)) {
            const course = await Course.findOne({ name: courseId });
            if (course) courseId = course._id.toString();
        }

        if (branchId && !mongoose.Types.ObjectId.isValid(branchId)) {
            const branch = await Branch.findOne({ name: branchId });
            if (branch) branchId = branch._id.toString();
        }

        const timetable = await Timetable.findOne({ 
            courseId, 
            branchId, 
            semester: parseInt(semester, 10), 
            section 
        }).populate('schedule.slots.facultyUserId', 'firstName lastName email profilePhoto').lean();
            
        if (!timetable) return NextResponse.json({ schedule: [] }, { status: 200 });
        return NextResponse.json(timetable, { status: 200 });
    } catch (error: any) {
        console.error("Timetables GET Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        let { courseId, branchId, semester, section, schedule } = body;
        
        if (!courseId || !branchId || !semester) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Try to resolve names to IDs if they aren't valid ObjectIds
        if (courseId && !mongoose.Types.ObjectId.isValid(courseId)) {
            const course = await Course.findOne({ name: courseId });
            if (course) courseId = course._id.toString();
        }

        if (branchId && !mongoose.Types.ObjectId.isValid(branchId)) {
            const branch = await Branch.findOne({ name: branchId });
            if (branch) branchId = branch._id.toString();
        }

        // Update existing or create new
        const timetable = await Timetable.findOneAndUpdate(
            { courseId, branchId, semester, section: section || "Section A" },
            { schedule },
            { new: true, upsert: true }
        ).populate('schedule.slots.facultyUserId', 'firstName lastName');
        
        // Note: Socket emission is omitted in Next.js API.
        
        return NextResponse.json(timetable, { status: 200 });
    } catch (error: any) {
        console.error("Timetables POST Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
