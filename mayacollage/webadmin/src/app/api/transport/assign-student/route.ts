import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Bus } from "@/models/Bus";
import { Student } from "@/models/Student";

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { busId, studentId, stopName } = body;
        
        const bus = await Bus.findById(busId);
        if (!bus) return NextResponse.json({ message: 'Bus not found' }, { status: 404 });
        if (bus.filled >= bus.capacity) return NextResponse.json({ message: 'Bus is already full' }, { status: 400 });
        
        const studentAlreadyInBus = await Bus.findOne({
            $or: [
                { 'students.student': studentId },
                { 'students': { $elemMatch: { $eq: studentId } } }
            ]
        });
        
        if (studentAlreadyInBus) {
            return NextResponse.json({ message: 'Student is already assigned to a bus' }, { status: 400 });
        }

        const stop = bus.stops.find((s: any) => s.stationName === stopName);
        bus.students.push({
            student: studentId,
            stopName: stopName,
            fare: stop ? stop.price : 0,
            paymentStatus: 'Pending'
        });
        
        bus.filled = bus.students.length;
        await bus.save();
        
        Student.init();
        const updatedBus = await Bus.findById(busId).populate('students.student');
        
        return NextResponse.json(updatedBus, { status: 200 });
    } catch (error: any) {
        console.error("Transport POST Assign Student Error:", error);
        return NextResponse.json({ message: "Failed to assign student", error: error.message }, { status: 500 });
    }
}
