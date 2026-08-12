import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
    payeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    payeeName: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        enum: ['Bank Transfer', 'Cash', 'Cheque'],
        default: 'Bank Transfer'
    },
    transactionId: {
        type: String,
        unique: true,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Completed'
    },
    notes: {
        type: String
    }
}, { timestamps: true });

export const Payout = mongoose.models.Payout || mongoose.model('Payout', payoutSchema);
