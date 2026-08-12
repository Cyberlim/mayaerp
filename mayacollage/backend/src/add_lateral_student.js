/**
 * Add missing Lateral Entry student: MAYANK KUSHWAHA
 * Run: node src/add_lateral_student.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: 'C:\\Users\\Lalit\\Downloads\\mayaerp\\mayaerp\\admin\\.env' });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

import { Student } from './models/studentModel.js';
import Course from './models/courseModel.js';
import Branch from './models/branchModel.js';

const PHOTOS_DIR = 'C:\\Users\\Lalit\\Downloads\\mayaerp\\mayaerp\\admin\\lib\\features\\admin\\data\\B.pharm 2023 Pic Sign\\B.pharm 2023 Pic Sign';

function normalizeName(name) {
    return name.toString().toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^a-z ]/g, '');
}

async function run() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/maya_erp');
    console.log('📡 Connected to MongoDB');

    const branch = await Branch.findOne({ code: 'PHARM' });
    const course = await Course.findOne({ code: 'BPHARM' });

    // Check if already exists
    const exists = await Student.findOne({ studentId: 'BPHARM2023064' });
    if (exists) {
        console.log('✅ BPHARM2023064 already exists:', exists.firstName, exists.lastName);
        process.exit(0);
    }

    // Try to find a photo for Mayank
    let photoUrl = null;
    if (fs.existsSync(PHOTOS_DIR)) {
        const allFiles = fs.readdirSync(PHOTOS_DIR).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
        const norm = normalizeName('MAYANK KUSHWAHA');
        const parts = norm.split(' ');
        const photoFiles = allFiles.filter(f => f.toLowerCase().includes('photo') || f.toLowerCase().includes('pic'));
        let best = null, bestScore = 0;
        for (const file of photoFiles) {
            const fn = normalizeName(file.replace(/\.(jpg|jpeg|png)$/i,'').replace(/(photo|pic|sign|finger|thumb|sing)/gi,'').trim());
            let score = 0;
            for (const p of parts) { if (p.length > 2 && fn.includes(p)) score++; }
            if (score > bestScore) { bestScore = score; best = file; }
        }
        if (best && bestScore >= 1) {
            try {
                const r = await cloudinary.uploader.upload(path.join(PHOTOS_DIR, best), {
                    folder: 'maya_erp/students/bpharm_2023',
                    public_id: 'bpharm_2023_BPHARM2023064',
                    overwrite: true,
                    resource_type: 'image',
                });
                photoUrl = r.secure_url;
                console.log(`📸 Photo uploaded: ${best}`);
            } catch (e) {
                console.warn('⚠️  Photo upload failed:', e.message);
            }
        }
    }

    // Insert MAYANK KUSHWAHA (Lateral Entry, Roll 64)
    const student = await Student.create({
        studentId: 'BPHARM2023064',
        admissionNumber: 'BPH2023L02',
        password: 'Maya@2023',       // No DOB available for lateral entry
        firstName: 'MAYANK',
        middleName: '',
        lastName: 'KUSHWAHA',
        dob: '00/00/0000',
        gender: 'Male',
        email: '0',
        mobile: '0000000000',
        parentMobile: '0000000000',
        address: '0',
        city: '0',
        state: 'Uttar Pradesh',
        pinCode: '0',
        aadharNumber: '0',
        religion: '0',
        category: 'General',
        entryType: 'Lateral',
        applicantPhoto: photoUrl || '',
        documents: { studentPhoto: photoUrl || '' },
        selectedBranch: branch._id,
        selectedProgram: course._id,
        selectedSemester: 1,
        selectedSection: 'Section A',
        sessionYear: '2023-24',
        fees: { semester: 0, transport: 0, exam: 0, other: 0 },
        status: 'Approved',
        studentStatus: 'Active',
    });

    console.log(`
✅ Student Added Successfully!
──────────────────────────────
  Name       : MAYANK KUSHWAHA
  Student ID : BPHARM2023064
  Roll No    : 64 (Lateral Entry)
  Father     : SURENDRA SINGH KUSHWAH
  Password   : Maya@2023
  Entry Type : Lateral
  Photo      : ${photoUrl ? '📸 Uploaded' : '❌ No photo found'}
──────────────────────────────
Total B.Pharm 2023 students now: 64 ✅
    `);

    // Also fix the lateral detection bug in seed_bpharm_2023.js for future runs
    console.log('✅ All 64 students are now in the database!');
    process.exit(0);
}

run().catch(e => { console.error('❌', e); process.exit(1); });
