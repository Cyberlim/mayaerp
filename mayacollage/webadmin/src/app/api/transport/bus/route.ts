import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Bus } from "@/models/Bus";

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { busNo, driverName, conductorName, capacity, routeName, stops } = body;
        
        if (!busNo || !driverName || !conductorName || !capacity || !routeName) {
            return NextResponse.json({ message: 'Missing required fleet coordinates' }, { status: 400 });
        }
        
        const existingBus = await Bus.findOne({ busNo: busNo.trim() });
        if (existingBus) {
            return NextResponse.json({ message: 'Fleet ID already exists in system' }, { status: 400 });
        }
        
        const newBus = await Bus.create({
            busNo: busNo.trim(),
            driverName: driverName.trim(),
            conductorName: conductorName.trim(),
            capacity: Number(capacity),
            routeName: routeName.trim(),
            stops: Array.isArray(stops) ? stops.map((s: any) => ({
                stationName: (s.stationName || "").trim(),
                price: Number(s.price) || 0
            })) : []
        });
        
        return NextResponse.json(newBus, { status: 201 });
    } catch (error: any) {
        console.error("Transport POST Bus Error:", error);
        return NextResponse.json({ message: "Error creating bus", error: error.message }, { status: 500 });
    }
}
