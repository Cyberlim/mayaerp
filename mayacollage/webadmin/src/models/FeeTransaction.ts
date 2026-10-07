import mongoose from 'mongoose';

const feeTransactionSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: false
    },
    receiptNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        default: 'tuition'
    },
    categoryName: {
        type: String,
        default: 'Tuition Fee'
    },
    breakup: [{
        category: String,
        categoryName: String,
        amount: Number
    }],
    paymentDate: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        enum: ['Online', 'Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Demand Draft'],
        default: 'Cash'
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
    semester: {
        type: Number,
        default: 1
    },
    academicYear: {
        type: String,
        default: 'Year 1'
    },
    notes: {
        type: String
    },
    collectedBy: {
        type: String,
        default: 'Admin Finance'
    }
}, { timestamps: true });

export const FeeTransaction = mongoose.models.FeeTransaction || mongoose.model('FeeTransaction', feeTransactionSchema);
