import mongoose from 'mongoose';
import dotenv from 'dotenv';
import xlsx from 'xlsx';
import { Student } from './models/studentModel.js';

dotenv.config();

const excelDateToJSDate = (serial) => {
    if (!serial) return null;
    if (typeof serial === 'string') return serial; // already a string maybe
    const utc_days  = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;                                        
    const date_info = new Date(utc_value * 1000);
    return date_info.toLocaleDateString('en-GB'); // DD/MM/YYYY
};

const toTitleCase = (str) => {
    if (!str) return null;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/maya_erp');
        console.log('Connected to DB');

        const courseId = new mongoose.Types.ObjectId('6a157a09934eaa307953202a'); // Bachelor of Pharmacy
        const branchId = new mongoose.Types.ObjectId('6a15797f934eaa3079532001'); // PHARMACY

        const workbook = xlsx.readFile('C:/Users/kdev7/Downloads/maya-collage/mayaerp/mayaerp/admin/data/D.Pharm 2024-26 C (1).xlsx');
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        const headers = data[0];
        let inserted = 0;

        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0 || !row[3]) continue; // Skip empty rows or rows without student name

            const rawName = String(row[3]).trim();
            const nameParts = rawName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || 'Unknown'; // Required field

            const rawGender = row[11] ? String(row[11]).trim().toLowerCase() : null;
            let gender = 'Other';
            if (rawGender === 'male' || rawGender === 'm') gender = 'Male';
            if (rawGender === 'female' || rawGender === 'f') gender = 'Female';

            let dobStr = excelDateToJSDate(row[12]) || excelDateToJSDate(row[14]) || '01/01/2000'; // DOB required

            let mobile = row[9] ? String(row[9]).trim() : null;
            if (!mobile || mobile.length < 5) mobile = '0000000000'; // Required field

            const studentData = {
                firstName: firstName,
                lastName: lastName,
                gender: gender,
                dob: dobStr,
                mobile: mobile,
                password: 'Password@123',
                
                email: row[10] ? String(row[10]).trim() : null,
                address: row[4] ? String(row[4]).trim() : null,
                city: row[7] ? String(row[7]).trim() : null,
                state: row[6] ? String(row[6]).trim() : null,
                pinCode: row[8] ? String(row[8]).trim() : null,
                parentMobile: row[13] ? String(row[13]).trim() : null,
                category: row[15] ? String(row[15]).trim() : null,
                religion: row[16] ? String(row[16]).trim() : null,
                aadharNumber: row[21] ? String(row[21]).trim() : null,
                
                selectedProgram: courseId,
                selectedBranch: branchId,
                sessionYear: '2024-26',
                status: 'Approved',
                studentStatus: 'Active',
                
                // Fields to be skipped
                applicantPhoto: null,
                documents: {
                    studentPhoto: null,
                }
            };

            const student = new Student(studentData);
            await student.save();
            inserted++;
        }

        console.log(`Successfully uploaded ${inserted} students.`);
        process.exit(0);

    } catch (error) {
        console.error('Error importing data:', error);
        process.exit(1);
    }
};

run();
