import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
    targetType: { type: String, enum: ['Class', 'Teacher'], default: 'Class' },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    semester: { type: Number },
    section: { type: String },
    timeSlots: [{ type: String }],
    schedule: [{
        day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
        slots: [{
            subject: String,
            facultyUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            facultyName: String,
            classInfo: String,
            startTime: String,
            endTime: String,
            location: String,
            type: { type: String, default: 'Lecture' }
        }]
    }]
}, { timestamps: true });

export const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema);
