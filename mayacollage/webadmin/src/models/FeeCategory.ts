import mongoose from 'mongoose';

const feeCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  type: {
    type: String,
    enum: ['Academic', 'Kit/Uniform', 'Fine/Penalty', 'Facility/Lab', 'Other'],
    default: 'Kit/Uniform',
  },
  defaultAmount: {
    type: Number,
    default: 0,
  },
  frequency: {
    type: String,
    enum: ['One-Time', 'Semester-wise', 'Yearly', 'As Applicable'],
    default: 'One-Time',
  },
  isMandatory: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
}, { timestamps: true });

export const FeeCategory = mongoose.models.FeeCategory || mongoose.model('FeeCategory', feeCategorySchema);
