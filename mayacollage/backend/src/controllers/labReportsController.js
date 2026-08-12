import Lab from '../models/labModel.js';
import InventoryItem from '../models/inventoryItemModel.js';
import LabIssue from '../models/labIssueModel.js';
import SubjectLabMapping from '../models/subjectLabMappingModel.js';

// @desc Get full lab management stats dashboard
export const getLabReports = async (req, res) => {
    try {
        const totalLabs = await Lab.countDocuments();
        const totalItems = await InventoryItem.countDocuments();
        const totalQuantity = await InventoryItem.aggregate([
            { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);

        const lowStockCount = await InventoryItem.countDocuments({
            $expr: { $lte: ['$availableQuantity', '$lowStockThreshold'] }
        });
        const damagedItemsCount = await InventoryItem.countDocuments({ condition: 'Damaged' });
        const activeIssues = await LabIssue.countDocuments({ status: 'Issued' });
        const overdueIssues = await LabIssue.countDocuments({ status: 'Overdue' });
        const totalReturned = await LabIssue.countDocuments({ status: 'Returned' });
        const totalMappings = await SubjectLabMapping.countDocuments();

        // Lab-wise inventory breakdown
        const labBreakdown = await InventoryItem.aggregate([
            {
                $lookup: {
                    from: 'labs',
                    localField: 'lab',
                    foreignField: '_id',
                    as: 'labDetails'
                }
            },
            { $unwind: '$labDetails' },
            {
                $group: {
                    _id: '$labDetails.labName',
                    itemCount: { $sum: 1 },
                    totalQty: { $sum: '$quantity' }
                }
            },
            { $sort: { itemCount: -1 } }
        ]);

        // Category breakdown for chart
        const categoryBreakdown = await InventoryItem.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 }, totalQty: { $sum: '$quantity' } } },
            { $sort: { count: -1 } }
        ]);

        // Issues per month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const issuesTrend = await LabIssue.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
                    total: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.json({
            summary: {
                totalLabs,
                totalItems,
                totalQuantity: totalQuantity[0]?.total || 0,
                lowStockCount,
                damagedItemsCount,
                activeIssues,
                overdueIssues,
                totalReturned,
                totalMappings
            },
            labBreakdown,
            categoryBreakdown,
            issuesTrend
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
