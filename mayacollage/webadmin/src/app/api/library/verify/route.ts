import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Book } from "@/models/Book";
import { IssueBook } from "@/models/IssueBook";

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { issueId, otp } = body;
        
        const issue = await IssueBook.findById(issueId);
        
        if (!issue) return NextResponse.json({ message: "Issue record not found" }, { status: 404 });
        if (issue.isVerified) return NextResponse.json({ message: "Already verified" }, { status: 400 });
        
        if (issue.otp !== otp) {
            return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
        }
        
        issue.isVerified = true;
        await issue.save();
        
        // Update book availability
        await Book.findByIdAndUpdate(issue.book, { $inc: { available: -1 } });
        
        // Note: Socket emission is omitted in the Next.js API route implementation.
        
        return NextResponse.json({ message: "Book issued successfully and verified" }, { status: 200 });
    } catch (error: any) {
        console.error("Library Verify POST Error:", error);
        return NextResponse.json({ message: "Verification error", error: error.message }, { status: 500 });
    }
}
