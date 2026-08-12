import { Notice } from '../models/noticeModel.js';

export const createNotice = async (req, res) => {
    try {
        const { title, description, targetClass, author, isScheduled, scheduledFor, attachedFile, courseId, branchId, studentId } = req.body;
        const notice = new Notice({
            title,
            description,
            targetClass,
            author,
            isScheduled,
            scheduledFor,
            attachedFile,
            courseId,
            branchId,
            studentId
        });
        await notice.save();

        // Emit socket event for real-time update
        const io = req.app.get('io');
        if (io) {
            io.emit('new_notice', notice);
        }

        res.status(201).json(notice);
    } catch (error) {
        res.status(500).json({ message: 'Error creating notice', error: error.message });
    }
};

export const getNotices = async (req, res) => {
    try {
        // Optionally filter by class or author
        const { targetClass, author } = req.query;
        let query = {};
        if (targetClass && targetClass !== 'All Classes') query.targetClass = targetClass;
        if (author) query.author = author;

        const notices = await Notice.find(query)
            .populate('author', 'firstName lastName')
            .populate('courseId', 'name')
            .populate('branchId', 'name')
            .populate('studentId', 'firstName lastName studentId')
            .sort({ createdAt: -1 });
        res.json(notices);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notices', error: error.message });
    }
};

export const updateNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedNotice = await Notice.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedNotice) return res.status(404).json({ message: 'Notice not found' });
        res.json(updatedNotice);
    } catch (error) {
        res.status(500).json({ message: 'Error updating notice', error: error.message });
    }
};

export const deleteNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedNotice = await Notice.findByIdAndDelete(id);
        if (!deletedNotice) return res.status(404).json({ message: 'Notice not found' });
        res.json({ message: 'Notice deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting notice', error: error.message });
    }
};

export const incrementNoticeViews = async (req, res) => {
    try {
        const { id } = req.params;
        const notice = await Notice.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
        if (!notice) return res.status(404).json({ message: 'Notice not found' });
        res.json(notice);
    } catch (error) {
        res.status(500).json({ message: 'Error incrementing view count', error: error.message });
    }
};
