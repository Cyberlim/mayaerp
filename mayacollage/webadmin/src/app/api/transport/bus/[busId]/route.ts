import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Bus } from "@/models/Bus";

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ busId: string }> }) {
    try {
        await connectDB();
        const { busId } = await params;
        const body = await req.json();
        
        const { busNo, driverName, conductorName, capacity, routeName, stops, status } = body;
        
        const updateData: any = {};
        if (busNo) updateData.busNo = busNo.trim();
        if (driverName) updateData.driverName = driverName.trim();
        if (conductorName) updateData.conductorName = conductorName.trim();
        if (capacity) updateData.capacity = Number(capacity);
        if (routeName) updateData.routeName = routeName.trim();
        if (status) updateData.status = status;
        if (Array.isArray(stops)) {
            updateData.stops = stops.map((s: any) => ({
                stationName: (s.stationName || "").trim(),
                price: Number(s.price) || 0
            }));
        }

        const updatedBus = await Bus.findByIdAndUpdate(busId, updateData, { new: true }).populate({
            path: 'students.student',
            select: 'firstName lastName email mobile studentId admissionNumber selectedBranch selectedProgram fees courseYear'
        });

        if (!updatedBus) {
            return NextResponse.json({ message: "Bus fleet not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: `Bus ${updatedBus.busNo} updated successfully!`,
            bus: updatedBus
        }, { status: 200 });

    } catch (error: any) {
        console.error("Transport PUT Bus Error:", error);
        return NextResponse.json({ message: "Error updating bus", error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ busId: string }> }) {
    try {
        await connectDB();
        const { busId } = await params;
        
        const bus = await Bus.findByIdAndDelete(busId);
        if (!bus) return NextResponse.json({ message: 'Bus not found' }, { status: 404 });
        
        return NextResponse.json({ success: true, message: 'Bus removed successfully from fleet' }, { status: 200 });
    } catch (error: any) {
        console.error("Transport DELETE Bus Error:", error);
        return NextResponse.json({ message: "Error deleting bus", error: error.message }, { status: 500 });
    }
}
