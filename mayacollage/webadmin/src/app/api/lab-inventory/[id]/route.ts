import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { InventoryItem } from "@/models/InventoryItem";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json();
        
        const item = await InventoryItem.findByIdAndUpdate(id, body, { new: true });
        if (!item) {
            return NextResponse.json({ message: "Item not found" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Item updated successfully", item });
    } catch (error: any) {
        console.error("Lab Inventory PUT Error:", error);
        return NextResponse.json({ message: "Error updating item", error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        
        const item = await InventoryItem.findByIdAndDelete(id);
        if (!item) {
            return NextResponse.json({ message: "Item not found" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Item deleted successfully" });
    } catch (error: any) {
        console.error("Lab Inventory DELETE Error:", error);
        return NextResponse.json({ message: "Error deleting item", error: error.message }, { status: 500 });
    }
}
