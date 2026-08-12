import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Book } from "@/models/Book";
import { IssueBook } from "@/models/IssueBook";

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { student, book, dueDate } = body;
        
        // 1. Check if book exists and is available
        const bookDoc = await Book.findById(book);
        if (!bookDoc || bookDoc.available <= 0) {
            return NextResponse.json({ message: "Book not available" }, { status: 400 });
        }
        
        // 2. Check if student already has 5 books (Policy)
        const activeIssues = await IssueBook.countDocuments({ student, isVerified: true, status: { $in: ['Active', 'Overdue'] } });
        if (activeIssues >= 5) {
            return NextResponse.json({ message: "Student reached maximum limit of 5 books" }, { status: 400 });
        }
        
        // 3. Generate random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 4. Create issue record (Unverified)
        const issue = new IssueBook({
            student,
            book,
            dueDate,
            otp,
            isVerified: false,
            status: 'Active'
        });
        
        await issue.save();
        
        // Note: Socket emission is omitted in the Next.js API route implementation.
        
        return NextResponse.json({ 
            issueId: issue._id, 
            message: "OTP generated. Please verify to complete issue.",
            otp: otp 
        }, { status: 201 });
    } catch (error: any) {
        console.error("Library Issue POST Error:", error);
        return NextResponse.json({ message: "Error issuing book", error: error.message }, { status: 500 });
    }
}
