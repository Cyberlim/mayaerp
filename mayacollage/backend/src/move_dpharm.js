import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Student } from './models/studentModel.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/maya_erp');
        console.log('Connected to DB');

        const bpharmId = new mongoose.Types.ObjectId('6a157a09934eaa307953202a');
        const dpharmId = new mongoose.Types.ObjectId('6a44b38f6d2da6aee53d4bb5');

        // Find students uploaded recently (in the last 1 hour) for B.Pharm and sessionYear 2024-26
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        const students = await Student.find({
            selectedProgram: bpharmId,
            sessionYear: '2024-26',
            createdAt: { $gt: oneHourAgo }
        });

        console.log(`Found ${students.length} students to move.`);

        if (students.length > 0) {
            const result = await Student.updateMany(
                {
                    selectedProgram: bpharmId,
                    sessionYear: '2024-26',
                    createdAt: { $gt: oneHourAgo }
                },
                {
                    $set: { selectedProgram: dpharmId }
                }
            );
            console.log(`Updated ${result.modifiedCount} students.`);
        }

        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

run();
