import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { LibrarySettings } from "@/models/LibrarySettings";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        
        let settings = await LibrarySettings.findOne();
        if (!settings) {
            settings = await LibrarySettings.create({});
        }
        
        return NextResponse.json(settings);
    } catch (error: any) {
        console.error("Library Settings GET Error:", error);
        return NextResponse.json({ message: "Error fetching settings", error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        
        let settings = await LibrarySettings.findOne();
        if (!settings) {
            settings = await LibrarySettings.create(body);
        } else {
            settings = await LibrarySettings.findByIdAndUpdate(settings._id, body, { new: true });
        }
        
        return NextResponse.json(settings);
    } catch (error: any) {
        console.error("Library Settings POST Error:", error);
        return NextResponse.json({ message: "Error updating settings", error: error.message }, { status: 500 });
    }
}
