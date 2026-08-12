import mongoose from 'mongoose';

const issueBookSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date },
    status: {
        type: String,
        enum: ['Active', 'Overdue', 'Returned', 'Lost'],
        default: 'Active'
    },
    fine: { type: Number, default: 0 },
    otp: { type: String },
    isVerified: { type: Boolean, default: false }
}, { timestamps: true });

const IssueBook = mongoose.model('IssueBook', issueBookSchema);
export default IssueBook;
