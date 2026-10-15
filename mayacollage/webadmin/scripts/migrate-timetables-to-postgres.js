/**
 * MongoDB to PostgreSQL Migration for Timetables
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
    console.log('📦 Creating PostgreSQL timetables table...');

    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS timetables (
        id VARCHAR(64) PRIMARY KEY,
        target_type VARCHAR(50) DEFAULT 'Class',
        course_id VARCHAR(64) NOT NULL,
        branch_id VARCHAR(64) NOT NULL,
        semester INTEGER NOT NULL DEFAULT 1,
        section VARCHAR(50) NOT NULL DEFAULT 'A',
        time_slots JSONB DEFAULT '[]'::jsonb,
        schedule JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_timetable_slot UNIQUE (course_id, branch_id, semester, section)
      );

      CREATE INDEX IF NOT EXISTS idx_timetables_lookup ON timetables(course_id, branch_id, semester, section);
      CREATE INDEX IF NOT EXISTS idx_timetables_updated ON timetables(updated_at DESC);
    `);

    console.log('✅ PostgreSQL timetables table created.');

    const mongoTTs = await mongoDb.collection('timetables').find({}).toArray();
    console.log(`Found ${mongoTTs.length} timetables in MongoDB.`);

    let inserted = 0;
    for (const tt of mongoTTs) {
      const id = tt._id ? tt._id.toString() : `tt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const courseId = tt.courseId ? tt.courseId.toString() : 'unknown_course';
      const branchId = tt.branchId ? tt.branchId.toString() : 'unknown_branch';
      const semester = tt.semester || 1;
      const section = tt.section || 'A';

      await pgClient.query(`
        INSERT INTO timetables (
          id, target_type, course_id, branch_id, semester, section, time_slots, schedule, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        )
        ON CONFLICT (course_id, branch_id, semester, section) DO UPDATE SET
          time_slots = EXCLUDED.time_slots,
          schedule = EXCLUDED.schedule,
          updated_at = NOW();
      `, [
        id,
        tt.targetType || 'Class',
        courseId,
        branchId,
        semester,
        section,
        JSON.stringify(tt.timeSlots || []),
        JSON.stringify(tt.schedule || []),
        tt.createdAt ? new Date(tt.createdAt) : new Date(),
        new Date()
      ]);
      inserted++;
    }

    console.log(`✅ Migrated ${inserted} timetables from MongoDB into PostgreSQL.`);

    // If zero, seed a realistic sample timetable for demo/download
    const countRes = await pgClient.query('SELECT count(*) FROM timetables');
    const total = parseInt(countRes.rows[0].count, 10);
    console.log(`Total timetables in PostgreSQL: ${total}`);

    if (total === 0) {
      console.log('🌱 Seeding demo timetable into PostgreSQL...');
      
      // Look up a course and branch from postgres if exists
      let sampleCourseId = 'sample_btech_cse';
      let sampleBranchId = 'sample_branch_ai';

      try {
        const cRes = await pgClient.query('SELECT id FROM courses LIMIT 1');
        if (cRes.rows.length > 0) sampleCourseId = cRes.rows[0].id;
        const bRes = await pgClient.query('SELECT id FROM branches LIMIT 1');
        if (bRes.rows.length > 0) sampleBranchId = bRes.rows[0].id;
      } catch (_) {}

      const sampleTimeSlots = [
        '09:00 - 10:00', 
        '10:00 - 11:00', 
        '11:00 - 12:00', 
        '12:00 - 01:00', 
        '01:00 - 02:00 (LUNCH)', 
        '02:00 - 03:00', 
        '03:00 - 04:00', 
        '04:00 - 05:00'
      ];

      const sampleSchedule = [
        {
          day: 'Monday',
          slots: [
            { subject: 'Data Structures & Algorithms', startTime: '09:00', endTime: '10:00', location: 'LH-101', type: 'Lecture', facultyName: 'Dr. Rajesh Sharma' },
            { subject: 'Operating Systems', startTime: '10:00', endTime: '11:00', location: 'LH-102', type: 'Lecture', facultyName: 'Prof. Anjali Saxena' },
            { subject: 'Database Management Lab', startTime: '11:00', endTime: '12:00', location: 'Lab 2', type: 'Lab', facultyName: 'Er. Sandeep Rawat' },
            { subject: 'Computer Networks', startTime: '02:00', endTime: '03:00', location: 'LH-101', type: 'Lecture', facultyName: 'Dr. Amit Chauhan' }
          ]
        },
        {
          day: 'Tuesday',
          slots: [
            { subject: 'Discrete Mathematics', startTime: '09:00', endTime: '10:00', location: 'LH-201', type: 'Lecture', facultyName: 'Dr. Meenakshi Pant' },
            { subject: 'Data Structures Lab', startTime: '10:00', endTime: '11:00', location: 'Lab 1', type: 'Lab', facultyName: 'Dr. Rajesh Sharma' },
            { subject: 'Software Engineering', startTime: '02:00', endTime: '03:00', location: 'LH-103', type: 'Tutorial', facultyName: 'Prof. Vikas Negi' }
          ]
        },
        {
          day: 'Wednesday',
          slots: [
            { subject: 'Web Technologies', startTime: '09:00', endTime: '10:00', location: 'LH-104', type: 'Lecture', facultyName: 'Er. Rohit Kumar' },
            { subject: 'Computer Networks Lab', startTime: '11:00', endTime: '12:00', location: 'Lab 3', type: 'Lab', facultyName: 'Dr. Amit Chauhan' }
          ]
        },
        {
          day: 'Thursday',
          slots: [
            { subject: 'Theory of Computation', startTime: '10:00', endTime: '11:00', location: 'LH-101', type: 'Lecture', facultyName: 'Prof. Suresh Joshi' },
            { subject: 'Artificial Intelligence', startTime: '02:00', endTime: '03:00', location: 'LH-202', type: 'Lecture', facultyName: 'Dr. Neha Verma' }
          ]
        },
        {
          day: 'Friday',
          slots: [
            { subject: 'Cloud Computing', startTime: '09:00', endTime: '10:00', location: 'LH-102', type: 'Lecture', facultyName: 'Er. Sandeep Rawat' },
            { subject: 'Project Lab / Seminar', startTime: '02:00', endTime: '04:00', location: 'Lab 4', type: 'Practical', facultyName: 'Dr. Rajesh Sharma' }
          ]
        },
        {
          day: 'Saturday',
          slots: [
            { subject: 'Technical Communication & Soft Skills', startTime: '10:00', endTime: '11:00', location: 'Auditorium', type: 'Seminar', facultyName: 'Ms. Pooja Bhatt' }
          ]
        }
      ];

      await pgClient.query(`
        INSERT INTO timetables (
          id, target_type, course_id, branch_id, semester, section, time_slots, schedule, created_at, updated_at
        ) VALUES (
          'tt_seed_cse_sem3', 'Class', $1, $2, 3, 'A', $3, $4, NOW(), NOW()
        ) ON CONFLICT DO NOTHING;
      `, [sampleCourseId, sampleBranchId, JSON.stringify(sampleTimeSlots), JSON.stringify(sampleSchedule)]);

      console.log('✅ Seeded demo timetable.');
    }

  } catch (err) {
    console.error('❌ Migration Error:', err);
  } finally {
    pgClient.release();
    await pool.end();
    await mongoose.disconnect();
    console.log('🎉 Timetable PostgreSQL setup completed.');
  }
}

run();
