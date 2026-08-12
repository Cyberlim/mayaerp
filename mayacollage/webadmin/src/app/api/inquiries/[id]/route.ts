import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Inquiry } from "@/models/Inquiry";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        
        const inquiry = await Inquiry.findByIdAndDelete(id);
        if (!inquiry) {
            return NextResponse.json({ message: "Inquiry not found" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Inquiry deleted successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("Inquiry DELETE Error:", error);
        return NextResponse.json({ message: "Error deleting inquiry", error: error.message }, { status: 500 });
    }
}
