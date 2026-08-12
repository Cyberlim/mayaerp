import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
    subjectName: { type: String, required: true, trim: true },
    subjectCode: { type: String, required: true, unique: true },
    course: { type: String, required: true },         // e.g., "B.Tech"
    branch: { type: String, required: true },         // e.g., "CSE"
    semester: { type: String, required: true },       // e.g., "3rd"
    isLab: { type: Boolean, default: true },          // true = practical/lab subject
    credits: { type: Number, default: 1 },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Subject', subjectSchema);
