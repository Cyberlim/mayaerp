import mongoose from 'mongoose';

const feeAlertSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  alertType: {
    type: String,
    enum: ['Outstanding_Dues', 'Late_Fee_Warning', 'Payment_Receipt', 'Custom_Notice', 'Fine_Imposed'],
    default: 'Outstanding_Dues',
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  outstandingAmount: {
    type: Number,
    default: 0,
  },
  channel: {
    type: String,
    enum: ['In-App', 'SMS', 'WhatsApp', 'Email'],
    default: 'In-App',
  },
  status: {
    type: String,
    enum: ['Active', 'Resolved', 'Dismissed'],
    default: 'Active',
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export const FeeAlert = mongoose.models.FeeAlert || mongoose.model('FeeAlert', feeAlertSchema);
