import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Inquiry } from './src/models/inquiryModel.js';

dotenv.config();

const clearInquiries = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    await Inquiry.deleteMany({});
    console.log('All inquiries deleted');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

clearInquiries();
