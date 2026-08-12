import mongoose from 'mongoose';
import { Student } from './src/models/studentModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const students = await Student.find({}, 'email studentId password firstName dob');
  console.log('Total students:', students.length);
  students.forEach(s => {
    console.log(`Student ID: ${s.studentId}, Email: ${s.email}, Name: ${s.firstName}, DOB: ${s.dob}`);
    // Check if password looks like a hash
    const isHash = s.password.startsWith('$2');
    console.log(`  Password is hash: ${isHash}`);
    if (!isHash) {
        console.log(`  WARNING: Password is plain text: ${s.password}`);
    }
  });
  process.exit();
}

check();
