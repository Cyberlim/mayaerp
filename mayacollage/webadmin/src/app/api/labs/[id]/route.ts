import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { LabFacility } from "@/models/LabFacility";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json();
        
        const lab = await LabFacility.findByIdAndUpdate(id, body, { new: true });
        if (!lab) {
            return NextResponse.json({ message: "Lab not found" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Lab updated successfully", lab });
    } catch (error: any) {
        console.error("Labs PUT Error:", error);
        return NextResponse.json({ message: "Error updating lab", error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        
        const lab = await LabFacility.findByIdAndDelete(id);
        if (!lab) {
            return NextResponse.json({ message: "Lab not found" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Lab deleted successfully" });
    } catch (error: any) {
        console.error("Labs DELETE Error:", error);
        return NextResponse.json({ message: "Error deleting lab", error: error.message }, { status: 500 });
    }
}
