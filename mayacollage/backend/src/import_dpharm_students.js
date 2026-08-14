import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import xlsx from 'xlsx';
import { Student } from './models/studentModel.js';
import Course from './models/courseModel.js';
import Branch from './models/branchModel.js';

dotenv.config({ path: 'C:\\Users\\Lalit\\OneDrive\\Desktop\\maya web or backend\\mayacollage\\backend\\.env' });

const EXCEL_PATH = 'c:\\Users\\Lalit\\OneDrive\\Desktop\\maya web or backend\\mayacollage\\webadmin\\mayadata\\D.Pharm 2025-27 C.xlsx';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('📡 Connected to MongoDB');

        let pharmacyBranch = await Branch.findOne({ name: 'Pharmacy' });
        let dpharmaCourse = await Course.findOne({ name: 'D.Pharma' });

        if (!pharmacyBranch || !dpharmaCourse) {
            throw new Error("Pharmacy Branch or D.Pharma course not found!");
        }

        const workbook = xlsx.readFile(EXCEL_PATH);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        console.log(`📊 Found ${data.length} rows in Excel`);

        const hashedPassword = await bcrypt.hash('student123', 10);
        let importedCount = 0;

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0 || !row[3]) continue;

            const fullName = String(row[3]).trim();
            if (fullName === '' || fullName.toLowerCase().includes('student name')) continue;

            const fatherName = row[14] ? String(row[14]).trim() : '';
            const mobile = row[7] ? String(row[7]).trim() : '0000000000';
            const parentMobile = row[11] ? String(row[11]).trim() : '';

            const nameParts = fullName.split(' ');
            const firstName = nameParts[0] || 'Unknown';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Student';
            
            const studentId = `DPH25${String(importedCount + 1).padStart(3, '0')}`;
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s/g, '')}@mayaerp.com`;

            const existing = await Student.findOne({ studentId });
            if (existing) {
                console.log(`Student ${studentId} already exists, skipping...`);
                continue;
            }

            const student = new Student({
                studentId,
                enrollmentNumber: `ENR${studentId}`,
                password: hashedPassword,
                firstName,
                lastName,
                middleName: fatherName,
                dob: '2005-01-01',
                gender: 'Male',
                email,
                mobile: mobile,
                parentMobile: parentMobile,
                selectedBranch: pharmacyBranch._id,
                selectedProgram: dpharmaCourse._id,
                selectedSemester: 1,
                sessionYear: '2025-2027',
                admissionYear: '2025',
                batch: '2025',
                studentStatus: 'Active',
                status: 'Active'
            });

            await student.save();
            importedCount++;
        }

        console.log(`🎉 Successfully imported ${importedCount} D.Pharm (2025) students!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during import:', error);
        process.exit(1);
    }
};

run();
