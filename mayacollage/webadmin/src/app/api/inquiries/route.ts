import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Inquiry } from "@/models/Inquiry";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        const inquiries = await Inquiry.find().sort({ createdAt: -1 });
        return NextResponse.json(inquiries);
    } catch (error: any) {
        console.error("Inquiries GET Error:", error);
        return NextResponse.json({ message: "Error fetching inquiries", error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const inquiryData = await req.json();
        
        // Handle avatar if not provided (same as UI avatars)
        if (!inquiryData.avatar && inquiryData.name) {
            inquiryData.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(inquiryData.name)}&background=random`;
        }

        const inquiry = new Inquiry(inquiryData);
        await inquiry.save();
        
        return NextResponse.json(inquiry, { status: 201 });
    } catch (error: any) {
        console.error("Inquiries POST Error:", error);
        return NextResponse.json({ message: "Error creating inquiry", error: error.message }, { status: 500 });
    }
}
