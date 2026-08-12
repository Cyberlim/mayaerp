import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Bus } from "@/models/Bus";
import { Student } from "@/models/Student";

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { busId, studentId } = body;
        
        const bus = await Bus.findById(busId);
        if (!bus) return NextResponse.json({ message: 'Bus not found' }, { status: 404 });
        
        bus.students = bus.students.filter((s: any) => {
            const sid = s.student ? s.student.toString() : s.toString();
            return sid !== studentId;
        });

        bus.filled = bus.students.length;
        await bus.save();
        
        Student.init();
        const updatedBus = await Bus.findById(busId).populate('students.student');
        
        return NextResponse.json(updatedBus, { status: 200 });
    } catch (error: any) {
        console.error("Transport POST Unassign Student Error:", error);
        return NextResponse.json({ message: "Failed to unassign student", error: error.message }, { status: 500 });
    }
}
