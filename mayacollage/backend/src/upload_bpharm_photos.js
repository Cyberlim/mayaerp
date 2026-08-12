/**
 * B.Pharm 2023-27 Photo Uploader
 * ================================
 * Uploads student photos to Cloudinary and updates their records in MongoDB.
 * Run AFTER seed_bpharm_2023.js
 *
 * Run: node src/upload_bpharm_photos.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Fix DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load .env FIRST before anything else
dotenv.config({ path: 'C:\\Users\\Lalit\\Downloads\\mayaerp\\mayaerp\\admin\\.env' });

// Configure Cloudinary AFTER dotenv
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('☁️  Cloudinary cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);

import { Student } from './models/studentModel.js';

const PHOTOS_DIR = 'C:\\Users\\Lalit\\Downloads\\mayaerp\\mayaerp\\admin\\lib\\features\\admin\\data\\B.pharm 2023 Pic Sign\\B.pharm 2023 Pic Sign';

function normalizeName(name) {
    return name.toString().toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^a-z ]/g, '');
}

function findStudentPhoto(studentName, photoFiles) {
    const norm = normalizeName(studentName);
    const nameParts = norm.split(' ');

    // Filter to only photo files
    const photoOnlyFiles = photoFiles.filter(f =>
        f.toLowerCase().includes('photo') || f.toLowerCase().includes('pic')
    );

    let best = null;
    let bestScore = 0;

    for (const file of photoOnlyFiles) {
        const fileNorm = normalizeName(
            file.replace(/\.(jpg|jpeg|png)$/i, '')
                .replace(/(photo|pic|sign|finger|thumb|sing)/gi, '')
                .trim()
        );
        let score = 0;
        for (const part of nameParts) {
            if (part.length > 2 && fileNorm.includes(part)) score++;
        }
        if (score > bestScore) {
            bestScore = score;
            best = file;
        }
    }

    return bestScore >= 1 ? best : null;
}

async function uploadToCloudinary(filePath, publicId) {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'maya_erp/students/bpharm_2023',
            public_id: publicId,
            overwrite: true,
            resource_type: 'image',
            transformation: [{ width: 400, height: 500, crop: 'fill' }]
        });
        return result.secure_url;
    } catch (err) {
        console.warn(`  ⚠️  Upload failed for ${path.basename(filePath)}: ${err.message}`);
        return null;
    }
}

const uploadPhotos = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/maya_erp');
        console.log('📡 Connected to MongoDB\n');

        // Load all photo files
        const allPhotoFiles = fs.readdirSync(PHOTOS_DIR).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
        console.log(`📁 Found ${allPhotoFiles.length} photo files\n`);

        // Get all B.Pharm 2023 students
        const students = await Student.find({ studentId: /^BPHARM2023/ }).sort({ studentId: 1 });
        console.log(`👨‍🎓 Found ${students.length} B.Pharm 2023 students in DB\n`);

        let uploaded = 0;
        let failed = 0;
        let noPhoto = 0;
        let alreadyHasPhoto = 0;

        for (const student of students) {
            const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.replace(/\s+/g, ' ').trim();

            // Skip if already has a photo
            if (student.applicantPhoto && student.applicantPhoto.startsWith('http')) {
                console.log(`  ✅ [${student.studentId}] ${fullName} - Already has photo`);
                alreadyHasPhoto++;
                continue;
            }

            const photoFile = findStudentPhoto(fullName, allPhotoFiles);
            if (!photoFile) {
                console.log(`  ❓ [${student.studentId}] ${fullName} - No matching photo found`);
                noPhoto++;
                continue;
            }

            const fullPath = path.join(PHOTOS_DIR, photoFile);
            console.log(`  📸 [${student.studentId}] ${fullName} → ${photoFile}`);

            const url = await uploadToCloudinary(fullPath, `bpharm_2023_${student.studentId}`);
            if (url) {
                await Student.findByIdAndUpdate(student._id, {
                    applicantPhoto: url,
                    'documents.studentPhoto': url,
                });
                console.log(`     ✅ Uploaded: ${url.split('/').pop()}`);
                uploaded++;
            } else {
                failed++;
            }
        }

        console.log(`
╔══════════════════════════════════════════════╗
║      B.Pharm 2023-27 Photo Upload Done!      ║
╠══════════════════════════════════════════════╣
║  📸 Photos Uploaded    : ${String(uploaded).padEnd(19)} ║
║  ✅ Already Had Photo  : ${String(alreadyHasPhoto).padEnd(19)} ║
║  ❓ No Match Found     : ${String(noPhoto).padEnd(19)} ║
║  ❌ Upload Failed      : ${String(failed).padEnd(19)} ║
╚══════════════════════════════════════════════╝
        `);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

uploadPhotos();
