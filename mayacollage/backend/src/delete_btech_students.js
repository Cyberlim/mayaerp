import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Student } from './models/studentModel.js';
import Course from './models/courseModel.js';

dotenv.config({ path: 'C:\\Users\\Lalit\\OneDrive\\Desktop\\maya web or backend\\mayacollage\\backend\\.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('📡 Connected to MongoDB');

        // Find B.Tech course
        let btechCourse = await Course.findOne({ name: { $regex: /^B\.?Tech/i } });
        
        if (!btechCourse) {
            console.error("❌ B.Tech course not found!");
            const allCourses = await Course.find({});
            console.log("Existing courses:", allCourses.map(c => c.name));
            // Maybe they spelled it differently
            btechCourse = await Course.findOne({ name: { $regex: /tech/i } });
            if (!btechCourse) {
                throw new Error("B.Tech course not found!");
            }
        }

        console.log(`✅ Found Course: ${btechCourse.name}`);

        // Count students before deleting
        const studentCount = await Student.countDocuments({ selectedProgram: btechCourse._id });
        console.log(`📊 Found ${studentCount} students in ${btechCourse.name}`);

        // Delete students
        const deleteResult = await Student.deleteMany({ selectedProgram: btechCourse._id });
        console.log(`🗑️ Successfully deleted ${deleteResult.deletedCount} B.Tech students.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

run();
