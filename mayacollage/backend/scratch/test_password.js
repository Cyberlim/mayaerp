import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Student } from '../src/models/studentModel.js';

dotenv.config();

async function testPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const student = await Student.findOne({ studentId: '25BP057' });
    if (!student) {
      console.log("Student not found");
      return;
    }
    
    console.log("Student found:", student.firstName, student.lastName);
    console.log("DOB in DB:", student.dob);
    console.log("Hashed password:", student.password);
    
    const candidates = [
      "25/12/2007",
      "25122007",
      "20071225",
      "25-12-2007",
      "12/25/2007",
      "2007-12-25"
    ];
    
    for (let c of candidates) {
      const match = await bcrypt.compare(c, student.password);
      console.log(`Candidate: "${c}" => Match: ${match}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

testPassword();
