import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    student: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Student', 
        required: true 
    },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    date: { 
        type: Date, 
        required: true,
        index: true
    },
    status: { 
        type: String, 
        enum: ['Present', 'Absent', 'Late', 'Not Marked'], 
        required: true 
    },
    isLate: { type: Boolean, default: false },
    department: { type: String, required: true },
    course: { type: String, required: true },
    section: { type: String },
    subject: { type: String, required: true },
    subjectCode: { type: String, required: true }
}, { timestamps: true });

// Ensure unique attendance per student per date per subject
attendanceSchema.index({ student: 1, date: 1, subject: 1, subjectCode: 1 }, { unique: true });

export const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
