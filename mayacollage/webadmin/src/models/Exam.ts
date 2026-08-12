import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    examName: {
        type: String,
        required: true,
        trim: true
    },
    dateSheet: [{
        date: { type: Date, required: true },
        day: { type: String, required: true },
        subject: { type: String, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        type: { type: String, default: 'Theory' }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['Draft', 'Published'],
        default: 'Published'
    }
}, { timestamps: true });

export const Exam = mongoose.models.Exam || mongoose.model('Exam', examSchema);
