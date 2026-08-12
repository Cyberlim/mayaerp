import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function audit() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    console.log('Connected\n');

    const students = await db.collection('students').find({}).toArray();
    console.log(`Total students: ${students.length}\n`);

    let dobPassword = 0;
    let pwd123 = 0;
    let other = 0;
    const otherStudents = [];

    for (const s of students) {
        if (!s.password) { other++; otherStudents.push(`${s.studentId} - NO PASSWORD`); continue; }
        const isDob = s.dob && await bcrypt.compare(s.dob, s.password);
        const is123 = await bcrypt.compare('Password@123', s.password);
        
        if (isDob) dobPassword++;
        else if (is123) pwd123++;
        else { other++; otherStudents.push(`${s.studentId} (${s.firstName}) DOB:${s.dob}`); }
    }

    console.log(`✅ DOB as password: ${dobPassword} students`);
    console.log(`⚠️  Password@123:    ${pwd123} students  ← NEEDS RESET`);
    console.log(`❓ Other/unknown:   ${other} students`);
    
    if (otherStudents.length > 0) {
        console.log('\nOther password students:');
        otherStudents.forEach(s => console.log(' -', s));
    }

    process.exit(0);
}

audit().catch(e => { console.error(e.message); process.exit(1); });
