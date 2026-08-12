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
        enum: ['Online', 'Cash', 'Bank Transfer'],
        default: 'Online'
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
    semester: {
        type: Number,
        required: true
    },
    academicYear: {
        type: String,
        required: true
    }
}, { timestamps: true });

const FeeTransaction = mongoose.model('FeeTransaction', feeTransactionSchema);

export default FeeTransaction;
