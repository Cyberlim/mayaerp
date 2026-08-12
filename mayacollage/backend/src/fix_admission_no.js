import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    await mongoose.connect('mongodb+srv://thestudentzilla_db_user:NL2wc3tgnB6EzpPl@mayacollage.ktxtgpi.mongodb.net/');
    const Student = mongoose.model('Student', new mongoose.Schema({}, {strict: false}));

    const students = await Student.find({studentId: /^BPHARM2023/}).lean();
    let updated = 0;
    for (const s of students) {
        if (s.admissionNumber !== s.studentId) {
            await Student.updateOne({ _id: s._id }, { $set: { admissionNumber: s.studentId } });
            updated++;
        }
    }
    console.log('Admission numbers updated to match studentId:', updated);

    // Let's also check for dummy data in Course and Branch
    const Course = mongoose.model('Course', new mongoose.Schema({}, {strict: false}));
    const Branch = mongoose.model('Branch', new mongoose.Schema({}, {strict: false}));
    
    console.log('--- ALL BRANCHES ---');
    const branches = await Branch.find().lean();
    console.log(branches.map(b => `${b.name} (${b.code}) - ${b._id}`).join('\n'));

    console.log('--- ALL COURSES ---');
    const courses = await Course.find().lean();
    console.log(courses.map(c => `${c.name} (${c.code}) - Branch: ${c.branchId} - ${c._id}`).join('\n'));

    await mongoose.disconnect();
};
run();
