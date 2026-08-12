import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Book } from "@/models/Book";
import { IssueBook } from "@/models/IssueBook";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        
        const issue = await IssueBook.findById(id);
        if (!issue || issue.status === 'Returned') {
            return NextResponse.json({ message: "Invalid issue record" }, { status: 400 });
        }
        
        issue.status = 'Returned';
        issue.returnDate = new Date();
        await issue.save();
        
        // Update book availability
        await Book.findByIdAndUpdate(issue.book, { $inc: { available: 1 } });
        
        // Note: Socket emission is omitted in the Next.js API route implementation.
        
        return NextResponse.json({ message: "Book returned successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("Library Return PUT Error:", error);
        return NextResponse.json({ message: "Error returning book", error: error.message }, { status: 500 });
    }
}
