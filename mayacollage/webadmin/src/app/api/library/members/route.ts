import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { IssueBook } from "@/models/IssueBook";
import { LibrarySettings } from "@/models/LibrarySettings";
import { Student } from "@/models/Student";

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
        Student.init();

        const allIssues = await IssueBook.find({ isVerified: true })
            .populate('student', 'firstName lastName studentId email enrollmentNo')
            .populate('book', 'title')
            .lean();

        const membersMap = new Map();

        for (const issue of allIssues) {
            const studentId = issue.student?._id?.toString();
            if (!studentId) continue;

            const fine = await calculateFine(issue);

            if (!membersMap.has(studentId)) {
                membersMap.set(studentId, {
                    student: issue.student,
                    activeBorrows: 0,
                    totalFines: 0,
                    history: []
                });
            }

            const member = membersMap.get(studentId);
            
            if (issue.status === 'Active' || issue.status === 'Overdue') {
                member.activeBorrows += 1;
            }
            
            member.totalFines += fine;
            
            member.history.push({
                book: issue.book?.title,
                issueDate: issue.createdAt,
                dueDate: issue.dueDate,
                status: issue.status,
                fine
            });
        }

        return NextResponse.json(Array.from(membersMap.values()));
    } catch (error: any) {
        console.error("Library Members GET Error:", error);
        return NextResponse.json({ message: "Error fetching library members", error: error.message }, { status: 500 });
    }
}
