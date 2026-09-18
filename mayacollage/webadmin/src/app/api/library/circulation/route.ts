import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { IssueBook } from "@/models/IssueBook";
import { LibrarySettings } from "@/models/LibrarySettings";
import { Student } from "@/models/Student";
import { Book } from "@/models/Book";

export const dynamic = 'force-dynamic';

const calculateFine = async (issue: any) => {
    if (issue.status === 'Returned' || !issue.dueDate) return issue.fine || 0;
    
    const now = new Date();
    const due = new Date(issue.dueDate);
    
    if (now > due) {
        const diffTime = Math.abs(now.getTime() - due.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Fine rate: ₹5/day after due date
        const settings = await LibrarySettings.findOne() || { fineRatePerDay: 5 };
        const fineRate = settings.fineRatePerDay || 5;
        return diffDays * fineRate;
    }
    return 0;
};

export async function GET(req: Request) {
    try {
        await connectDB();
        
        // Ensure models are registered
        if (!Student.schema) Student.init();
        if (!Book.schema) Book.init();

        const { searchParams } = new URL(req.url);
        const statusParam = searchParams.get('status');

        let filter: any = {};
        if (statusParam && statusParam !== 'all') {
            filter.status = statusParam;
        }

        const issues = await IssueBook.find(filter)
            .populate('student', 'firstName lastName studentId admissionNumber email selectedProgram selectedBranch contactNumber')
            .populate('book', 'title author isbn category shelf price total available')
            .sort({ createdAt: -1 })
            .lean();
            
        const issuesWithFines = await Promise.all(issues.map(async (i: any) => {
            const calculatedFine = await calculateFine(i);
            const now = new Date();
            const due = i.dueDate ? new Date(i.dueDate) : now;
            const isOverdue = i.status !== 'Returned' && now > due;
            const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            return {
                ...i,
                fine: i.status === 'Returned' ? (i.fine || 0) : Math.max(i.fine || 0, calculatedFine),
                isOverdue,
                daysRemaining: diffDays,
                displayStatus: isOverdue && i.status === 'Active' ? 'Overdue' : i.status
            };
        }));
            
        return NextResponse.json(issuesWithFines);
    } catch (error: any) {
        console.error("Library Circulation GET Error:", error);
        return NextResponse.json({ message: "Error fetching issued books", error: error.message }, { status: 500 });
    }
}
