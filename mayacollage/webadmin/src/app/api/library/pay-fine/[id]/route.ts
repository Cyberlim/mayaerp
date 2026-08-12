import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { IssueBook } from "@/models/IssueBook";
import { LibrarySettings } from "@/models/LibrarySettings";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        
        const issue = await IssueBook.findById(id);
        if (!issue) {
            return NextResponse.json({ message: "Loan record not found" }, { status: 404 });
        }
        
        const settings = await LibrarySettings.findOne() || { issueDurationDays: 14 };
        
        // When fine is paid, we effectively renew the book to clear the overdue status
        const newDueDate = new Date();
        newDueDate.setDate(newDueDate.getDate() + settings.issueDurationDays);
        
        issue.dueDate = newDueDate;
        issue.status = 'Active';
        await issue.save();
        
        return NextResponse.json({ message: "Fine paid and book loan renewed successfully", newDueDate }, { status: 200 });
    } catch (error: any) {
        console.error("Library Pay-Fine PUT Error:", error);
        return NextResponse.json({ message: "Error processing payment", error: error.message }, { status: 500 });
    }
}
