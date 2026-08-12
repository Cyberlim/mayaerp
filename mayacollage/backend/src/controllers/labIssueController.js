import LabIssue from '../models/labIssueModel.js';
import InventoryItem from '../models/inventoryItemModel.js';

// @desc Get all issue/return records
export const getAllIssues = async (req, res) => {
    try {
        const { status, lab } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (lab) filter.lab = lab;

        const issues = await LabIssue.find(filter)
            .populate('item', 'itemName category')
            .populate('lab', 'labName roomNumber')
            .populate('issuedBy', 'firstName lastName')
            .sort({ createdAt: -1 });
        res.json(issues);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc Issue an item
export const issueItem = async (req, res) => {
    try {
        const { item, issuedTo, issuedToModel, issuedToName, issuedToId, quantityIssued, expectedReturnDate, remarks, lab, issuedBy } = req.body;

        const inventoryItem = await InventoryItem.findById(item);
        if (!inventoryItem) return res.status(404).json({ message: 'Inventory item not found' });
        if (inventoryItem.availableQuantity < quantityIssued) {
            return res.status(400).json({ message: `Not enough stock. Available: ${inventoryItem.availableQuantity}` });
        }

        // Decrease available quantity
        inventoryItem.availableQuantity -= quantityIssued;
        await inventoryItem.save();

        const issue = await LabIssue.create({
            item, lab: lab || inventoryItem.lab, issuedTo, issuedToModel,
            issuedToName, issuedToId, quantityIssued, expectedReturnDate, remarks, issuedBy
        });

        const populated = await issue.populate([
            { path: 'item', select: 'itemName category' },
            { path: 'lab', select: 'labName roomNumber' }
        ]);
        res.status(201).json({ message: 'Item issued successfully', issue: populated });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc Return an item
export const returnItem = async (req, res) => {
    try {
        const { returnStatus, remarks } = req.body; // returnStatus: 'Returned' | 'Lost' | 'Damaged'
        const issue = await LabIssue.findById(req.params.id);
        if (!issue) return res.status(404).json({ message: 'Issue record not found' });
        if (issue.status === 'Returned') return res.status(400).json({ message: 'Item already returned' });

        issue.status = returnStatus || 'Returned';
        issue.returnDate = new Date();
        if (remarks) issue.remarks = remarks;
        await issue.save();

        // Restore available quantity if properly returned
        if (returnStatus === 'Returned') {
            await InventoryItem.findByIdAndUpdate(issue.item, {
                $inc: { availableQuantity: issue.quantityIssued }
            });
        } else if (returnStatus === 'Damaged') {
            // Mark item condition but still restore quantity (or reduce total)
            await InventoryItem.findByIdAndUpdate(issue.item, {
                condition: 'Damaged'
            });
        }

        res.json({ message: 'Item return processed', issue });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc Auto-flag overdue items (can be called by a cron or manually)
export const flagOverdueItems = async (req, res) => {
    try {
        const now = new Date();
        const result = await LabIssue.updateMany(
            { status: 'Issued', expectedReturnDate: { $lt: now } },
            { $set: { status: 'Overdue' } }
        );
        res.json({ message: `Flagged ${result.modifiedCount} overdue items` });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
