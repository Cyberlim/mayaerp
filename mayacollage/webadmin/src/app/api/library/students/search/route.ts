import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Student } from "@/models/Student";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");

        if (!query) {
            return NextResponse.json({ message: "Search query 'q' is required" }, { status: 400 });
        }

        // Search by admissionNumber, studentId, firstName, or lastName
        const students = await Student.find({
            $or: [
                { admissionNumber: { $regex: query, $options: 'i' } },
                { studentId: { $regex: query, $options: 'i' } },
                { firstName: { $regex: query, $options: 'i' } },
                { lastName: { $regex: query, $options: 'i' } }
            ]
        })
        .select('firstName lastName studentId admissionNumber email selectedProgram')
        .limit(10)
        .lean();

        return NextResponse.json(students, { status: 200 });
    } catch (error: any) {
        console.error("Library Student Search Error:", error);
        return NextResponse.json({ message: "Error searching students", error: error.message }, { status: 500 });
    }
}
