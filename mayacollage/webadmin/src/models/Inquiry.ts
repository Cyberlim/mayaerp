import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    course: { type: String, required: true },
    city: { type: String, required: true },
    source: { 
        type: String, 
        required: true,
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

export const Inquiry = mongoose.models.Inquiry || mongoose.model('Inquiry', inquirySchema);
