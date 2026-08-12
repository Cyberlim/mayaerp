import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function diagnose() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    console.log('Connected\n');

    // Search for student 23BB021
    const student = await db.collection('students').findOne({
        $or: [
            { studentId: '23BB021' },
            { admissionNumber: '23BB021' },
            { studentId: { $regex: /23BB021/i } }
        ]
    });

    if (!student) {
        console.log('❌ Student 23BB021 NOT FOUND in database!');
        
        // Show all 23BB* students
        const similar = await db.collection('students').find({ studentId: /^23BB/i }).toArray();
        console.log(`\nFound ${similar.length} students with 23BB prefix:`);
        similar.forEach(s => console.log(`  - ${s.studentId} | ${s.firstName} ${s.lastName} | DOB: ${s.dob}`));
        process.exit(0);
    }

    console.log('✅ Student found:');
    console.log(`  ID: ${student.studentId}`);
    console.log(`  Name: ${student.firstName} ${student.lastName}`);
    console.log(`  DOB: ${student.dob}`);
    console.log(`  Email: ${student.email}`);
    console.log(`  Password hash: ${student.password ? student.password.substring(0,20) + '...' : 'NONE'}`);
    console.log(`  Is bcrypt hash: ${student.password && student.password.startsWith('$2')}`);

    // Test all possible passwords
    const testPasswords = ['29/07/2005', '29-07-2005', '29072005', 'Password@123', 'Maya@2023'];
    console.log('\nPassword tests:');
    for (const pwd of testPasswords) {
        const match = await bcrypt.compare(pwd, student.password);
        console.log(`  "${pwd}": ${match ? '✅ MATCH' : '❌ no match'}`);
    }

    // Also test the actual DOB stored in DB
    if (student.dob) {
        const dobMatch = await bcrypt.compare(student.dob, student.password);
        console.log(`  Stored DOB "${student.dob}": ${dobMatch ? '✅ MATCH' : '❌ no match'}`);
    }

    process.exit(0);
}

diagnose().catch(e => { console.error(e.message); process.exit(1); });
