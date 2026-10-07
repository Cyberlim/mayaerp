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
    receiptNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    designation: {
        type: String,
        default: 'Faculty / Staff'
    },
    department: {
        type: String,
        default: 'Academics'
    },
    payoutType: {
        type: String,
        enum: ['Salary', 'Stipend', 'Advance', 'Bonus', 'Reimbursement', 'Honorarium'],
        default: 'Salary'
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
        enum: ['Bank Transfer', 'Cash', 'Cheque', 'UPI', 'NEFT/RTGS'],
        default: 'Bank Transfer'
    },
    transactionId: {
        type: String,
        unique: true,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed', 'Cancelled'],
        default: 'Completed'
    },
    monthYear: {
        type: String,
    },
    notes: {
        type: String
    },
    disbursedBy: {
        type: String,
        default: 'Finance Controller'
    }
}, { timestamps: true });

export const Payout = mongoose.models.Payout || mongoose.model('Payout', payoutSchema);
