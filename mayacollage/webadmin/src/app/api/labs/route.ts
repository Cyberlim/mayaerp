import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { LabFacility } from "@/models/LabFacility";
import { User } from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        const labs = await LabFacility.find()
            .populate('labIncharge', 'firstName lastName email')
            .sort({ createdAt: -1 });
        return NextResponse.json(labs);
    } catch (error: any) {
        console.error("Labs GET Error:", error);
        return NextResponse.json({ message: "Error fetching labs", error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        
        // Make sure labIncharge exists
        const incharge = await User.findById(body.labIncharge);
        if (!incharge) {
            return NextResponse.json({ message: "Lab in-charge not found" }, { status: 404 });
        }
        
        const lab = new LabFacility(body);
        await lab.save();
        return NextResponse.json({ message: "Lab created successfully", lab }, { status: 201 });
    } catch (error: any) {
        console.error("Labs POST Error:", error);
        return NextResponse.json({ message: "Error creating lab", error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { _id, ...updateData } = body;
        
        if (!_id) {
            return NextResponse.json({ message: "Lab ID is required" }, { status: 400 });
        }
        
        const lab = await LabFacility.findByIdAndUpdate(_id, updateData, { new: true });
        
        if (!lab) {
            return NextResponse.json({ message: "Lab not found" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Lab updated successfully", lab }, { status: 200 });
    } catch (error: any) {
        console.error("Labs PUT Error:", error);
        return NextResponse.json({ message: "Error updating lab", error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        
        if (!id) {
            return NextResponse.json({ message: "Lab ID is required" }, { status: 400 });
        }
        
        const lab = await LabFacility.findByIdAndDelete(id);
        
        if (!lab) {
            return NextResponse.json({ message: "Lab not found" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Lab deleted successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("Labs DELETE Error:", error);
        return NextResponse.json({ message: "Error deleting lab", error: error.message }, { status: 500 });
    }
}
