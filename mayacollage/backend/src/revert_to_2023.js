/**
 * Revert: BPHARM2024 -> BPHARM2023 | sessionYear 2024-25 -> 2023-24
 * Run: node src/revert_to_2023.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: 'C:\\Users\\Lalit\\Downloads\\mayaerp\\mayaerp\\admin\\.env' });

import { Student } from './models/studentModel.js';

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📡 Connected to MongoDB\n');

    // Step 1: Fix sessionYear 2024-25 → 2023-24
    const r1 = await Student.updateMany(
        { studentId: /^BPHARM2024/, sessionYear: '2024-25' },
        { $set: { sessionYear: '2023-24' } }
    );
    console.log('✅ sessionYear fixed:', r1.modifiedCount, 'students');

    // Step 2: Rename studentId BPHARM2024xxx → BPHARM2023xxx
    const students = await Student.find({ studentId: /^BPHARM2024/ }).lean();
    let renamed = 0;
    for (const s of students) {
        const newId  = s.studentId.replace('BPHARM2024', 'BPHARM2023');
        const newAdm = (s.admissionNumber || '').replace('BPH2024', 'BPH2023');
        await Student.updateOne(
            { _id: s._id },
            { $set: { studentId: newId, admissionNumber: newAdm } }
        );
        renamed++;
    }
    console.log('✅ IDs renamed:', renamed, 'students');

    // Verify
    const count = await Student.countDocuments({ studentId: /^BPHARM2023/, sessionYear: '2023-24' });
    console.log('\n📊 BPHARM2023 students with sessionYear 2023-24:', count);

    const sample = await Student.find({ studentId: /^BPHARM2023/ })
        .limit(3)
        .select('studentId admissionNumber firstName lastName sessionYear')
        .lean();

    console.log('\n📋 Sample after fix:');
    sample.forEach(s =>
        console.log(`  ${s.studentId} | ${s.firstName} ${s.lastName} | ${s.sessionYear}`)
    );

    console.log('\n✅ Done! All students restored to BPHARM2023 / 2023-24');
    process.exit(0);
};

run().catch(e => { console.error('❌', e); process.exit(1); });
