import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { LabIssue } from "@/models/LabIssue";
import { InventoryItem } from "@/models/InventoryItem";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const status = url.searchParams.get('status');
        const labId = url.searchParams.get('lab');
        
        let query: any = {};
        if (status) query.status = status;
        if (labId) query.lab = labId;

        const issues = await LabIssue.find(query)
            .populate('item', 'itemName category')
            .populate('lab', 'labName roomNumber')
            .populate('issuedBy', 'firstName lastName')
            .sort({ createdAt: -1 });
            
        return NextResponse.json(issues);
    } catch (error: any) {
        console.error("Lab Issues GET Error:", error);
        return NextResponse.json({ message: "Error fetching issues", error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        
        const { item, issuedTo, issuedToModel, issuedToName, issuedToId, quantityIssued, expectedReturnDate, remarks, lab, issuedBy } = body;

        const inventoryItem = await InventoryItem.findById(item);
        if (!inventoryItem) {
            return NextResponse.json({ message: 'Inventory item not found' }, { status: 404 });
        }
        
        if (inventoryItem.availableQuantity < (quantityIssued || 1)) {
            return NextResponse.json({ message: `Not enough stock. Available: ${inventoryItem.availableQuantity}` }, { status: 400 });
        }

        // Decrease available quantity
        inventoryItem.availableQuantity -= (quantityIssued || 1);
        await inventoryItem.save();

        const issue = new LabIssue({
            item, 
            lab: lab || inventoryItem.lab, 
            issuedTo, 
            issuedToModel,
            issuedToName, 
            issuedToId, 
            quantityIssued: quantityIssued || 1, 
            expectedReturnDate, 
            remarks, 
            issuedBy
        });
        await issue.save();

        const populatedIssue = await issue.populate([
            { path: 'item', select: 'itemName category' },
            { path: 'lab', select: 'labName roomNumber' }
        ]);
        
        return NextResponse.json({ message: "Item issued successfully", issue: populatedIssue }, { status: 201 });
    } catch (error: any) {
        console.error("Lab Issues POST Error:", error);
        return NextResponse.json({ message: "Error issuing item", error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { _id, status, returnRemarks } = body;
        
        if (!_id) {
            return NextResponse.json({ message: "Issue ID is required" }, { status: 400 });
        }
        
        const issue = await LabIssue.findById(_id);
        
        if (!issue) {
            return NextResponse.json({ message: "Issue not found" }, { status: 404 });
        }

        if (issue.status !== "Returned" && status === "Returned") {
            // Restore inventory quantity
            const inventoryItem = await InventoryItem.findById(issue.item);
            if (inventoryItem) {
                inventoryItem.availableQuantity += (issue.quantityIssued || 1);
                await inventoryItem.save();
            }
            issue.returnDate = new Date();
        }
        
        issue.status = status;
        if (returnRemarks) issue.remarks = returnRemarks;
        
        await issue.save();
        
        return NextResponse.json({ message: "Issue updated successfully", issue }, { status: 200 });
    } catch (error: any) {
        console.error("Lab Issues PUT Error:", error);
        return NextResponse.json({ message: "Error updating issue", error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        
        if (!id) {
            return NextResponse.json({ message: "Issue ID is required" }, { status: 400 });
        }
        
        const issue = await LabIssue.findByIdAndDelete(id);
        
        if (!issue) {
            return NextResponse.json({ message: "Issue not found" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Issue deleted successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("Lab Issues DELETE Error:", error);
        return NextResponse.json({ message: "Error deleting issue", error: error.message }, { status: 500 });
    }
}
