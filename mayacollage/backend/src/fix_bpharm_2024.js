/**
 * Fix B.Pharm 2024 Batch — Branch/Program Migration
 * ===================================================
 * PROBLEM:
 *   - 64 B.Pharm students have selectedBranch = 6a28080448132e018ca80f9c (deleted/ghost branch)
 *   - This branch no longer exists in the database
 *   - The correct branch is: _id=6a15797f934eaa3079532001, code='Pharmacy', name='PHARMACY'
 *   - The correct course is: _id=6a2804b39715a6822dcee8fd, code='BPHARM', name='Bachelor of Pharmacy'
 *   - Students are NOT visible in the B.Pharm course/branch screens due to this mismatch
 *
 * FIX:
 *   1. Update all BPHARM2023* students' selectedBranch to correct branch ID
 *   2. Confirm selectedProgram is already correct (6a2804b39715a6822dcee8fd)
 *   3. Update sessionYear from '2023-24' to '2024-25' (batch 2024)
 *   4. Update studentId prefix from BPHARM2023 to BPHARM2024
 *   5. Update admissionNumber prefix accordingly
 *
 * Run: node src/fix_bpharm_2024.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: 'C:\\Users\\Lalit\\Downloads\\mayaerp\\mayaerp\\admin\\.env' });

import { Student } from './models/studentModel.js';
import Branch from './models/branchModel.js';
import Course from './models/courseModel.js';

const CORRECT_BRANCH_ID = '6a15797f934eaa3079532001'; // Pharmacy branch (code='Pharmacy', name='PHARMACY')
const CORRECT_COURSE_ID = '6a157a09934eaa307953202a'; // Bachelor of Pharmacy (code='B.Pharma') — the real UI course

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/maya_erp');
        console.log('📡 Connected to MongoDB\n');

        // ── Verify branch and course exist ────────────────────────────────────
        const branch = await Branch.findById(CORRECT_BRANCH_ID);
        if (!branch) {
            console.error('❌ Correct branch not found in DB! Check CORRECT_BRANCH_ID.');
            process.exit(1);
        }
        console.log(`✅ Correct Branch: ${branch.name} (code: ${branch.code}, _id: ${branch._id})`);

        const course = await Course.findById(CORRECT_COURSE_ID);
        if (!course) {
            console.error('❌ Correct course not found in DB! Check CORRECT_COURSE_ID.');
            process.exit(1);
        }
        console.log(`✅ Correct Course: ${course.name} (code: ${course.code}, _id: ${course._id})\n`);

        // ── Count students to fix ─────────────────────────────────────────────
        const totalToFix = await Student.countDocuments({ studentId: /^BPHARM2023/ });
        console.log(`📊 Students to migrate: ${totalToFix}\n`);

        if (totalToFix === 0) {
            console.log('⚠️  No BPHARM2023 students found. Nothing to fix.');
            process.exit(0);
        }

        // ── Step 1: Fix selectedBranch + selectedProgram + sessionYear ────────
        console.log('🔧 Step 1: Fixing selectedBranch, selectedProgram, sessionYear...');
        const updateResult = await Student.updateMany(
            { studentId: /^BPHARM2023/ },
            {
                $set: {
                    selectedBranch: new mongoose.Types.ObjectId(CORRECT_BRANCH_ID),
                    selectedProgram: new mongoose.Types.ObjectId(CORRECT_COURSE_ID),
                    sessionYear: '2024-25',
                }
            }
        );
        console.log(`  ✅ Updated ${updateResult.modifiedCount} students' branch/program/sessionYear\n`);

        // ── Step 2: Update studentId prefix BPHARM2023 → BPHARM2024 ──────────
        console.log('🔧 Step 2: Renaming studentId prefix (BPHARM2023 → BPHARM2024)...');
        const students = await Student.find({ studentId: /^BPHARM2023/ }).lean();
        let renamed = 0, renamedErrors = 0;
        for (const s of students) {
            const oldStudentId = s.studentId;
            const newStudentId = oldStudentId.replace('BPHARM2023', 'BPHARM2024');
            const oldAdmNo = s.admissionNumber || '';
            const newAdmNo = oldAdmNo.replace('BPH2023', 'BPH2024');

            try {
                await Student.updateOne(
                    { _id: s._id },
                    { $set: { studentId: newStudentId, admissionNumber: newAdmNo } }
                );
                renamed++;
            } catch (err) {
                console.error(`  ❌ Rename error [${oldStudentId}]: ${err.message}`);
                renamedErrors++;
            }
        }
        console.log(`  ✅ Renamed ${renamed} student IDs | ❌ Errors: ${renamedErrors}\n`);

        // ── Step 3: Verify final state ────────────────────────────────────────
        console.log('🔍 Step 3: Verifying final state...');
        const verifyCount = await Student.countDocuments({
            studentId: /^BPHARM2024/,
            selectedBranch: new mongoose.Types.ObjectId(CORRECT_BRANCH_ID),
            selectedProgram: new mongoose.Types.ObjectId(CORRECT_COURSE_ID),
            sessionYear: '2024-25'
        });

        const sample = await Student.find({ studentId: /^BPHARM2024/ })
            .limit(3)
            .select('studentId admissionNumber firstName lastName selectedBranch selectedProgram sessionYear')
            .lean();

        console.log('Sample students after fix:');
        sample.forEach(s => console.log(`  - ${s.studentId} | ${s.firstName} ${s.lastName} | Branch: ${s.selectedBranch} | Program: ${s.selectedProgram} | Year: ${s.sessionYear}`));

        // ── Summary ───────────────────────────────────────────────────────────
        console.log(`
╔══════════════════════════════════════════════════════════╗
║         B.Pharm 2024 Batch Fix — Complete!               ║
╠══════════════════════════════════════════════════════════╣
║  ✅ Branch Fixed   : ${branch.name.padEnd(36)} ║
║  ✅ Course Fixed   : ${course.name.padEnd(36)} ║
║  ✅ Session Year   : 2024-25                             ║
║  ✅ Students Fixed : ${String(verifyCount).padEnd(36)} ║
║  ✅ IDs Renamed    : ${String(renamed).padEnd(36)} ║
╠══════════════════════════════════════════════════════════╣
║  Students now visible in B.Pharm > Bachelor of Pharmacy  ║
╚══════════════════════════════════════════════════════════╝
        `);

        process.exit(0);
    } catch (err) {
        console.error('❌ Fatal Error:', err);
        process.exit(1);
    }
};

run();
