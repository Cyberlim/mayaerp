import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const checkCourses = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/maya_erp');
        const db = mongoose.connection.db;
        const courses = await db.collection('courses').find({}).toArray();
        const branches = await db.collection('branches').find({}).toArray();
        
        console.log('Courses:');
        courses.forEach(c => console.log(c._id, c.name));
        
        console.log('\nBranches:');
        branches.forEach(b => console.log(b._id, b.name, 'CourseID:', b.course));
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkCourses();
