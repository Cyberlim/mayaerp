import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { SubjectLabMapping } from "@/models/SubjectLabMapping";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");

        let query: any = {};
        
        if (search) {
            query.$or = [
                { subject: { $regex: search, $options: "i" } },
                { course: { $regex: search, $options: "i" } },
                { branch: { $regex: search, $options: "i" } }
            ];
        }

        const mappings = await SubjectLabMapping.find(query)
            .populate('lab', 'labName roomNumber')
            .populate('faculty', 'firstName lastName email')
            .sort({ createdAt: -1 });
            
        return NextResponse.json(mappings);
    } catch (error: any) {
        console.error("LabMapping GET Error:", error);
        return NextResponse.json({ message: "Error fetching lab mappings", error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        
        const mapping = new SubjectLabMapping(body);
        await mapping.save();
        
        return NextResponse.json({ message: "Mapping created successfully", mapping }, { status: 201 });
    } catch (error: any) {
        console.error("LabMapping POST Error:", error);
        return NextResponse.json({ message: "Error creating mapping", error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { _id, ...updateData } = body;
        
        if (!_id) {
            return NextResponse.json({ message: "Mapping ID is required" }, { status: 400 });
        }
        
        const mapping = await SubjectLabMapping.findByIdAndUpdate(_id, updateData, { new: true });
        
        if (!mapping) {
            return NextResponse.json({ message: "Mapping not found" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Mapping updated successfully", mapping }, { status: 200 });
    } catch (error: any) {
        console.error("LabMapping PUT Error:", error);
        return NextResponse.json({ message: "Error updating mapping", error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        
        if (!id) {
            return NextResponse.json({ message: "Mapping ID is required" }, { status: 400 });
        }
        
        const mapping = await SubjectLabMapping.findByIdAndDelete(id);
        
        if (!mapping) {
            return NextResponse.json({ message: "Mapping not found" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Mapping deleted successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("LabMapping DELETE Error:", error);
        return NextResponse.json({ message: "Error deleting mapping", error: error.message }, { status: 500 });
    }
}
