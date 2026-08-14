import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Student } from './src/models/studentModel.js';

dotenv.config();

async function fixPasswords() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const students = await Student.find({});
        let updatedCount = 0;

        for (let student of students) {
            if (student.password && !student.password.startsWith('$2a$') && !student.password.startsWith('$2b$')) {
                console.log(`Hashing password for student: ${student.firstName} ${student.lastName}`);
                const salt = await bcrypt.genSalt(10);
                student.password = await bcrypt.hash(student.password, salt);
                
                // We use updateOne to skip the pre-save hook entirely (just in case)
                await Student.updateOne(
                    { _id: student._id },
                    { $set: { password: student.password } }
                );
                updatedCount++;
            }
        }

        console.log(`Successfully hashed passwords for ${updatedCount} students.`);
    } catch (error) {
        console.error('Error fixing passwords:', error);
    } finally {
        await mongoose.disconnect();
    }
}

fixPasswords();
