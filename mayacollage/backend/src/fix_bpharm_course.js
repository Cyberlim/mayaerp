/**
 * Fix: Merge duplicate Bachelor of Pharmacy courses
 * ==================================================
 * PROBLEM:
 *   There are TWO "Bachelor of Pharmacy" courses in Pharmacy branch:
 *   - B.Pharma  (_id: 6a157a09934eaa307953202a) → 0 students  ← User sees this in UI
 *   - BPHARM    (_id: 6a2804b39715a6822dcee8fd) → 64 students ← Seeder created this duplicate
 *
 * FIX:
 *   1. Move all 64 students' selectedProgram from BPHARM → B.Pharma
 *   2. Delete the duplicate BPHARM course
 *   3. Verify all 64 students now show under B.Pharma
 *
 * Run: node src/fix_bpharm_course.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: 'C:\\Users\\Lalit\\Downloads\\mayaerp\\mayaerp\\admin\\.env' });

import { Student } from './models/studentModel.js';
import Course from './models/courseModel.js';

// The course the user created in the UI (visible, 0 students)
const TARGET_COURSE_ID = '6a157a09934eaa307953202a'; // code: B.Pharma

// The duplicate seeder course (hidden duplicate, 64 students)
const SEEDER_COURSE_ID = '6a2804b39715a6822dcee8fd'; // code: BPHARM

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/maya_erp');
        console.log('📡 Connected to MongoDB\n');

        // ── Verify courses exist ──────────────────────────────────────────────
        const targetCourse = await Course.findById(TARGET_COURSE_ID).lean();
        const seederCourse = await Course.findById(SEEDER_COURSE_ID).lean();

        if (!targetCourse) {
            console.error('❌ Target course B.Pharma not found!');
            process.exit(1);
        }
        if (!seederCourse) {
            console.warn('⚠️  Seeder BPHARM course already gone — checking student links...');
        } else {
            console.log(`✅ Target  (UI course): ${targetCourse.name} | code=${targetCourse.code} | _id=${targetCourse._id}`);
            console.log(`✅ Seeder (duplicate):  ${seederCourse.name} | code=${seederCourse.code} | _id=${seederCourse._id}\n`);
        }

        // ── Count before ─────────────────────────────────────────────────────
        const beforeTarget = await Student.countDocuments({ selectedProgram: new mongoose.Types.ObjectId(TARGET_COURSE_ID) });
        const beforeSeeder = await Student.countDocuments({ selectedProgram: new mongoose.Types.ObjectId(SEEDER_COURSE_ID) });
        console.log(`Before fix:`);
        console.log(`  B.Pharma students: ${beforeTarget}`);
        console.log(`  BPHARM students:   ${beforeSeeder}\n`);

        // ── Step 1: Move students ────────────────────────────────────────────
        if (beforeSeeder > 0) {
            console.log(`🔧 Step 1: Moving ${beforeSeeder} students → B.Pharma...`);
            const updateResult = await Student.updateMany(
                { selectedProgram: new mongoose.Types.ObjectId(SEEDER_COURSE_ID) },
                { $set: { selectedProgram: new mongoose.Types.ObjectId(TARGET_COURSE_ID) } }
            );
            console.log(`  ✅ Updated: ${updateResult.modifiedCount} students\n`);
        } else {
            console.log('ℹ️  No students in BPHARM course — skipping student migration\n');
        }

        // ── Step 2: Delete duplicate BPHARM course ───────────────────────────
        if (seederCourse) {
            console.log('🔧 Step 2: Deleting duplicate BPHARM course...');
            await Course.findByIdAndDelete(SEEDER_COURSE_ID);
            const stillExists = await Course.findById(SEEDER_COURSE_ID);
            console.log(`  ${stillExists ? '❌ Failed to delete!' : '✅ Deleted successfully'}\n`);
        }

        // ── Step 3: Verify final state ────────────────────────────────────────
        const finalCount = await Student.countDocuments({
            selectedProgram: new mongoose.Types.ObjectId(TARGET_COURSE_ID)
        });
        
        // Sample 3 students
        const sample = await Student.find({ selectedProgram: new mongoose.Types.ObjectId(TARGET_COURSE_ID) })
            .limit(3)
            .select('studentId firstName lastName selectedProgram sessionYear')
            .lean();

        console.log('📋 Sample students now in B.Pharma:');
        sample.forEach(s => console.log(`  - ${s.studentId} | ${s.firstName} ${s.lastName} | Year: ${s.sessionYear}`));

        console.log(`
╔══════════════════════════════════════════════════════════╗
║       B.Pharm Course Deduplication — Complete!           ║
╠══════════════════════════════════════════════════════════╣
║  ✅ Target Course : Bachelor of Pharmacy (B.Pharma)       ║
║  ✅ Students Now  : ${String(finalCount).padEnd(36)} ║
║  🗑️  Deleted      : BPHARM (duplicate seeder course)       ║
╠══════════════════════════════════════════════════════════╣
║  👉 Refresh the Flutter app to see all 64 students        ║
╚══════════════════════════════════════════════════════════╝
        `);

        process.exit(0);
    } catch (err) {
        console.error('❌ Fatal Error:', err);
        process.exit(1);
    }
};

run();
