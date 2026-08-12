import { Leave } from '../models/leaveModel.js';

export const applyLeave = async (req, res) => {
    try {
        const { userId, leaveType, startDate, endDate, reason } = req.body;
        const leave = new Leave({
            userId,
            leaveType,
            startDate,
            endDate,
            reason
        });
        await leave.save();
        res.status(201).json(leave);
    } catch (error) {
        res.status(500).json({ message: 'Error applying for leave', error: error.message });
    }
};

export const getUserLeaves = async (req, res) => {
    try {
        const { userId } = req.params;
        const leaves = await Leave.find({ userId }).sort({ appliedAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leaves', error: error.message });
    }
};

export const getAllLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find().populate('userId', 'firstName lastName email role').sort({ appliedAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all leaves', error: error.message });
    }
};

export const updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const leave = await Leave.findByIdAndUpdate(id, { status }, { new: true });
        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }
        res.json(leave);
    } catch (error) {
        res.status(500).json({ message: 'Error updating leave status', error: error.message });
    }
};
