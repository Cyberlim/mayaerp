import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Book } from "@/models/Book";
import { IssueBook } from "@/models/IssueBook";
import { LibrarySettings } from "@/models/LibrarySettings";

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
        
        const totalBooks = await Book.countDocuments();
        const activeIssues = await IssueBook.find({ isVerified: true, status: { $in: ['Active', 'Overdue'] } });
        const overdueBooksCount = await IssueBook.countDocuments({ isVerified: true, status: 'Overdue' });
        const totalStock = await Book.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]);

        // Unique students with active books
        const uniqueConsumers = await IssueBook.distinct('student', { isVerified: true, status: { $in: ['Active', 'Overdue'] } });

        // Calculate total pending fine
        let totalFineDues = 0;
        await Promise.all(activeIssues.map(async (i: any) => {
            const fine = await calculateFine(i);
            totalFineDues += fine;
        }));

        // Get category breakdown
        const categoryStats = await Book.aggregate([
            { $group: { _id: '$category', count: { $sum: '$total' }, unique: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Libro Dashboard specific metrics
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const newBooksAdded = await Book.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
        const lostBooks = await IssueBook.countDocuments({ status: 'Lost' });
        const availableStock = await Book.aggregate([{ $group: { _id: null, total: { $sum: '$available' } } }]);
        const availableBooksCount = availableStock[0]?.total || 0;

        // Fetch recent issues for activity feed
        const recentActivity = await IssueBook.find()
            .populate('student', 'firstName lastName')
            .populate('book', 'title category')
            .sort({ createdAt: -1 })
            .limit(5);

        // Fetch notifications (e.g. out of stock or no shelf)
        const lowStockBooks = await Book.find({ available: 0 }).limit(2);
        const missingShelfBooks = await Book.find({ shelf: { $exists: false } }).limit(2);

        const recentIssueEvents = await IssueBook.find({ status: { $in: ['Active', 'Overdue'] } })
            .populate('student', 'firstName lastName')
            .populate('book', 'title')
            .sort({ createdAt: -1 })
            .limit(2);

        const recentReturnEvents = await IssueBook.find({ status: 'Returned' })
            .populate('student', 'firstName lastName')
            .populate('book', 'title')
            .sort({ updatedAt: -1 })
            .limit(2);

        // Fetch recent books
        const recentBooks = await Book.find()
            .sort({ createdAt: -1 })
            .limit(3);

        const notifications = [
            ...recentIssueEvents.map(issue => ({
                text: `${issue.student?.firstName || 'Student'} borrowed '${issue.book?.title || 'a book'}'.`,
                time: 'Recently issued',
                type: 'issue'
            })),
            ...recentReturnEvents.map(issue => ({
                text: `${issue.student?.firstName || 'Student'} returned '${issue.book?.title || 'a book'}'.`,
                time: 'Recently returned',
                type: 'return'
            })),
            ...lowStockBooks.map(b => ({
                text: `${b.title} books are out of stock.`,
                time: 'Just now',
                type: 'low_stock'
            })),
            ...missingShelfBooks.map(b => ({
                text: `${b.title} is not assigned to any shelf.`,
                time: '2 hours ago',
                type: 'missing_shelf'
            }))
        ];
        
        return NextResponse.json({
            // Old stats (kept for backward compatibility if needed)
            totalUniqueBooks: totalBooks,
            totalStock: totalStock[0]?.total || 0,
            activeIssues: activeIssues.length,
            overdue: overdueBooksCount,
            uniqueActiveConsumers: uniqueConsumers.length,
            totalFineDues: totalFineDues,
            categoryStats: categoryStats,
            
            // New Libro Dashboard stats
            newBooksCount: newBooksAdded,
            lostBooksCount: lostBooks,
            borrowedBooksCount: activeIssues.length,
            availableBooksCount: availableBooksCount,
            reportStats: {
                total: totalStock[0]?.total || 0,
                new: newBooksAdded,
                issued: activeIssues.length,
                lost: lostBooks,
                available: availableBooksCount
            },
            activityFeed: recentActivity,
            recentBooks: recentBooks,
            notifications: notifications
        });
    } catch (error: any) {
        console.error("Library Stats GET Error:", error);
        return NextResponse.json({ message: "Error fetching library stats", error: error.message }, { status: 500 });
    }
}
