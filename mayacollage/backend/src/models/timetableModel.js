import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    semester: { type: Number, required: true },
    section: { type: String },
    timeSlots: [{ type: String }],
    schedule: [{
        day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
        slots: [{
            subject: String,
            facultyUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            facultyName: String,
            startTime: String,
            endTime: String,
            location: String,
            type: { type: String, default: 'Lecture' }
        }]
    }]
}, { timestamps: true });

const Timetable = mongoose.model('Timetable', timetableSchema);
export default Timetable;
