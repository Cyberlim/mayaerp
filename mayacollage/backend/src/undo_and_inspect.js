import mongoose from 'mongoose';
import dotenv from 'dotenv';
import xlsx from 'xlsx';
import { Student } from './models/studentModel.js';

dotenv.config({ path: 'C:\\Users\\Lalit\\OneDrive\\Desktop\\maya web or backend\\mayacollage\\backend\\.env' });

const EXCEL_PATH = 'c:\\Users\\Lalit\\OneDrive\\Desktop\\maya web or backend\\mayacollage\\webadmin\\mayadata\\MBA 2024-26 C.xlsx';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('📡 Connected to MongoDB');

        // 1. Delete all MBA24 students to undo
        const deleteResult = await Student.deleteMany({ studentId: { $regex: /^MBA24/ } });
        console.log(`🗑️ Undid last import: Deleted ${deleteResult.deletedCount} students.`);

        // 2. Inspect the file to see what course it actually specifies
        const workbook = xlsx.readFile(EXCEL_PATH);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        console.log("File First Data Row:", data[1]);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
run();
