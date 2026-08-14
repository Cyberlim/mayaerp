import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import xlsx from 'xlsx';
import { Student } from './models/studentModel.js';
import Course from './models/courseModel.js';
import Branch from './models/branchModel.js';

dotenv.config({ path: 'C:\\Users\\Lalit\\OneDrive\\Desktop\\maya web or backend\\mayacollage\\backend\\.env' });

const EXCEL_PATH = 'c:\\Users\\Lalit\\OneDrive\\Desktop\\maya web or backend\\mayacollage\\webadmin\\mayadata\\BCA 2025-28 C.xlsx';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('📡 Connected to MongoDB');

        // BCA course search under Computer Science branch
        let branch = await Branch.findOne({ name: { $regex: /Computer Science/i } });
        if (!branch) {
            console.error("❌ Computer Science branch not found!");
            const allBranches = await Branch.find({});
            console.log("Existing branches:", allBranches.map(b => b.name));
            // Maybe they spelled it differently
            branch = await Branch.findOne({ name: { $regex: /Computer/i } });
            if (!branch) {
                throw new Error("Computer Science branch not found!");
            }
        }

        let course = await Course.findOne({ name: { $regex: /^BCA/i } });
        if (!course) {
            console.error("❌ BCA course not found!");
            const allCourses = await Course.find({});
            console.log("Existing courses:", allCourses.map(c => c.name));
            throw new Error("BCA course not found!");
        }

        console.log(`✅ Found Branch: ${branch.name}`);
        console.log(`✅ Found Course: ${course.name}`);

        const workbook = xlsx.readFile(EXCEL_PATH);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        console.log(`📊 Found ${data.length} rows in Excel`);

        const hashedPassword = await bcrypt.hash('student123', 10);
        let importedCount = 0;

        for (let i = 1; i < data.length; i++) { // Start from index 1 to skip header row
            const row = data[i];
            if (!row || row.length === 0 || !row[3]) continue;

            const fullName = String(row[3]).trim();
            if (fullName === '' || fullName.toLowerCase().includes('student name')) continue;

            const fatherName = row[17] ? String(row[17]).trim() : '';
            const mobile = row[9] ? String(row[9]).trim() : '0000000000';
            const parentMobile = row[13] ? String(row[13]).trim() : '';
            
            let address = row[4] ? String(row[4]).trim() : '';
            if (row[5]) address += ' ' + String(row[5]).trim();
            const state = row[6] ? String(row[6]).trim() : '';
            const city = row[7] ? String(row[7]).trim() : '';
            const zipCode = row[8] ? String(row[8]).trim() : '';
            
            let email = row[10] ? String(row[10]).trim().toLowerCase() : '';

            const nameParts = fullName.split(' ');
            const firstName = nameParts[0] || 'Unknown';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Student';
            
            if (!email || !email.includes('@')) {
                email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s/g, '')}@mayaerp.com`;
            }

            const studentId = `BCA25${String(importedCount + 1).padStart(3, '0')}`;

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
                address,
                city,
                state,
                pinCode: zipCode,
                selectedBranch: branch._id,
                selectedProgram: course._id,
                selectedSemester: 1,
                sessionYear: '2025-2028',
                admissionYear: '2025',
                batch: '2025',
                studentStatus: 'Active',
                status: 'Active'
            });

            await student.save();
            importedCount++;
        }

        console.log(`🎉 Successfully imported ${importedCount} BCA (2025) students!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during import:', error);
        process.exit(1);
    }
};

run();
