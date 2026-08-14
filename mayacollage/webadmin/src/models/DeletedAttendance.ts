import mongoose from 'mongoose';

const deletedAttendanceSchema = new mongoose.Schema({
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
    subjectCode: { type: String, required: true },
    // Fields specific to deleted records
    deletedAt: { type: Date, default: Date.now },
    resetReason: { type: String }
}, { timestamps: true });

// Note: No unique index here because we might reset multiple times or overlapping records over time.

export const DeletedAttendance = mongoose.models.DeletedAttendance || mongoose.model('DeletedAttendance', deletedAttendanceSchema);
