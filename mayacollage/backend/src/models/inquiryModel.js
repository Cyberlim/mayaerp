import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    course: { type: String, required: true },
    city: { type: String, required: true },
    source: { 
        type: String, 
        required: true,
        // Optional: you can keep enum but make it more inclusive if needed
        // enum: ['Walk-in', 'Phone', 'Online Form', 'Referral', 'Other'] 
    },
    status: { 
        type: String, 
        default: 'New',
        enum: ['New', 'Followup', 'Resolved', 'Dropped'] 
    },
    note: { type: String },
    avatar: { type: String },
    createdAt: { type: Date, default: Date.now }
});

export const Inquiry = mongoose.model('Inquiry', inquirySchema);
