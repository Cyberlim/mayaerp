import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Bus } from "@/models/Bus";
import { Student } from "@/models/Student";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { busId, studentId } = body;
        
        if (!busId || !studentId) {
            return NextResponse.json({ message: "Bus ID and Student ID are required" }, { status: 400 });
        }

        const bus = await Bus.findById(busId);
        if (!bus) return NextResponse.json({ message: 'Bus not found' }, { status: 404 });
        
        bus.students = bus.students.filter((s: any) => {
            const sid = s.student?._id ? s.student._id.toString() : s.student?.toString();
            return sid !== studentId;
        });

        bus.filled = bus.students.length;
        await bus.save();
        
        // Reset transport fee on student
        const student = await Student.findById(studentId);
        if (student && student.fees?.years) {
            const currentYearNum = Number(student.courseYear) || 1;
            const yearObj = student.fees.years.find((y: any) => y.year === currentYearNum);
            if (yearObj && yearObj.transport) {
                yearObj.transport.total = 0;
                yearObj.transport.paid = 0;
                student.markModified('fees');
                await student.save();
            }
        }
        
        const updatedBus = await Bus.findById(busId).populate({
            path: 'students.student',
            select: 'firstName lastName email mobile studentId admissionNumber selectedBranch selectedProgram fees courseYear'
        });
        
        return NextResponse.json({
            success: true,
            message: "Student unassigned from bus and transport fee cleared.",
            bus: updatedBus
        }, { status: 200 });

    } catch (error: any) {
        console.error("Transport POST Unassign Student Error:", error);
        return NextResponse.json({ message: "Failed to unassign student", error: error.message }, { status: 500 });
    }
}
