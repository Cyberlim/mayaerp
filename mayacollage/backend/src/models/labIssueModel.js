import mongoose from 'mongoose';

const labIssueSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        unique: true,
        default: () => `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    lab: { type: mongoose.Schema.Types.ObjectId, ref: 'LabFacility' },
    issuedTo: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'issuedToModel'
    },
    issuedToModel: {
        type: String,
        required: true,
        enum: ['Student', 'User'] // User = Faculty/Staff
    },
    issuedToName: { type: String }, // Denormalized for display
    issuedToId: { type: String },   // Roll no or ID
    quantityIssued: { type: Number, required: true, default: 1 },
    issueDate: { type: Date, default: Date.now },
    expectedReturnDate: { type: Date },
    returnDate: { type: Date },
    status: {
        type: String,
        enum: ['Issued', 'Returned', 'Overdue', 'Lost', 'Damaged'],
        default: 'Issued'
    },
    remarks: { type: String },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Lab Admin
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('LabIssue', labIssueSchema);
