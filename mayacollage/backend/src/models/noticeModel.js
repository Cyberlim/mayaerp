import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    targetClass: { type: String }, // e.g., "All Classes", "B.Tech CS 2nd Yr"
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    views: { type: Number, default: 0 },
    isScheduled: { type: Boolean, default: false },
    scheduledFor: { type: Date },
    attachedFile: { type: String }, // URL to file
}, { timestamps: true });

export const Notice = mongoose.model('Notice', noticeSchema);
