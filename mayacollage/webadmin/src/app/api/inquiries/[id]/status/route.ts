import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Inquiry } from "@/models/Inquiry";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json();
        const { status } = body;
        
        const inquiry = await Inquiry.findByIdAndUpdate(
            id, 
            { status }, 
            { new: true, runValidators: true }
        );
        
        if (!inquiry) {
            return NextResponse.json({ message: "Inquiry not found" }, { status: 404 });
        }
        
        return NextResponse.json(inquiry, { status: 200 });
    } catch (error: any) {
        console.error("Inquiry PATCH Status Error:", error);
        return NextResponse.json({ message: "Error updating inquiry status", error: error.message }, { status: 500 });
    }
}
