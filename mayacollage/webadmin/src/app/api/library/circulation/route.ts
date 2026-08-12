import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { IssueBook } from "@/models/IssueBook";
import { LibrarySettings } from "@/models/LibrarySettings";
import { Student } from "@/models/Student";
import { Book } from "@/models/Book";

export const dynamic = 'force-dynamic';

const calculateFine = async (issue: any) => {
    if (issue.status === 'Returned' || !issue.dueDate) return 0;
    
    const now = new Date();
    const due = new Date(issue.dueDate);
    
    if (now > due) {
        const diffTime = Math.abs(now.getTime() - due.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 10) {
            const settings = await LibrarySettings.findOne() || { fineRatePerDay: 5 };
            return (diffDays - 10) * settings.fineRatePerDay;
        }
    }
    return 0;
};

export async function GET() {
    try {
        await connectDB();
        
        // Ensure models are registered
        Student.init();
        Book.init();

        const issues = await IssueBook.find({ isVerified: true })
            .populate('student', 'firstName lastName studentId')
            .populate('book', 'title author')
            .sort({ createdAt: -1 });
            
        const issuesWithFines = await Promise.all(issues.map(async (i: any) => {
            const fine = await calculateFine(i);
            const obj = i.toObject();
            return { ...obj, fine };
        }));
            
        return NextResponse.json(issuesWithFines);
    } catch (error: any) {
        console.error("Library Circulation GET Error:", error);
        return NextResponse.json({ message: "Error fetching issued books", error: error.message }, { status: 500 });
    }
}
