import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { LabFacility } from "@/models/LabFacility";
import { InventoryItem } from "@/models/InventoryItem";
import { LabIssue } from "@/models/LabIssue";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        
        const totalLabs = await LabFacility.countDocuments();
        
        const inventory = await InventoryItem.find();
        const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
        const lowStockCount = inventory.filter(item => item.availableQuantity <= item.lowStockThreshold).length;
        const damagedCount = inventory.filter(item => item.condition === 'Damaged').length;

        const activeIssues = await LabIssue.countDocuments({ status: { $in: ['Issued', 'Overdue'] } });
        const overdueIssues = await LabIssue.countDocuments({ status: 'Overdue' });

        return NextResponse.json({
            totalLabs,
            totalItems,
            lowStockCount,
            damagedCount,
            activeIssues,
            overdueIssues
        });
    } catch (error: any) {
        console.error("Labs Stats GET Error:", error);
        return NextResponse.json({ message: "Error fetching stats", error: error.message }, { status: 500 });
    }
}
