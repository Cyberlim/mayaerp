import mongoose from 'mongoose';

const shelfSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  aisle: { type: String, required: true },
  capacity: { type: Number, required: true },
  current: { type: Number, default: 0 },
  category: { type: String, required: true },
  description: { type: String },
  status: { type: String, default: 'Active' },
}, { timestamps: true });

export default mongoose.model('Shelf', shelfSchema);
