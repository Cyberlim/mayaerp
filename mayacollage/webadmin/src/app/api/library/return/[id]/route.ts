import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Book } from "@/models/Book";
import { IssueBook } from "@/models/IssueBook";
import { LibrarySettings } from "@/models/LibrarySettings";

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        
        let body: any = {};
        try {
            body = await req.json();
        } catch (_) {}

        const issue = await IssueBook.findById(id);
        if (!issue) {
            return NextResponse.json({ message: "Circulation record not found" }, { status: 404 });
        }

        const action = body.action || 'return'; // 'return' | 'lost' | 'renew'

        if (action === 'return') {
            if (issue.status === 'Returned') {
                return NextResponse.json({ message: "Book has already been returned" }, { status: 400 });
            }

            issue.status = 'Returned';
            issue.returnDate = new Date();
            if (body.fine !== undefined) {
                issue.fine = body.fine;
            }

            await issue.save();

            // Increment book available copies
            if (issue.book) {
                const book = await Book.findById(issue.book);
                if (book) {
                    book.available = Math.min(book.total, (book.available || 0) + 1);
                    await book.save();
                }
            }

            const populated = await IssueBook.findById(issue._id)
                .populate('student', 'firstName lastName studentId admissionNumber email')
                .populate('book', 'title author isbn category shelf price');

            // Non-blocking sync with remote
            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://mayaerp.onrender.com/api";
                fetch(`${backendUrl}/library/return/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                }).catch(() => {});
            } catch (_) {}

            return NextResponse.json({
                success: true,
                message: "Book returned successfully and inventory updated!",
                issue: populated
            }, { status: 200 });

        } else if (action === 'lost') {
            issue.status = 'Lost';
            issue.fine = body.fine || 500; // Replacement fine default
            await issue.save();

            const populated = await IssueBook.findById(issue._id)
                .populate('student', 'firstName lastName studentId admissionNumber email')
                .populate('book', 'title author isbn category shelf price');

            return NextResponse.json({
                success: true,
                message: "Book marked as Lost. Replacement fine recorded.",
                issue: populated
            }, { status: 200 });

        } else if (action === 'renew') {
            const addDays = body.days || 14;
            const newDue = new Date(Date.now() + addDays * 24 * 60 * 60 * 1000);
            issue.dueDate = newDue;
            issue.status = 'Active';
            issue.fine = 0;
            await issue.save();

            const populated = await IssueBook.findById(issue._id)
                .populate('student', 'firstName lastName studentId admissionNumber email')
                .populate('book', 'title author isbn category shelf price');

            return NextResponse.json({
                success: true,
                message: `Book loan renewed until ${newDue.toLocaleDateString()}!`,
                issue: populated
            }, { status: 200 });
        }

        return NextResponse.json({ message: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        console.error("Library Return Route Error:", error);
        return NextResponse.json({ message: "Error updating circulation record", error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        const issue = await IssueBook.findByIdAndDelete(id);
        if (!issue) return NextResponse.json({ message: "Record not found" }, { status: 404 });
        return NextResponse.json({ success: true, message: "Record removed" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
