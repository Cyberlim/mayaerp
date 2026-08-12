import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema({
    branchId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
        index: true
    },
    date: { 
        type: Date, 
        required: true,
        index: true
    },
    day: { 
        type: String, 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['National', 'Weekly', 'Other'], 
        default: 'Other' 
    }
}, { timestamps: true });

holidaySchema.index({ branchId: 1, date: 1 }, { unique: true });

// Check if model already exists before defining
export const Holiday = mongoose.models.Holiday || mongoose.model('Holiday', holidaySchema);
