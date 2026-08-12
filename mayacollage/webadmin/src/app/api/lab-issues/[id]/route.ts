import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { LabIssue } from "@/models/LabIssue";
import { InventoryItem } from "@/models/InventoryItem";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json();
        
        const { returnStatus, remarks } = body;
        
        const issue = await LabIssue.findById(id);
        if (!issue) {
            return NextResponse.json({ message: "Issue record not found" }, { status: 404 });
        }
        
        if (issue.status === 'Returned') {
            return NextResponse.json({ message: "Item already returned" }, { status: 400 });
        }
        
        issue.status = returnStatus || 'Returned';
        issue.returnDate = new Date();
        if (remarks) issue.remarks = remarks;
        await issue.save();

        // Restore available quantity if properly returned
        if (returnStatus === 'Returned' || !returnStatus) {
            await InventoryItem.findByIdAndUpdate(issue.item, {
                $inc: { availableQuantity: issue.quantityIssued }
            });
        } else if (returnStatus === 'Damaged') {
            // Mark item condition but still restore quantity
            await InventoryItem.findByIdAndUpdate(issue.item, {
                condition: 'Damaged',
                $inc: { availableQuantity: issue.quantityIssued }
            });
        }
        
        return NextResponse.json({ message: "Item return processed", issue });
    } catch (error: any) {
        console.error("Lab Issues PUT Error:", error);
        return NextResponse.json({ message: "Error returning item", error: error.message }, { status: 500 });
    }
}
