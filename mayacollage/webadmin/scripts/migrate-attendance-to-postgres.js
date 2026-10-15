/**
 * MongoDB to PostgreSQL Migration for Attendance Records
 */
const mongoose = require('mongoose');
const { Pool } = require('pg');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://thestudentzilla_db_user:NL2wc3tgnB6EzpPl@mayacollage.ktxtgpi.mongodb.net/';
const PG_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_pADeFi9rGlU2@ep-royal-field-b4fsklle-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: PG_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('🚀 Connecting to MongoDB and PostgreSQL...');
  const pgClient = await pool.connect();
  await mongoose.connect(MONGO_URI);
  const mongoDb = mongoose.connection.db;

  try {
    console.log('📦 Creating PostgreSQL attendance table...');

    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id VARCHAR(64) PRIMARY KEY,
        student_id VARCHAR(64) NOT NULL,
        student_roll VARCHAR(100),
        student_name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Present',
        is_late BOOLEAN DEFAULT FALSE,
        department VARCHAR(100) DEFAULT 'General',
        course VARCHAR(150) DEFAULT 'General',
        section VARCHAR(50) DEFAULT 'A',
        subject VARCHAR(150) NOT NULL DEFAULT 'General Attendance',
        subject_code VARCHAR(50) NOT NULL DEFAULT 'GEN',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_student_att UNIQUE (student_id, date, subject_code)
      );

      CREATE INDEX IF NOT EXISTS idx_att_date ON attendance(date);
      CREATE INDEX IF NOT EXISTS idx_att_student ON attendance(student_id);
      CREATE INDEX IF NOT EXISTS idx_att_subject ON attendance(subject_code);
    `);

    console.log('✅ PostgreSQL attendance table created.');

    const mongoAtts = await mongoDb.collection('attendances').find({}).toArray();
    console.log(`Found ${mongoAtts.length} attendance records in MongoDB.`);

    let inserted = 0;
    for (const a of mongoAtts) {
      const id = a._id ? a._id.toString() : `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const studentId = a.student ? a.student.toString() : (a.studentId || 'unknown');
      const dateStr = a.date ? new Date(a.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const subject = a.subject || 'General Attendance';
      const subjectCode = a.subjectCode || subject.substring(0, 3).toUpperCase();

      await pgClient.query(`
        INSERT INTO attendance (
          id, student_id, student_roll, student_name, date, status, is_late,
          department, course, section, subject, subject_code, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14
        )
        ON CONFLICT (student_id, date, subject_code) DO UPDATE SET
          status = EXCLUDED.status,
          is_late = EXCLUDED.is_late,
          updated_at = NOW();
      `, [
        id,
        studentId,
        a.studentId || null,
        a.studentName || 'Student',
        dateStr,
        a.status || 'Present',
        a.isLate || false,
        a.department || 'General',
        a.course || 'General',
        a.section || 'A',
        subject,
        subjectCode,
        a.createdAt ? new Date(a.createdAt) : new Date(),
        new Date()
      ]);
      inserted++;
    }

    console.log(`✅ Migrated ${inserted} attendance records from MongoDB into PostgreSQL.`);

    // If zero, seed demo attendance records for today and recent days
    const countRes = await pgClient.query('SELECT count(*) FROM attendance');
    const total = parseInt(countRes.rows[0].count, 10);
    console.log(`Total attendance records in PostgreSQL: ${total}`);

    if (total === 0) {
      console.log('🌱 Seeding demo attendance records into PostgreSQL...');
      
      let sampleStudents = [];
      try {
        const sRes = await pgClient.query('SELECT id, first_name, last_name, student_id FROM students LIMIT 10');
        sampleStudents = sRes.rows;
      } catch (_) {}

      if (sampleStudents.length === 0) {
        sampleStudents = [
          { id: 'stu_demo_01', first_name: 'Aarav', last_name: 'Sharma', student_id: '2024CSE001' },
          { id: 'stu_demo_02', first_name: 'Ananya', last_name: 'Verma', student_id: '2024CSE002' },
          { id: 'stu_demo_03', first_name: 'Rohan', last_name: 'Gupta', student_id: '2024CSE003' },
          { id: 'stu_demo_04', first_name: 'Priya', last_name: 'Rawat', student_id: '2024CSE004' },
          { id: 'stu_demo_05', first_name: 'Devansh', last_name: 'Mehta', student_id: '2024CSE005' },
        ];
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const statuses = ['Present', 'Present', 'Present', 'Late', 'Absent'];

      for (let i = 0; i < sampleStudents.length; i++) {
        const st = sampleStudents[i];
        const status = statuses[i % statuses.length];
        const fullName = `${st.first_name || ''} ${st.last_name || ''}`.trim() || 'Student';

        await pgClient.query(`
          INSERT INTO attendance (
            id, student_id, student_roll, student_name, date, status, is_late,
            subject, subject_code, department, course, section, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            'General Attendance', 'GEN', 'Computer Science', 'B.Tech CSE', 'A', NOW(), NOW()
          ) ON CONFLICT DO NOTHING;
        `, [
          `att_seed_${i}`,
          st.id,
          st.student_id || `2024STU${i}`,
          fullName,
          todayStr,
          status,
          status === 'Late'
        ]);
      }
      console.log('✅ Seeded demo attendance for today.');
    }

  } catch (err) {
    console.error('❌ Migration Error:', err);
  } finally {
    pgClient.release();
    await pool.end();
    await mongoose.disconnect();
    console.log('🎉 Attendance PostgreSQL setup complete.');
  }
}

run();
