import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import xlsx from 'xlsx';
import { Student } from './models/studentModel.js';
import Course from './models/courseModel.js';
import Branch from './models/branchModel.js';

dotenv.config({ path: 'C:\\Users\\Lalit\\OneDrive\\Desktop\\maya web or backend\\mayacollage\\backend\\.env' });

const EXCEL_PATH = 'c:\\Users\\Lalit\\OneDrive\\Desktop\\maya web or backend\\mayacollage\\webadmin\\mayadata\\B.Pharm 2023-27 C (1).xlsx';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('📡 Connected to MongoDB');

        // 1. Create Pharmacy Branch
        let pharmacyBranch = await Branch.findOne({ name: 'Pharmacy' });
        if (!pharmacyBranch) {
            pharmacyBranch = new Branch({
                name: 'Pharmacy',
                code: 'PHARM',
                description: 'Pharmacy Department'
            });
            await pharmacyBranch.save();
            console.log('✅ Created Pharmacy Branch');
        }

        // 2. Create B.Pharma Course
        let bpharmaCourse = await Course.findOne({ name: 'B.Pharma' });
        if (!bpharmaCourse) {
            bpharmaCourse = new Course({
                name: 'B.Pharma',
                code: 'BPH',
                duration: 4,
                totalSemesters: 8,
                branchId: pharmacyBranch._id,
                description: 'Bachelor of Pharmacy',
                tuitionFee: 100000,
                coordinator: 'Dr. Coordinator',
                intakeCapacity: 60
            });
            await bpharmaCourse.save();
            console.log('✅ Created B.Pharma Course');
        }

        // 3. Read Excel
        const workbook = xlsx.readFile(EXCEL_PATH);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet, { range: 1 });

        console.log(`📊 Found ${data.length} students in Excel`);

        // Clear existing students to fix the double/bad import
        await Student.deleteMany({});
        console.log('🗑️ Cleared existing students for a fresh import.');

        const hashedPassword = await bcrypt.hash('student123', 10);
        let importedCount = 0;

        // Only process the first 63 students (skipping lateral entry and headers at the bottom)
        const limit = Math.min(data.length, 63);

        for (let i = 0; i < limit; i++) {
            const row = data[i];
            const fullName = row['Student Name '];

            // Skip invalid rows (internal headers, empty rows)
            if (!fullName || fullName.trim() === '' || fullName.trim() === 'Student Name') {
                console.log(`Skipping invalid row ${i}: ${row['S.No.']} - ${fullName}`);
                continue;
            }

            const fatherName = row['Father Name '] || '';
            const mobile = row['Student Mobile No. '] || '0000000000';
            const parentMobile = row['Father Mobile No.'] || '';

            const nameParts = fullName.trim().split(' ');
            const firstName = nameParts[0] || 'Unknown';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Student';
            
            const studentId = `BPH23${String(importedCount + 1).padStart(3, '0')}`;
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s/g, '')}@mayaerp.com`;

            const student = new Student({
                studentId,
                enrollmentNumber: `ENR${studentId}`,
                password: hashedPassword,
                firstName,
                lastName,
                middleName: fatherName, // Store father name here for now or add to profile later
                dob: '2005-01-01',
                gender: 'Male', // Mock
                email,
                mobile: String(mobile),
                parentMobile: String(parentMobile),
                selectedBranch: pharmacyBranch._id,
                selectedProgram: bpharmaCourse._id,
                selectedSemester: 1,
                sessionYear: '2023-2027',
                admissionYear: '2023',
                batch: '2023',
                studentStatus: 'Active',
                status: 'Active'
            });

            await student.save();
            importedCount++;
        }

        console.log(`🎉 Successfully imported ${importedCount} B.Pharm students!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during import:', error);
        process.exit(1);
    }
};

run();
