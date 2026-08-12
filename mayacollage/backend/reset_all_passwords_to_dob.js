/**
 * reset_all_passwords_to_dob.js
 *
 * Resets ALL students whose password is currently NOT their DOB to use
 * their Date of Birth (DD/MM/YYYY) as their password.
 *
 * Students who already use DOB as password are skipped.
 * Students with no DOB get a fallback password: Maya@2025
 *
 * Run with: node reset_all_passwords_to_dob.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const FALLBACK_PASSWORD = 'Maya@2025'; // used if student has no DOB

async function resetAll() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    console.log('✅ Connected to DB\n');

    const students = await db.collection('students').find({}).toArray();
    console.log(`📊 Total students found: ${students.length}\n`);

    let updated = 0;
    let alreadyDob = 0;
    let noPassword = 0;
    let fallback = 0;

    for (const s of students) {
        // Skip if already using DOB as password
        if (s.dob && s.password) {
            const isDob = await bcrypt.compare(s.dob, s.password);
            if (isDob) {
                alreadyDob++;
                continue;
            }
        }

        // Determine what password to set
        const plainPassword = s.dob ? s.dob : FALLBACK_PASSWORD;
        if (!s.dob) fallback++;

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(plainPassword, salt);

        // Update directly in MongoDB (bypasses pre-save hook to avoid double-hashing)
        await db.collection('students').updateOne(
            { _id: s._id },
            { $set: { password: hashed } }
        );

        const label = s.dob ? `DOB: ${s.dob}` : `Fallback: ${FALLBACK_PASSWORD}`;
        console.log(`✅ ${s.studentId || s._id} (${s.firstName} ${s.lastName}) → ${label}`);
        updated++;
    }

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📊 Summary:`);
    console.log(`   Already correct (DOB): ${alreadyDob}`);
    console.log(`   Reset to DOB:          ${updated - fallback}`);
    console.log(`   Reset to fallback pwd: ${fallback}`);
    console.log(`   Total updated:         ${updated}`);
    console.log(`\n🔑 All students can now login with:`);
    console.log(`   Student ID : As given by institute (e.g. 23BB021, 25BP001)`);
    console.log(`   Password   : Date of Birth in DD/MM/YYYY (e.g. 29/07/2005)`);
    console.log(`   (No DOB?)  : Use password  →  ${FALLBACK_PASSWORD}`);
    process.exit(0);
}

resetAll().catch(e => { console.error('Error:', e.message); process.exit(1); });
