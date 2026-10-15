/**
 * MongoDB to PostgreSQL Migration & Seeding for Admissions & Applications
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
    console.log('📦 Creating PostgreSQL tables for Admissions / Applications...');

    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id VARCHAR(64) PRIMARY KEY,
        first_name VARCHAR(150) NOT NULL,
        last_name VARCHAR(150) NOT NULL,
        dob VARCHAR(50) NOT NULL,
        gender VARCHAR(50) NOT NULL DEFAULT 'Male',
        email VARCHAR(255) NOT NULL,
        mobile VARCHAR(50) NOT NULL,
        alternate_mobile VARCHAR(50),
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pin_code VARCHAR(20) NOT NULL,
        applicant_photo TEXT,
        
        -- Academic
        highest_qualification VARCHAR(150) NOT NULL,
        institution_name VARCHAR(255) NOT NULL,
        board_university VARCHAR(255) NOT NULL,
        percentage_cgpa VARCHAR(50) NOT NULL,
        year_of_passing VARCHAR(50) NOT NULL,
        subject_marks JSONB DEFAULT '{}'::jsonb,
        entrance_score VARCHAR(50),

        -- Program
        selected_program VARCHAR(100) NOT NULL,
        selected_branch VARCHAR(100),
        session_year VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'General',
        statement_of_purpose TEXT,

        -- Documents
        documents JSONB DEFAULT '{}'::jsonb,

        -- Status & Student Association
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        student_id VARCHAR(100),
        admission_number VARCHAR(100),
        password VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_apps_status ON applications(status);
      CREATE INDEX IF NOT EXISTS idx_apps_program ON applications(selected_program);
      CREATE INDEX IF NOT EXISTS idx_apps_created_at ON applications(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_apps_student_id ON applications(student_id);
    `);

    console.log('✅ PostgreSQL schema created.');

    // Check count from MongoDB
    const mongoApps = await mongoDb.collection('applications').find({}).toArray();
    console.log(`Found ${mongoApps.length} applications in MongoDB.`);

    let insertedCount = 0;
    for (const app of mongoApps) {
      const id = app._id ? app._id.toString() : `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await pgClient.query(`
        INSERT INTO applications (
          id, first_name, last_name, dob, gender, email, mobile, alternate_mobile,
          address, city, state, pin_code, applicant_photo,
          highest_qualification, institution_name, board_university, percentage_cgpa,
          year_of_passing, subject_marks, entrance_score,
          selected_program, selected_branch, session_year, category, statement_of_purpose,
          documents, status, student_id, admission_number, password, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13,
          $14, $15, $16, $17,
          $18, $19, $20,
          $21, $22, $23, $24, $25,
          $26, $27, $28, $29, $30, $31, $32
        )
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          updated_at = NOW();
      `, [
        id,
        app.firstName || 'Unknown',
        app.lastName || '',
        app.dob || '2004-01-01',
        app.gender || 'Male',
        app.email || 'applicant@mayaerp.edu',
        app.mobile || '9876543210',
        app.alternateMobile || null,
        app.address || 'Campus Address',
        app.city || 'Dehradun',
        app.state || 'Uttarakhand',
        app.pinCode || '248001',
        app.applicantPhoto || null,
        app.highestQualification || '12th Standard',
        app.institutionName || 'Doon Public School',
        app.boardUniversity || 'CBSE',
        app.percentageCGPA || '85.4%',
        app.yearOfPassing || '2024',
        JSON.stringify(app.subjectMarks || {}),
        app.entranceScore || null,
        app.selectedProgram ? app.selectedProgram.toString() : 'Computer Science and Engineering',
        app.selectedBranch ? app.selectedBranch.toString() : null,
        app.sessionYear || '2024-2025',
        app.category || 'General',
        app.statementOfPurpose || null,
        JSON.stringify(app.documents || {}),
        app.status || 'Pending',
        app.studentId || null,
        app.admissionNumber || null,
        app.password || null,
        app.createdAt ? new Date(app.createdAt) : new Date(),
        new Date()
      ]);
      insertedCount++;
    }

    console.log(`✅ Migrated ${insertedCount} applications from MongoDB to PostgreSQL.`);

    // If there were no applications in MongoDB, create realistic sample applications
    const countRes = await pgClient.query('SELECT count(*) FROM applications');
    const totalInPg = parseInt(countRes.rows[0].count, 10);
    console.log(`Total applications in PostgreSQL: ${totalInPg}`);

    if (totalInPg < 5) {
      console.log('🌱 Seeding rich sample applications into PostgreSQL...');
      const samples = [
        {
          id: 'app_seed_001',
          first_name: 'Aarav',
          last_name: 'Sharma',
          dob: '2005-04-12',
          gender: 'Male',
          email: 'aarav.sharma@example.com',
          mobile: '9812345670',
          address: '42 Rajpur Road',
          city: 'Dehradun',
          state: 'Uttarakhand',
          pin_code: '248001',
          highest_qualification: 'Class 12th (PCM)',
          institution_name: 'St. Joseph Academy',
          board_university: 'CBSE',
          percentage_cgpa: '92.5%',
          year_of_passing: '2024',
          selected_program: 'Computer Science and Engineering',
          selected_branch: 'Artificial Intelligence & Machine Learning',
          session_year: '2024-2025',
          category: 'General',
          status: 'Accepted',
          student_id: '2024CSE001',
          admission_number: 'ADM2024-001',
          created_at: new Date(Date.now() - 15 * 86400000)
        },
        {
          id: 'app_seed_002',
          first_name: 'Ananya',
          last_name: 'Verma',
          dob: '2005-09-21',
          gender: 'Female',
          email: 'ananya.verma@example.com',
          mobile: '9876501234',
          address: '15 Nehru Colony',
          city: 'Dehradun',
          state: 'Uttarakhand',
          pin_code: '248001',
          highest_qualification: 'Class 12th (PCM)',
          institution_name: 'Brightlands School',
          board_university: 'ICSE',
          percentage_cgpa: '89.2%',
          year_of_passing: '2024',
          selected_program: 'Computer Science and Engineering',
          selected_branch: 'Cybersecurity',
          session_year: '2024-2025',
          category: 'OBC',
          status: 'Approved',
          student_id: '2024CSE002',
          admission_number: 'ADM2024-002',
          created_at: new Date(Date.now() - 10 * 86400000)
        },
        {
          id: 'app_seed_003',
          first_name: 'Rohan',
          last_name: 'Gupta',
          dob: '2004-11-05',
          gender: 'Male',
          email: 'rohan.gupta@example.com',
          mobile: '9123456789',
          address: '88 Sector 14',
          city: 'Chandigarh',
          state: 'Punjab',
          pin_code: '160014',
          highest_qualification: 'Class 12th (Commerce)',
          institution_name: 'DAV Public School',
          board_university: 'CBSE',
          percentage_cgpa: '84.0%',
          year_of_passing: '2024',
          selected_program: 'Bachelor of Business Administration',
          selected_branch: 'Finance',
          session_year: '2024-2025',
          category: 'General',
          status: 'Pending',
          created_at: new Date(Date.now() - 4 * 86400000)
        },
        {
          id: 'app_seed_004',
          first_name: 'Priya',
          last_name: 'Rawat',
          dob: '2005-02-18',
          gender: 'Female',
          email: 'priya.rawat@example.com',
          mobile: '9845123456',
          address: '7 Canal Road',
          city: 'Rishikesh',
          state: 'Uttarakhand',
          pin_code: '249201',
          highest_qualification: 'Class 12th (PCB)',
          institution_name: 'Modern School',
          board_university: 'State Board',
          percentage_cgpa: '81.6%',
          year_of_passing: '2024',
          selected_program: 'Bachelor of Pharmacy',
          selected_branch: 'Pharmaceutics',
          session_year: '2024-2025',
          category: 'SC',
          status: 'Pending',
          created_at: new Date(Date.now() - 2 * 86400000)
        },
        {
          id: 'app_seed_005',
          first_name: 'Devansh',
          last_name: 'Mehta',
          dob: '2004-07-30',
          gender: 'Male',
          email: 'devansh.m@example.com',
          mobile: '9988776655',
          address: '24 Civil Lines',
          city: 'Roorkee',
          state: 'Uttarakhand',
          pin_code: '247667',
          highest_qualification: 'Class 12th (PCM)',
          institution_name: 'DPS Roorkee',
          board_university: 'CBSE',
          percentage_cgpa: '88.0%',
          year_of_passing: '2024',
          selected_program: 'Mechanical Engineering',
          selected_branch: 'Robotics & Automation',
          session_year: '2024-2025',
          category: 'General',
          status: 'Reviewed',
          created_at: new Date(Date.now() - 1 * 86400000)
        }
      ];

      for (const s of samples) {
        await pgClient.query(`
          INSERT INTO applications (
            id, first_name, last_name, dob, gender, email, mobile,
            address, city, state, pin_code,
            highest_qualification, institution_name, board_university, percentage_cgpa,
            year_of_passing, selected_program, selected_branch, session_year, category,
            status, student_id, admission_number, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11,
            $12, $13, $14, $15,
            $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25
          ) ON CONFLICT (id) DO NOTHING;
        `, [
          s.id, s.first_name, s.last_name, s.dob, s.gender, s.email, s.mobile,
          s.address, s.city, s.state, s.pin_code,
          s.highest_qualification, s.institution_name, s.board_university, s.percentage_cgpa,
          s.year_of_passing, s.selected_program, s.selected_branch, s.session_year, s.category,
          s.status, s.student_id || null, s.admission_number || null, s.created_at, new Date()
        ]);
      }
      console.log('✅ Seeded 5 sample applications into PostgreSQL.');
    }

  } catch (err) {
    console.error('❌ Migration Error:', err);
  } finally {
    pgClient.release();
    await pool.end();
    await mongoose.disconnect();
    console.log('🎉 Finished Admissions PostgreSQL setup.');
  }
}

run();
