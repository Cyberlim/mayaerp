/**
 * B.Pharm 2024-28 Batch Student Seeder — v3 (CORRECTED)
 * ========================================================
 * CHANGES from v2:
 *  - Fixed Branch lookup: uses code='Pharmacy' (not 'PHARM') to match actual DB
 *  - Fixed sessionYear: '2024-25' for batch 2024
 *  - Validates course branchId matches found branch
 *  - Password = DOB in DDMMYYYY format (e.g. 15082002)
 *  - All 64 students including HIMANSHU (empty mobile→default)
 *    and MAYANK KUSHWAHA (lateral entry)
 *  - Incomplete data → default '0' / empty string (never skip)
 *  - Deletes old BPHARM20XX records first, then re-inserts all 64
 *
 * Run: npm run seed:bpharm2023
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import XLSX from 'xlsx';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// ── Fix DNS & Load .env FIRST ────────────────────────────────────────────────
dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: 'C:\\Users\\Lalit\\Downloads\\mayaerp\\mayaerp\\admin\\.env' });

// ── Configure Cloudinary AFTER dotenv ────────────────────────────────────────
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log('☁️  Cloudinary:', process.env.CLOUDINARY_CLOUD_NAME);

import { Student } from './models/studentModel.js';
import Course from './models/courseModel.js';
import Branch from './models/branchModel.js';

// ── Paths ─────────────────────────────────────────────────────────────────────
const EXCEL_PATH = 'C:\\Users\\Lalit\\Downloads\\mayaerp\\mayaerp\\admin\\lib\\features\\admin\\data\\B.Pharm 2023-27 C.xlsx';
const PHOTOS_DIR = 'C:\\Users\\Lalit\\Downloads\\mayaerp\\mayaerp\\admin\\lib\\features\\admin\\data\\B.pharm 2023 Pic Sign\\B.pharm 2023 Pic Sign';

// ── Convert Excel serial → JS Date ───────────────────────────────────────────
function excelSerialToDate(serial) {
    if (!serial || isNaN(serial)) return null;
    const excelEpoch = new Date(1899, 11, 30).getTime();
    return new Date(excelEpoch + Number(serial) * 86400000);
}

// ── Format Date as DDMMYYYY (for password) ───────────────────────────────────
function dateToPassword(date) {
    if (!date) return 'Maya@2023';
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}${m}${y}`;
}

// ── Format Date as DD/MM/YYYY (for dob field) ────────────────────────────────
function dateToStr(date) {
    if (!date) return '00/00/0000';
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
}

// ── Normalize name for fuzzy photo matching ───────────────────────────────────
function normalizeName(name) {
    return name.toString().toLowerCase().trim()
        .replace(/\s+/g, ' ').replace(/[^a-z ]/g, '');
}

// ── Find matching photo file ──────────────────────────────────────────────────
function findPhoto(studentName, allFiles) {
    const norm = normalizeName(studentName);
    const parts = norm.split(' ');
    const photoFiles = allFiles.filter(f =>
        f.toLowerCase().includes('photo') || f.toLowerCase().includes('pic')
    );
    let best = null, bestScore = 0;
    for (const file of photoFiles) {
        const fn = normalizeName(file.replace(/\.(jpg|jpeg|png)$/i, '')
            .replace(/(photo|pic|sign|finger|thumb|sing)/gi, '').trim());
        let score = 0;
        for (const p of parts) { if (p.length > 2 && fn.includes(p)) score++; }
        if (score > bestScore) { bestScore = score; best = file; }
    }
    return bestScore >= 1 ? best : null;
}

// ── Upload to Cloudinary ──────────────────────────────────────────────────────
async function uploadPhoto(filePath, publicId) {
    try {
        const r = await cloudinary.uploader.upload(filePath, {
            folder: 'maya_erp/students/bpharm_2023',
            public_id: publicId,
            overwrite: true,
            resource_type: 'image',
            transformation: [{ width: 400, height: 500, crop: 'fill' }],
        });
        return r.secure_url;
    } catch (e) {
        console.warn(`  ⚠️  Photo upload failed (${path.basename(filePath)}): ${e.message}`);
        return null;
    }
}

// ── Parse full name into first/middle/last ────────────────────────────────────
function parseName(full) {
    const p = full.trim().split(/\s+/).filter(Boolean);
    if (p.length === 1) return { firstName: p[0], middleName: '', lastName: p[0] };
    if (p.length === 2) return { firstName: p[0], middleName: '', lastName: p[1] };
    return { firstName: p[0], middleName: p.slice(1, -1).join(' '), lastName: p[p.length - 1] };
}

// ── Generate Student ID ───────────────────────────────────────────────────────
function genId(rollNo) {
    return `BPHARM2023${String(rollNo).padStart(3, '0')}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN SEEDER
// ═══════════════════════════════════════════════════════════════════════════════
const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/maya_erp');
        console.log('📡 Connected to MongoDB\n');

        // ── Read Excel ────────────────────────────────────────────────────────
        console.log('📊 Reading Excel file...');
        const wb = XLSX.readFile(EXCEL_PATH);

        // Sheet1 → roll numbers + lateral entry
        const s1 = XLSX.utils.sheet_to_json(wb.Sheets['Sheet1'], { header: 1, defval: '' });
        const rollMap = {};        // normName → rollNo
        const s1MobileMap = {};    // normName → mobile (from Sheet1)
        let inLateral = false;
        const lateralStudents = [];

        for (const row of s1.slice(2)) {
            const sno    = row[0];
            const name   = row[1]?.toString().trim();
            const father = row[2]?.toString().trim() || '';
            const mobile = String(row[3] || '').replace(/\D/g, '').slice(0, 10);

            // ── Detect special header rows BEFORE name guard ──────────────────
            if (typeof sno === 'string' && sno.toLowerCase().includes('letral')) {
                inLateral = true; continue;
            }
            if (typeof sno === 'string' && sno.toLowerCase().includes('s.no')) continue;

            if (!name) continue;

            if (!inLateral && typeof sno === 'number') {
                rollMap[normalizeName(name)] = sno;
                if (mobile) s1MobileMap[normalizeName(name)] = mobile;
            } else if (inLateral && typeof sno === 'number') {
                lateralStudents.push({ rollOffset: sno, name, father, mobile });
            }
        }
        console.log(`  ✅ Roll map: ${Object.keys(rollMap).length} students`);
        console.log(`  ✅ Lateral entry: ${lateralStudents.length} students`);

        // Sheet2 → full details (63 rows after header)
        const s2 = XLSX.utils.sheet_to_json(wb.Sheets['Sheet2'], { header: 1, defval: '' });
        const sheet2Students = s2.slice(1).filter(r => r[3]?.toString().trim());
        console.log(`  ✅ Sheet2 detail rows: ${sheet2Students.length}`);

        // ── Load Photos ───────────────────────────────────────────────────────
        let photoFiles = [];
        if (fs.existsSync(PHOTOS_DIR)) {
            photoFiles = fs.readdirSync(PHOTOS_DIR).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
            console.log(`\n📁 Found ${photoFiles.length} photo files`);
        }

        // ── Branch & Course ───────────────────────────────────────────────────
        console.log('\n🏫 Looking up / creating Branch & Course...');
        // NOTE: The actual Pharmacy branch in DB has code='Pharmacy' (not 'PHARM')
        let branch = await Branch.findOne({ code: 'Pharmacy' });
        if (!branch) {
            // Try alternate codes
            branch = await Branch.findOne({ name: /pharmacy/i });
        }
        if (!branch) {
            branch = await Branch.create({
                code: 'Pharmacy', name: 'PHARMACY',
                deanName: 'HOD Pharmacy', contactEmail: 'pharmacy@mayaerp.com',
                location: 'Main Campus', establishedYear: '2020',
                colorHex: '#10B981', iconName: 'medication_rounded',
            });
            console.log('  ✅ Created Pharmacy branch');
        } else console.log(`  ✅ Branch: ${branch.name} (code: ${branch.code})`);

        let course = await Course.findOne({ code: 'B.Pharma' });
        if (!course) course = await Course.findOne({ code: 'BPHARM' });
        if (!course) {
            course = await Course.create({
                branchId: branch._id, code: 'BPHARM',
                name: 'Bachelor of Pharmacy', duration: 4,
                intakeCapacity: 60, coordinator: 'Head of Pharmacy Dept.',
                tuitionFee: 75000, totalSemesters: 8,
            });
            console.log('  ✅ Created B.Pharm course');
        } else console.log(`  ✅ Course: ${course.name} (branchId: ${course.branchId})`);

        // IMPORTANT: Make sure this course's branchId matches our branch
        if (course.branchId.toString() !== branch._id.toString()) {
            console.warn(`  ⚠️  Course branchId mismatch! Updating course to use branch: ${branch._id}`);
            await Course.findByIdAndUpdate(course._id, { branchId: branch._id });
        }

        // ── Delete old BPHARM2023 records ─────────────────────────────────────
        console.log('\n🗑️  Removing old BPHARM2023 student records...');
        const deleted = await Student.deleteMany({ studentId: /^BPHARM2023/ });
        console.log(`  ✅ Deleted ${deleted.deletedCount} old records\n`);

        // ── Build all 64 student objects ──────────────────────────────────────
        console.log('👨‍🎓 Processing all 64 students...\n');
        let inserted = 0, photoUploaded = 0, noPhoto = 0, errors = 0;

        // Helper to build and insert one student
        const insertStudent = async (studentData, fullName, studentId) => {
            try {
                await Student.create(studentData);
                inserted++;
                return true;
            } catch (err) {
                console.error(`  ❌ Insert error [${studentId}] ${fullName}: ${err.message}`);
                errors++;
                return false;
            }
        };

        // ── 63 students from Sheet2 ───────────────────────────────────────────
        for (let idx = 0; idx < sheet2Students.length; idx++) {
            const row = sheet2Students[idx];
            const fullName = row[3]?.toString().trim() || '';
            if (!fullName) continue;

            const norm = normalizeName(fullName);
            const rollNo = rollMap[norm] || (idx + 1);
            const studentId = genId(rollNo);

            // Parse fields — missing/empty → safe default
            const { firstName, middleName, lastName } = parseName(fullName);
            const address  = [row[4], row[5]].filter(Boolean).join(', ').trim() || '0';
            const state    = row[6]?.toString().trim() || 'Uttar Pradesh';
            const city     = row[7]?.toString().trim() || '0';
            const pinCode  = String(row[8] || '0').replace(/\D/g, '') || '0';

            // Mobile: try Sheet2 first, fallback to Sheet1, fallback to '0000000000'
            let mobile = String(row[9] || '').replace(/\D/g, '').slice(0, 10);
            if (!mobile) mobile = s1MobileMap[norm] || '0000000000';

            const email       = row[10]?.toString().trim().toLowerCase() || '0';
            const genderRaw   = row[11]?.toString().trim().toUpperCase() || '';
            const gender      = genderRaw === 'FEMALE' ? 'Female' : 'Male';
            const dobDate     = excelSerialToDate(row[12]);
            const dob         = dateToStr(dobDate);
            const password    = dateToPassword(dobDate);   // ← DOB as password

            const parentMobile = String(row[13] || '').replace(/\D/g, '').slice(0, 10) || '0000000000';
            const category    = row[15]?.toString().trim() || 'General';
            const religion    = row[16]?.toString().trim() || '0';
            const fatherName  = row[17]?.toString().trim() || '0';
            const aadhar      = String(row[21] || '').replace(/\D/g, '') || '0';
            const entryType   = 'Direct';

            // Photo upload
            let photoUrl = null;
            const photoFile = findPhoto(fullName, photoFiles);
            if (photoFile) {
                photoUrl = await uploadPhoto(path.join(PHOTOS_DIR, photoFile), `bpharm_2023_${studentId}`);
                if (photoUrl) photoUploaded++;
                else noPhoto++;
            } else {
                noPhoto++;
            }

            const ok = await insertStudent({
                studentId,
                admissionNumber: `BPH2023${String(rollNo).padStart(3, '0')}`,
                password,                    // DOB in DDMMYYYY
                firstName, middleName, lastName,
                dob, gender, email, mobile, parentMobile,
                address, city, state, pinCode,
                aadharNumber: aadhar, religion, category,
                entryType,
                applicantPhoto: photoUrl || '',
                documents: { studentPhoto: photoUrl || '' },
                selectedBranch: branch._id,
                selectedProgram: course._id,
                selectedSemester: 1,
                selectedSection: 'Section A',
                sessionYear: '2024-25',
                fees: { semester: 0, transport: 0, exam: 0, other: 0 },
                status: 'Approved',
                studentStatus: 'Active',
            }, fullName, studentId);

            if (ok) {
                const photoTag = photoUrl ? ' 📸' : ' (no photo)';
                console.log(`  ✅ [${String(rollNo).padStart(2,'0')}] ${fullName} → ${studentId} | pwd: ${password}${photoTag}`);
            }
        }

        // ── Lateral Entry Students (from Sheet1 only) ─────────────────────────
        console.log('\n📋 Processing Lateral Entry students...\n');
        for (const lat of lateralStudents) {
            // Check if already in Sheet2 (e.g. KUSH SARASWAT)
            const norm = normalizeName(lat.name);
            const alreadyInSheet2 = sheet2Students.some(r => normalizeName(r[3]?.toString().trim()) === norm);
            if (alreadyInSheet2) {
                console.log(`  ⏭️  Lateral [${lat.name}] already in Sheet2, skipping duplicate`);
                continue;
            }

            // New lateral student (e.g. MAYANK KUSHWAHA)
            const rollNo = 100 + lat.rollOffset; // give lateral students roll 101, 102...
            const studentId = genId(rollNo);
            const { firstName, middleName, lastName } = parseName(lat.name);

            // No DOB available → use default password
            const password = 'Maya@2023';

            let photoUrl = null;
            const photoFile = findPhoto(lat.name, photoFiles);
            if (photoFile) {
                photoUrl = await uploadPhoto(path.join(PHOTOS_DIR, photoFile), `bpharm_2023_${studentId}`);
                if (photoUrl) photoUploaded++;
            }
            if (!photoUrl) noPhoto++;

            const ok = await insertStudent({
                studentId,
                admissionNumber: `BPH2023L${String(lat.rollOffset).padStart(2, '0')}`,
                password,
                firstName, middleName, lastName,
                dob: '00/00/0000',
                gender: 'Male',
                email: '0',
                mobile: lat.mobile || '0000000000',
                parentMobile: '0000000000',
                address: '0', city: '0', state: 'Uttar Pradesh', pinCode: '0',
                aadharNumber: '0', religion: '0', category: 'General',
                entryType: 'Lateral',
                applicantPhoto: photoUrl || '',
                documents: { studentPhoto: photoUrl || '' },
                selectedBranch: branch._id,
                selectedProgram: course._id,
                selectedSemester: 1,
                selectedSection: 'Section A',
                sessionYear: '2024-25',
                fees: { semester: 0, transport: 0, exam: 0, other: 0 },
                status: 'Approved',
                studentStatus: 'Active',
            }, lat.name, studentId);

            if (ok) {
                console.log(`  ✅ [LATERAL] ${lat.name} → ${studentId} | pwd: ${password} | Father: ${lat.father}${photoUrl ? ' 📸' : ''}`);
            }
        }

        // ── Summary ───────────────────────────────────────────────────────────
        console.log(`
╔═══════════════════════════════════════════════════════╗
║       B.Pharm 2023-27 Re-Seed Complete! (v2)          ║
╠═══════════════════════════════════════════════════════╣
║  ✅ Students Inserted    : ${String(inserted).padEnd(26)} ║
║  📸 Photos Uploaded      : ${String(photoUploaded).padEnd(26)} ║
║  ❓ No Photo Available   : ${String(noPhoto).padEnd(26)} ║
║  ❌ Insert Errors        : ${String(errors).padEnd(26)} ║
╠═══════════════════════════════════════════════════════╣
║  🎓 Batch   : 2023-27 (Session Year: 2023-24)         ║
║  📚 Course  : Bachelor of Pharmacy (B.Pharm)          ║
║  🔑 Password: DOB as DDMMYYYY  (e.g. 15082002)        ║
║  🔑 Lateral : Maya@2023 (no DOB available)            ║
╚═══════════════════════════════════════════════════════╝
        `);
        process.exit(0);
    } catch (err) {
        console.error('❌ Fatal Error:', err);
        process.exit(1);
    }
};

run();
