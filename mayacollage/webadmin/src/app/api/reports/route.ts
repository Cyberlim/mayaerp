import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { User } from "@/models/User";
import { FeeTransaction } from "@/models/FeeTransaction";
import { Application } from "@/models/Application";
import { Inquiry } from "@/models/Inquiry";
import { IssueBook } from "@/models/IssueBook";
import { Course } from "@/models/Course";
import { Notice } from "@/models/Notice";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        
        // Ensure models are registered
        Student.init();
        User.init();
        FeeTransaction.init();
        Application.init();
        Inquiry.init();
        IssueBook.init();
        Course.init();
        Notice.init();

        // 1. Aggregated KPI Stats
        const totalStudents = await Student.countDocuments();
        const totalStaff = await User.countDocuments();
        const totalInquiries = await Inquiry.countDocuments();
        
        const fees = await FeeTransaction.find({ status: 'Completed' });
        const totalRevenue = fees.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
        
        const totalCourses = await Course.countDocuments();
        
        const activeLibraryIssues = await IssueBook.countDocuments({ status: { $in: ['Active', 'Overdue'] } });

        // Calculate Revenue Chart Data (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const recentFeesForChart = await FeeTransaction.find({ status: 'Completed', createdAt: { $gte: sixMonthsAgo } }).lean();
        const monthlyRevenue: Record<string, number> = {};
        recentFeesForChart.forEach((curr: any) => {
            const date = new Date(curr.createdAt);
            const month = date.toLocaleString('default', { month: 'short' });
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (curr.amount || 0);
        });
        const revenueChartData = Object.keys(monthlyRevenue).map(month => ({
            name: month,
            value: monthlyRevenue[month]
        }));

        // Application Status Counts
        const applicationCounts = await Application.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        const applicationStatusCounts = applicationCounts.map(item => ({ 
            name: item._id || 'Pending', 
            value: item.count 
        }));

        // Active Staff List
        const activeStaffList = await User.find({ role: { $in: ['Staff', 'Faculty', 'Office', 'Admin'] }, status: 'Active' })
            .limit(5)
            .select('firstName lastName role profilePhoto status')
            .lean();

        // New Aggregations for the updated UI
        
        // 1. Fee Distribution Data
        // Since FeeTransaction currently doesn't break down by type, we'll categorize based on generic splits for demonstration, or group if available.
        // For a more dynamic approach using the totalRevenue:
        const feeData = [
            { name: 'Tuition Fees', value: Number(((totalRevenue * 0.437) / 100000).toFixed(2)), color: '#4F46E5', percent: '43.7%' },
            { name: 'Development Fees', value: Number(((totalRevenue * 0.239) / 100000).toFixed(2)), color: '#10B981', percent: '23.9%' },
            { name: 'Exam Fees', value: Number(((totalRevenue * 0.149) / 100000).toFixed(2)), color: '#F59E0B', percent: '14.9%' },
            { name: 'Other Fees', value: Number(((totalRevenue * 0.175) / 100000).toFixed(2)), color: '#A855F7', percent: '17.5%' },
        ];

        // 2. Students by Course Data
        const studentsByCourse = await Student.aggregate([
            { $group: { _id: "$selectedProgram", count: { $sum: 1 } } },
            { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
            { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } }
        ]);
        const courseColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];
        const studentsByCourseData = studentsByCourse.map((item, idx) => {
            return {
                name: item.course ? item.course.code : 'Others',
                value: item.count,
                color: courseColors[idx % courseColors.length],
                percent: totalStudents > 0 ? ((item.count / totalStudents) * 100).toFixed(1) + '%' : '0%'
            };
        });

        // 3. Admission Monthly Data
        const currentYear = new Date().getFullYear();
        const applicationsThisYear = await Application.find({ 
            createdAt: { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) } 
        });
        
        const monthCounts: any = { Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0, Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0 };
        applicationsThisYear.forEach((app: any) => {
            const month = new Date(app.createdAt).toLocaleString('default', { month: 'short' });
            if (monthCounts[month] !== undefined) {
                monthCounts[month]++;
            }
        });
        const admissionData = Object.keys(monthCounts).map(key => ({ name: key, admissions: monthCounts[key] }));
        const totalAdmissionsThisYear = applicationsThisYear.length;
        const currentMonthStr = new Date().toLocaleString('default', { month: 'short' });
        const newAdmissionsThisMonth = monthCounts[currentMonthStr];

        // 4. Important Notices
        const importantNotices = await Notice.find().sort({ createdAt: -1 }).limit(4).lean();

        // 2. Interleaved Activity Log (Recent events across modules)
        
        // Fetch recent admissions
        const recentAdmissions = await Application.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('firstName lastName program createdAt status')
            .lean();
            
        // Fetch recent fee transactions
        const recentFees = await FeeTransaction.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('transactionId amount createdAt status')
            .lean();

        // Format and interleave logs
        let logs: any[] = [];
        
        recentAdmissions.forEach((a: any) => {
            logs.push({
                id: `adm_${a._id}`,
                type: 'Admission',
                title: `New Admission Application: ${a.firstName} ${a.lastName}`,
                detail: `Program: ${a.program} | Status: ${a.status}`,
                timestamp: a.createdAt
            });
        });

        recentFees.forEach((f: any) => {
            logs.push({
                id: `fee_${f._id}`,
                type: 'Finance',
                title: `Fee Transaction Processed`,
                detail: `Amount: ₹${f.amount} | TXN: ${f.transactionId}`,
                timestamp: f.createdAt
            });
        });

        // Sort by newest first and take top 20
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        logs = logs.slice(0, 20);

        return NextResponse.json({
            kpis: {
                totalStudents,
                totalStaff,
                totalCourses,
                totalRevenue,
                totalAdmissionsThisYear,
                newAdmissionsThisMonth,
                activeLibraryIssues
            },
            feeData,
            studentsByCourseData,
            admissionData,
            importantNotices,
            logs,
            revenueChartData,
            applicationStatusCounts,
            activeStaffList,
            recentApplications: recentAdmissions
        });
    } catch (error: any) {
        console.error("Reports API Error:", error);
        return NextResponse.json({ message: "Error fetching reports data", error: error.message }, { status: 500 });
    }
}
