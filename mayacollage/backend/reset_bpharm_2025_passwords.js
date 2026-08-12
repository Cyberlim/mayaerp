/**
 * reset_bpharm_2025_passwords.js
 * 
 * Resets all B.Pharm 2025 students (studentId starts with '25BP') to use
 * their Date of Birth (DOB) as their password.
 * 
 * This ensures consistency: students log in with their DOB (DD/MM/YYYY).
 * 
 * Run with: node reset_bpharm_2025_passwords.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Student } from './src/models/studentModel.js';

dotenv.config();

async function resetPasswords() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to DB\n');

    // Find all B.Pharm 2025 students (ID starts with 25BP)
    const students = await Student.find({ studentId: /^25BP/i });
    console.log(`Found ${students.length} B.Pharm 2025 students\n`);

    let updated = 0;
    let skipped = 0;

    for (const student of students) {
        const dob = student.dob;
        if (!dob) {
            console.log(`⚠️  ${student.studentId} (${student.firstName}) - No DOB, skipping`);
            skipped++;
            continue;
        }

        // Hash the DOB
        const salt = await bcrypt.genSalt(10);
        const hashedDob = await bcrypt.hash(dob, salt);

        // Update directly via MongoDB to bypass the pre-save hook (which would double-hash)
        await Student.updateOne(
            { _id: student._id },
            { $set: { password: hashedDob } }
        );

        console.log(`✅ ${student.studentId} (${student.firstName}) → password reset to DOB: ${dob}`);
        updated++;
    }

    console.log(`\n📊 Done! Updated: ${updated}, Skipped: ${skipped}`);
    console.log('\n🔑 Students can now login with:');
    console.log('   Student ID: e.g. 25BP001, 25BP002...');
    console.log('   Password: Their DOB in DD/MM/YYYY format (e.g. 02/02/2005)');
    process.exit(0);
}

resetPasswords().catch(e => { console.error('Error:', e); process.exit(1); });
