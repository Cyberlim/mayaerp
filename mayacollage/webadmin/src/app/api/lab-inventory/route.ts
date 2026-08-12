import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { InventoryItem } from "@/models/InventoryItem";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const labId = url.searchParams.get('lab');
        const category = url.searchParams.get('category');
        const status = url.searchParams.get('condition');
        const search = url.searchParams.get('search');
        
        let query: any = {};
        if (labId) query.lab = labId;
        if (category) query.category = category;
        if (status) query.condition = status;
        if (search) {
            query.$or = [
                { itemName: { $regex: search, $options: 'i' } },
                { itemCode: { $regex: search, $options: 'i' } }
            ];
        }

        const items = await InventoryItem.find(query)
            .populate('lab', 'labName roomNumber')
            .sort({ createdAt: -1 });
            
        return NextResponse.json(items);
    } catch (error: any) {
        console.error("Lab Inventory GET Error:", error);
        return NextResponse.json({ message: "Error fetching inventory", error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const item = new InventoryItem(body);
        await item.save();
        return NextResponse.json({ message: "Item added successfully", item }, { status: 201 });
    } catch (error: any) {
        console.error("Lab Inventory POST Error:", error);
        return NextResponse.json({ message: "Error adding item", error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { _id, ...updateData } = body;
        
        if (!_id) {
            return NextResponse.json({ message: "Item ID is required" }, { status: 400 });
        }
        
        const item = await InventoryItem.findByIdAndUpdate(_id, updateData, { new: true });
        
        if (!item) {
            return NextResponse.json({ message: "Item not found" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Item updated successfully", item }, { status: 200 });
    } catch (error: any) {
        console.error("Lab Inventory PUT Error:", error);
        return NextResponse.json({ message: "Error updating item", error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        
        if (!id) {
            return NextResponse.json({ message: "Item ID is required" }, { status: 400 });
        }
        
        const item = await InventoryItem.findByIdAndDelete(id);
        
        if (!item) {
            return NextResponse.json({ message: "Item not found" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Item deleted successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("Lab Inventory DELETE Error:", error);
        return NextResponse.json({ message: "Error deleting item", error: error.message }, { status: 500 });
    }
}
