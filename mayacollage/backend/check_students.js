import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Student } from './src/models/studentModel.js';

dotenv.config();

async function checkStudents() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const students = await Student.find({});
        
        console.log("--- STUDENT LOGIN CREDENTIALS ---");
        for (let student of students) {
            console.log(`\nName: ${student.firstName} ${student.lastName}`);
            console.log(`Student ID: ${student.studentId || 'N/A'}`);
            console.log(`Admission Number: ${student.admissionNumber || 'N/A'}`);
            console.log(`Email: ${student.email || 'N/A'}`);
            
            // Password logic check
            // For new students, password is dob with hyphens removed
            const dobClean = student.dob ? student.dob.replace(/-/g, '') : "password123";
            console.log(`DOB format in DB: ${student.dob}`);
            console.log(`Expected Password (if unchanged): ${dobClean}`);
            console.log(`Password Hashed?: ${student.password && student.password.startsWith('$2') ? 'Yes' : 'No'}`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkStudents();
