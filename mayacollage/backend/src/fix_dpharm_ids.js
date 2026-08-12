import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Student } from './models/studentModel.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/maya_erp');
        console.log('Connected to DB');

        const dpharmId = new mongoose.Types.ObjectId('6a44b38f6d2da6aee53d4bb5');

        // Find students in D.Pharm missing studentId
        const students = await Student.find({
            selectedProgram: dpharmId,
            sessionYear: '2024-26',
            $or: [
                { studentId: { $exists: false } },
                { studentId: null },
                { studentId: "" }
            ]
        }).sort({ createdAt: 1 });

        console.log(`Found ${students.length} students missing studentId.`);

        const prefix = '24DP';
        
        let existingCount = await Student.countDocuments({
            selectedProgram: dpharmId,
            sessionYear: '2024-26',
            studentId: { $exists: true, $ne: null, $ne: "" }
        });

        let updatedCount = 0;

        for (const student of students) {
            let serial = existingCount + 1;
            let admissionNo = `${prefix}${serial.toString().padStart(3, '0')}`;

            while (await Student.findOne({ $or: [{ admissionNumber: admissionNo }, { studentId: admissionNo }] })) {
                serial++;
                admissionNo = `${prefix}${serial.toString().padStart(3, '0')}`;
            }

            student.admissionNumber = admissionNo;
            student.studentId = admissionNo;
            // Also generate an enrollmentNumber placeholder if needed, but not strictly required.
            
            await student.save();
            existingCount++;
            updatedCount++;
            console.log(`Assigned ${admissionNo} to ${student.firstName} ${student.lastName}`);
        }

        console.log(`Successfully updated ${updatedCount} students.`);
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

run();
