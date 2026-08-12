import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Student } from './src/models/studentModel.js';

dotenv.config();

async function testLogin() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Get a sample of recent students
  const students = await Student.find({}).sort({ createdAt: -1 }).limit(20);
  
  console.log(`\nTesting ${students.length} recent students:\n`);
  
  const passwordsToTest = ['Password@123', 'Maya@2023', 'maya@2023'];
  
  for (const s of students) {
    console.log(`--- ${s.studentId} (${s.firstName} ${s.lastName}) DOB: ${s.dob} ---`);
    
    for (const pwd of passwordsToTest) {
      const match = await bcrypt.compare(pwd, s.password);
      if (match) {
        console.log(`  ✅ Password match: "${pwd}"`);
      }
    }
    
    // Also test DOB as password
    if (s.dob) {
      const dobMatch = await bcrypt.compare(s.dob, s.password);
      if (dobMatch) {
        console.log(`  ✅ Password match: DOB "${s.dob}"`);
      }
    }
    
    // Check if no password matches
    let anyMatch = false;
    for (const pwd of passwordsToTest) {
      if (await bcrypt.compare(pwd, s.password)) anyMatch = true;
    }
    if (s.dob && await bcrypt.compare(s.dob, s.password)) anyMatch = true;
    
    if (!anyMatch) {
      console.log(`  ❌ No known password matches! (password hash: ${s.password.substring(0, 20)}...)`);
    }
  }
  
  process.exit(0);
}

testLogin().catch(e => { console.error(e); process.exit(1); });
