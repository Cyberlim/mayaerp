import Timetable from '../models/timetableModel.js';
import Course from '../models/courseModel.js';
import Branch from '../models/branchModel.js';
import mongoose from 'mongoose';

export const saveTimetable = async (req, res) => {
    try {
        const { courseId, branchId, semester, section, schedule, timeSlots } = req.body;
        
        // Update existing or create new
        const timetable = await Timetable.findOneAndUpdate(
            { courseId, branchId, semester, section },
            { schedule, timeSlots },
            { new: true, upsert: true }
        ).populate('schedule.slots.facultyUserId', 'firstName lastName');
        
        // Emit live update
        const io = req.app.get('io');
        if (io) {
            io.emit('timetable_updated', { courseId, branchId, semester, section, timetable });
        }
        
        res.status(200).json(timetable);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getTimetable = async (req, res) => {
    try {
        let { courseId, branchId, semester, section } = req.query;

        // Try to resolve names to IDs if they aren't valid ObjectIds
        if (courseId && !mongoose.Types.ObjectId.isValid(courseId)) {
            const course = await Course.findOne({ name: courseId });
            if (course) courseId = course._id;
        }

        if (branchId && !mongoose.Types.ObjectId.isValid(branchId)) {
            const branch = await Branch.findOne({ name: branchId });
            if (branch) branchId = branch._id;
        }

        const timetable = await Timetable.findOne({ courseId, branchId, semester, section })
            .populate('schedule.slots.facultyUserId', 'firstName lastName email profilePhoto');
            
        if (!timetable) return res.status(200).json({ schedule: [] });
        res.status(200).json(timetable);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
