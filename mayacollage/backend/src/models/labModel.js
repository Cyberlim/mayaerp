import mongoose from 'mongoose';

const labSchema = new mongoose.Schema({
    labName: { type: String, required: true, trim: true },
    roomNumber: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true },
    labType: {
        type: String,
        required: true,
        enum: ['Computer', 'Chemistry', 'Physics', 'Engineering', 'Media', 'Robotics', 'Other']
    },
    labIncharge: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.LabFacility || mongoose.model('LabFacility', labSchema);
