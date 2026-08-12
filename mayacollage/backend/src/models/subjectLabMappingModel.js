import mongoose from 'mongoose';

const subjectLabMappingSchema = new mongoose.Schema({
    subject: { type: String, required: true, trim: true },
    course: { type: String, required: true },
    branch: { type: String, required: true },
    semester: { type: String, required: true },
    lab: { type: mongoose.Schema.Types.ObjectId, ref: 'LabFacility', required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    academicYear: { type: String, default: () => `${new Date().getFullYear()}-${new Date().getFullYear() + 1}` },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('SubjectLabMapping', subjectLabMappingSchema);
