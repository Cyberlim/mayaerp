import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Book } from "@/models/Book";
import { IssueBook } from "@/models/IssueBook";
import { Student } from "@/models/Student";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { studentId, bookId, dueDate, remarks } = body;

        if (!studentId || !bookId) {
            return NextResponse.json({ message: "Student ID and Book ID are required" }, { status: 400 });
        }

        // Verify student exists
        const student = await Student.findById(studentId);
        if (!student) {
            return NextResponse.json({ message: "Student not found" }, { status: 404 });
        }

        // Verify book exists and has available copies
        const book = await Book.findById(bookId);
        if (!book) {
            return NextResponse.json({ message: "Book not found" }, { status: 404 });
        }

        if (book.available <= 0) {
            return NextResponse.json({ message: `"${book.title}" is currently out of stock (0 copies available)` }, { status: 400 });
        }

        // Decrement available copies
        book.available = Math.max(0, book.available - 1);
        await book.save();

        // Calculate due date (default 14 days if not provided)
        const parsedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

        // Create IssueBook record with verified=true so it displays immediately
        const issue = new IssueBook({
            student: studentId,
            book: bookId,
            issueDate: new Date(),
            dueDate: parsedDueDate,
            status: 'Active',
            fine: 0,
            isVerified: true,
            remarks: remarks || ''
        });

        await issue.save();

        const populatedIssue = await IssueBook.findById(issue._id)
            .populate('student', 'firstName lastName studentId admissionNumber email')
            .populate('book', 'title author isbn category shelf price');

        // Non-blocking attempt to notify external backend if running
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://mayaerp.onrender.com/api";
            fetch(`${backendUrl}/library/issue`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }).catch(() => {});
        } catch (_) {}

        return NextResponse.json({
            success: true,
            message: `Book "${book.title}" successfully issued to ${student.firstName} ${student.lastName}!`,
            issue: populatedIssue
        }, { status: 201 });

    } catch (error: any) {
        console.error("Library Direct Issue Error:", error);
        return NextResponse.json({ message: "Error issuing book", error: error.message }, { status: 500 });
    }
}
