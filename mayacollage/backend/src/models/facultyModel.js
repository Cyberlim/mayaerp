import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    subjects: [{ type: String }], // Optional: specific subjects assigned to this faculty for this course
    designation: { type: String, default: 'Professor' },
    status: { type: String, default: 'Active' },
    joinedDate: { type: Date, default: Date.now }
}, { timestamps: true });

const Faculty = mongoose.models.Faculty || mongoose.model('Faculty', facultySchema);
export default Faculty;
