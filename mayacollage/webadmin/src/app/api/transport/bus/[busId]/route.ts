import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Bus } from "@/models/Bus";

export async function DELETE(req: Request, { params }: { params: Promise<{ busId: string }> }) {
    try {
        await connectDB();
        const { busId } = await params;
        
        await Bus.findByIdAndDelete(busId);
        
        return NextResponse.json({ message: 'Bus removed successfully' }, { status: 200 });
    } catch (error: any) {
        console.error("Transport DELETE Bus Error:", error);
        return NextResponse.json({ message: "Error deleting bus", error: error.message }, { status: 500 });
    }
}
