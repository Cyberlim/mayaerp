/**
 * reset_all_to_dob_fast.js
 *
 * FAST version: resets ALL students to use DOB as password.
 * Processes in batches. No bcrypt comparison — just unconditionally
 * sets each student's password to a fresh hash of their DOB.
 *
 * Run: node reset_all_to_dob_fast.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const FALLBACK = 'Maya@2025'; // for students with no DOB

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    console.log('✅ Connected\n');

    const students = await db.collection('students')
        .find({}, { projection: { _id: 1, studentId: 1, firstName: 1, dob: 1 } })
        .toArray();

    console.log(`📊 Total students: ${students.length} — resetting all passwords to DOB...\n`);

    const SALT_ROUNDS = 10;
    let updated = 0;
    let noDoB = 0;

    // Process in parallel batches of 10 for speed
    const BATCH = 10;
    for (let i = 0; i < students.length; i += BATCH) {
        const batch = students.slice(i, i + BATCH);
        await Promise.all(batch.map(async (s) => {
            const plain = (s.dob && s.dob.trim()) ? s.dob.trim() : FALLBACK;
            if (!s.dob || !s.dob.trim()) noDoB++;
            const hash = await bcrypt.hash(plain, SALT_ROUNDS);
            await db.collection('students').updateOne(
                { _id: s._id },
                { $set: { password: hash } }
            );
            updated++;
            process.stdout.write(`\r  Progress: ${updated}/${students.length}`);
        }));
    }

    console.log(`\n\n✅ Done! Reset ${updated} students.`);
    if (noDoB) console.log(`⚠️  ${noDoB} students had no DOB → password set to "${FALLBACK}"`);

    console.log('\n🔑 Login credentials for ALL students:');
    console.log('   Student ID : As given (e.g. 23BB021, 25BP001, 24DT001)');
    console.log('   Password   : Date of Birth  →  DD/MM/YYYY  (e.g. 29/07/2005)');

    process.exit(0);
}

run().catch(e => { console.error('\nError:', e.message); process.exit(1); });
