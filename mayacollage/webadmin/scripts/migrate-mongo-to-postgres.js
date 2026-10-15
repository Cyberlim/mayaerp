/**
 * Comprehensive MongoDB to PostgreSQL Migration and Seeding Script
 * Scans full students, courses, branches, and fee structures from MongoDB
 * and seeds them into Neon PostgreSQL.
 */

const mongoose = require('mongoose');
const { Pool } = require('pg');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://thestudentzilla_db_user:NL2wc3tgnB6EzpPl@mayacollage.ktxtgpi.mongodb.net/';
const PG_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_pADeFi9rGlU2@ep-royal-field-b4fsklle-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: PG_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  console.log('🚀 Starting MongoDB to PostgreSQL Migration & Seeding...\n');

  // 1. Connect to PostgreSQL
  const pgClient = await pool.connect();
  console.log('✅ Connected to Neon PostgreSQL');

  // 2. Connect to MongoDB
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');
  const mongoDb = mongoose.connection.db;

  try {
    // 3. Create Tables in PostgreSQL
    console.log('📦 Creating PostgreSQL schema (branches, courses, students)...');

    await pgClient.query(`
      -- Branches Table
      CREATE TABLE IF NOT EXISTS branches (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        dean_name VARCHAR(255),
        contact_email VARCHAR(255),
        contact_ext VARCHAR(100),
        icon_name VARCHAR(100) DEFAULT 'business_center_rounded',
        color_hex VARCHAR(50) DEFAULT '#4F46E5',
        location VARCHAR(255),
        established_year VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Courses Table
      CREATE TABLE IF NOT EXISTS courses (
        id VARCHAR(64) PRIMARY KEY,
        branch_id VARCHAR(64) REFERENCES branches(id) ON DELETE SET NULL,
        code VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        duration INT NOT NULL DEFAULT 4,
        intake_capacity INT DEFAULT 60,
        coordinator VARCHAR(255),
        tuition_fee NUMERIC(12, 2) DEFAULT 0,
        lab_index VARCHAR(100),
        total_semesters INT DEFAULT 8,
        semester_fees JSONB DEFAULT '[]'::jsonb,
        curriculum JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Students Table
      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(64) PRIMARY KEY,
        enrollment_number VARCHAR(100),
        admission_number VARCHAR(100),
        student_id VARCHAR(100),
        password TEXT NOT NULL,
        library_pin VARCHAR(50),
        application_id VARCHAR(64),
        applicant_photo TEXT,
        
        -- Personal Info
        first_name VARCHAR(150) NOT NULL,
        middle_name VARCHAR(150),
        last_name VARCHAR(150) NOT NULL,
        dob VARCHAR(50),
        gender VARCHAR(20),
        email VARCHAR(255),
        mobile VARCHAR(50),
        parent_mobile VARCHAR(50),
        alternate_mobile VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pin_code VARCHAR(50),
        aadhar_number VARCHAR(50),
        religion VARCHAR(50),
        entry_type VARCHAR(50) DEFAULT 'Direct',
        
        -- Academic & Program Info
        selected_branch VARCHAR(64) REFERENCES branches(id) ON DELETE SET NULL,
        branch_code VARCHAR(100),
        branch_name VARCHAR(255),
        selected_program VARCHAR(64) REFERENCES courses(id) ON DELETE SET NULL,
        course_code VARCHAR(100),
        course_name VARCHAR(255),
        course_duration INT DEFAULT 4,
        selected_semester INT DEFAULT 1,
        selected_section VARCHAR(50),
        session_year VARCHAR(50),
        admission_year VARCHAR(50),
        batch VARCHAR(50),
        course_year INT DEFAULT 1,
        
        -- Complete Fee Data & Aggregate Metrics
        fees JSONB DEFAULT '{"isConfigured": false, "years": []}'::jsonb,
        total_fee NUMERIC(12, 2) DEFAULT 0,
        paid_fee NUMERIC(12, 2) DEFAULT 0,
        fee_balance NUMERIC(12, 2) DEFAULT 0,
        fee_status VARCHAR(50) DEFAULT 'unpaid',
        
        -- Fee Categories Breakdown
        tuition_fee NUMERIC(12, 2) DEFAULT 0,
        tuition_paid NUMERIC(12, 2) DEFAULT 0,
        exam_fee NUMERIC(12, 2) DEFAULT 0,
        exam_paid NUMERIC(12, 2) DEFAULT 0,
        transport_fee NUMERIC(12, 2) DEFAULT 0,
        transport_paid NUMERIC(12, 2) DEFAULT 0,
        other_fee NUMERIC(12, 2) DEFAULT 0,
        other_paid NUMERIC(12, 2) DEFAULT 0,
        
        -- Documents
        documents JSONB DEFAULT '{}'::jsonb,
        documents_last_updated TIMESTAMPTZ,
        
        -- Status
        status VARCHAR(50) DEFAULT 'Approved',
        student_status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Helpful Indexes for high-performance searches
      CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
      CREATE INDEX IF NOT EXISTS idx_students_admission_num ON students(admission_number);
      CREATE INDEX IF NOT EXISTS idx_students_enrollment_num ON students(enrollment_number);
      CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
      CREATE INDEX IF NOT EXISTS idx_students_program ON students(selected_program);
      CREATE INDEX IF NOT EXISTS idx_students_branch ON students(selected_branch);
      CREATE INDEX IF NOT EXISTS idx_students_fee_status ON students(fee_status);
      CREATE INDEX IF NOT EXISTS idx_students_student_status ON students(student_status);
      CREATE INDEX IF NOT EXISTS idx_students_names ON students(first_name, last_name);
      CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batch);
      CREATE INDEX IF NOT EXISTS idx_students_course_year ON students(course_year);
    `);
    console.log('✅ PostgreSQL Schema and Indexes created successfully.\n');

    // 4. Fetch and Seed Branches from MongoDB
    console.log('📥 Scanning Branches from MongoDB...');
    const mongoBranches = await mongoDb.collection('branches').find().toArray();
    console.log(`Found ${mongoBranches.length} branches in MongoDB.`);

    const branchMap = new Map();
    for (const b of mongoBranches) {
      const bId = b._id.toString();
      branchMap.set(bId, b);

      await pgClient.query(`
        INSERT INTO branches (
          id, code, name, dean_name, contact_email, contact_ext, icon_name, color_hex, location, established_year, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          code = EXCLUDED.code,
          name = EXCLUDED.name,
          dean_name = EXCLUDED.dean_name,
          contact_email = EXCLUDED.contact_email,
          contact_ext = EXCLUDED.contact_ext,
          icon_name = EXCLUDED.icon_name,
          color_hex = EXCLUDED.color_hex,
          location = EXCLUDED.location,
          established_year = EXCLUDED.established_year,
          updated_at = NOW();
      `, [
        bId,
        b.code || '',
        b.name || '',
        b.deanName || '',
        b.contactEmail || '',
        b.contactExt || '',
        b.iconName || 'business_center_rounded',
        b.colorHex || '#4F46E5',
        b.location || '',
        b.establishedYear || '',
        b.createdAt ? new Date(b.createdAt) : new Date(),
        b.updatedAt ? new Date(b.updatedAt) : new Date()
      ]);
    }
    console.log(`✅ Seeded ${mongoBranches.length} branches into PostgreSQL.\n`);

    // 5. Fetch and Seed Courses from MongoDB
    console.log('📥 Scanning Courses from MongoDB...');
    const mongoCourses = await mongoDb.collection('courses').find().toArray();
    console.log(`Found ${mongoCourses.length} courses in MongoDB.`);

    const courseMap = new Map();
    for (const c of mongoCourses) {
      const cId = c._id.toString();
      courseMap.set(cId, c);

      await pgClient.query(`
        INSERT INTO courses (
          id, branch_id, code, name, duration, intake_capacity, coordinator, tuition_fee, lab_index, total_semesters, semester_fees, curriculum, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          branch_id = EXCLUDED.branch_id,
          code = EXCLUDED.code,
          name = EXCLUDED.name,
          duration = EXCLUDED.duration,
          intake_capacity = EXCLUDED.intake_capacity,
          coordinator = EXCLUDED.coordinator,
          tuition_fee = EXCLUDED.tuition_fee,
          lab_index = EXCLUDED.lab_index,
          total_semesters = EXCLUDED.total_semesters,
          semester_fees = EXCLUDED.semester_fees,
          curriculum = EXCLUDED.curriculum,
          updated_at = NOW();
      `, [
        cId,
        c.branchId ? c.branchId.toString() : null,
        c.code || '',
        c.name || '',
        Number(c.duration) || 4,
        Number(c.intakeCapacity) || 60,
        c.coordinator || '',
        Number(c.tuitionFee) || 0,
        c.labIndex || '',
        Number(c.totalSemesters) || 8,
        JSON.stringify(c.semesterFees || []),
        JSON.stringify(c.curriculum || []),
        c.createdAt ? new Date(c.createdAt) : new Date(),
        c.updatedAt ? new Date(c.updatedAt) : new Date()
      ]);
    }
    console.log(`✅ Seeded ${mongoCourses.length} courses into PostgreSQL.\n`);

    // 6. Fetch and Seed ALL Students from MongoDB
    console.log('📥 Scanning full Students data from MongoDB...');
    const mongoStudents = await mongoDb.collection('students').find().toArray();
    console.log(`Found ${mongoStudents.length} students in MongoDB. Processing records & fee calculations...`);

    let insertedCount = 0;
    for (const s of mongoStudents) {
      const sId = s._id.toString();
      const branchId = s.selectedBranch ? s.selectedBranch.toString() : null;
      const courseId = s.selectedProgram ? s.selectedProgram.toString() : null;

      const branchObj = branchId ? branchMap.get(branchId) : null;
      const courseObj = courseId ? courseMap.get(courseId) : null;

      const branchCode = branchObj ? branchObj.code : (s.branchCode || null);
      const branchName = branchObj ? branchObj.name : (s.branchName || null);
      const courseCode = courseObj ? courseObj.code : (s.courseCode || null);
      const courseName = courseObj ? courseObj.name : (s.courseName || null);
      const courseDuration = courseObj ? Number(courseObj.duration) || 4 : (s.courseDuration || 4);

      // Calculate fee breakdown and totals
      let totalFee = 0;
      let paidFee = 0;
      let tuitionFee = 0;
      let tuitionPaid = 0;
      let examFee = 0;
      let examPaid = 0;
      let transportFee = 0;
      let transportPaid = 0;
      let otherFee = 0;
      let otherPaid = 0;

      const feesObj = s.fees || { isConfigured: false, years: [] };

      if (Array.isArray(feesObj.years) && feesObj.years.length > 0) {
        for (const yr of feesObj.years) {
          const tTot = Number(yr.tuition?.total) || 0;
          const tPd = Number(yr.tuition?.paid) || 0;
          const eTot = Number(yr.exam?.total) || 0;
          const ePd = Number(yr.exam?.paid) || 0;
          const trTot = Number(yr.transport?.total) || 0;
          const trPd = Number(yr.transport?.paid) || 0;
          const oTot = Number(yr.other?.total) || 0;
          const oPd = Number(yr.other?.paid) || 0;

          tuitionFee += tTot;
          tuitionPaid += tPd;
          examFee += eTot;
          examPaid += ePd;
          transportFee += trTot;
          transportPaid += trPd;
          otherFee += oTot;
          otherPaid += oPd;

          totalFee += (tTot + eTot + trTot + oTot);
          paidFee += (tPd + ePd + trPd + oPd);

          // If components exist and total was 0, sum components
          if (Array.isArray(yr.components) && yr.components.length > 0) {
            for (const comp of yr.components) {
              const compAmt = Number(comp.amount) || 0;
              const compPd = Number(comp.paid) || 0;
              if (tTot === 0 && eTot === 0 && trTot === 0 && oTot === 0) {
                totalFee += compAmt;
                paidFee += compPd;
                tuitionFee += compAmt;
                tuitionPaid += compPd;
              }
            }
          }
        }
      }

      // Course fee fallback if student fee was never configured or 0
      const courseBaseFee = Number(courseObj?.tuitionFee) || 0;
      if (totalFee === 0 && courseBaseFee > 0) {
        totalFee = courseBaseFee;
        tuitionFee = courseBaseFee;
      }

      const feeBalance = Math.max(0, totalFee - paidFee);
      let feeStatus = 'unpaid';
      if (totalFee > 0) {
        if (paidFee >= totalFee) {
          feeStatus = 'paid';
        } else if (paidFee > 0) {
          feeStatus = 'partial';
        } else {
          feeStatus = 'unpaid';
        }
      }

      await pgClient.query(`
        INSERT INTO students (
          id,
          enrollment_number,
          admission_number,
          student_id,
          password,
          library_pin,
          application_id,
          applicant_photo,
          first_name,
          middle_name,
          last_name,
          dob,
          gender,
          email,
          mobile,
          parent_mobile,
          alternate_mobile,
          address,
          city,
          state,
          pin_code,
          aadhar_number,
          religion,
          entry_type,
          selected_branch,
          branch_code,
          branch_name,
          selected_program,
          course_code,
          course_name,
          course_duration,
          selected_semester,
          selected_section,
          session_year,
          admission_year,
          batch,
          course_year,
          fees,
          total_fee,
          paid_fee,
          fee_balance,
          fee_status,
          tuition_fee,
          tuition_paid,
          exam_fee,
          exam_paid,
          transport_fee,
          transport_paid,
          other_fee,
          other_paid,
          documents,
          documents_last_updated,
          status,
          student_status,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
          $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
          $51, $52, $53, $54, $55, $56
        )
        ON CONFLICT (id) DO UPDATE SET
          enrollment_number = EXCLUDED.enrollment_number,
          admission_number = EXCLUDED.admission_number,
          student_id = EXCLUDED.student_id,
          password = EXCLUDED.password,
          library_pin = EXCLUDED.library_pin,
          application_id = EXCLUDED.application_id,
          applicant_photo = EXCLUDED.applicant_photo,
          first_name = EXCLUDED.first_name,
          middle_name = EXCLUDED.middle_name,
          last_name = EXCLUDED.last_name,
          dob = EXCLUDED.dob,
          gender = EXCLUDED.gender,
          email = EXCLUDED.email,
          mobile = EXCLUDED.mobile,
          parent_mobile = EXCLUDED.parent_mobile,
          alternate_mobile = EXCLUDED.alternate_mobile,
          address = EXCLUDED.address,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          pin_code = EXCLUDED.pin_code,
          aadhar_number = EXCLUDED.aadhar_number,
          religion = EXCLUDED.religion,
          entry_type = EXCLUDED.entry_type,
          selected_branch = EXCLUDED.selected_branch,
          branch_code = EXCLUDED.branch_code,
          branch_name = EXCLUDED.branch_name,
          selected_program = EXCLUDED.selected_program,
          course_code = EXCLUDED.course_code,
          course_name = EXCLUDED.course_name,
          course_duration = EXCLUDED.course_duration,
          selected_semester = EXCLUDED.selected_semester,
          selected_section = EXCLUDED.selected_section,
          session_year = EXCLUDED.session_year,
          admission_year = EXCLUDED.admission_year,
          batch = EXCLUDED.batch,
          course_year = EXCLUDED.course_year,
          fees = EXCLUDED.fees,
          total_fee = EXCLUDED.total_fee,
          paid_fee = EXCLUDED.paid_fee,
          fee_balance = EXCLUDED.fee_balance,
          fee_status = EXCLUDED.fee_status,
          tuition_fee = EXCLUDED.tuition_fee,
          tuition_paid = EXCLUDED.tuition_paid,
          exam_fee = EXCLUDED.exam_fee,
          exam_paid = EXCLUDED.exam_paid,
          transport_fee = EXCLUDED.transport_fee,
          transport_paid = EXCLUDED.transport_paid,
          other_fee = EXCLUDED.other_fee,
          other_paid = EXCLUDED.other_paid,
          documents = EXCLUDED.documents,
          documents_last_updated = EXCLUDED.documents_last_updated,
          status = EXCLUDED.status,
          student_status = EXCLUDED.student_status,
          updated_at = NOW();
      `, [
        sId,
        s.enrollmentNumber || null,
        s.admissionNumber || null,
        s.studentId || null,
        s.password || 'default_hashed_pwd',
        s.libraryPin || null,
        s.applicationId ? s.applicationId.toString() : null,
        s.applicantPhoto || null,
        s.firstName || '',
        s.middleName || null,
        s.lastName || '',
        s.dob || null,
        s.gender || 'Male',
        s.email || null,
        s.mobile || '',
        s.parentMobile || null,
        s.alternateMobile || null,
        s.address || null,
        s.city || null,
        s.state || null,
        s.pinCode || null,
        s.aadharNumber || null,
        s.religion || null,
        s.entryType || 'Direct',
        branchId,
        branchCode,
        branchName,
        courseId,
        courseCode,
        courseName,
        courseDuration,
        Number(s.selectedSemester) || 1,
        s.selectedSection || null,
        s.sessionYear || null,
        s.admissionYear || null,
        s.batch || null,
        Number(s.courseYear) || 1,
        JSON.stringify(feesObj),
        totalFee,
        paidFee,
        feeBalance,
        feeStatus,
        tuitionFee,
        tuitionPaid,
        examFee,
        examPaid,
        transportFee,
        transportPaid,
        otherFee,
        otherPaid,
        JSON.stringify(s.documents || {}),
        s.documentsLastUpdated ? new Date(s.documentsLastUpdated) : null,
        s.status || 'Approved',
        s.studentStatus || 'Active',
        s.createdAt ? new Date(s.createdAt) : new Date(),
        s.updatedAt ? new Date(s.updatedAt) : new Date()
      ]);

      insertedCount++;
      if (insertedCount % 50 === 0 || insertedCount === mongoStudents.length) {
        console.log(`Progress: ${insertedCount}/${mongoStudents.length} students migrated.`);
      }
    }

    // 7. Verification in PostgreSQL
    console.log('\n📊 Verifying PostgreSQL database content...');
    const pgBranchCount = await pgClient.query('SELECT COUNT(*) FROM branches');
    const pgCourseCount = await pgClient.query('SELECT COUNT(*) FROM courses');
    const pgStudentCount = await pgClient.query('SELECT COUNT(*) FROM students');
    const feeStatusStats = await pgClient.query('SELECT fee_status, COUNT(*), SUM(total_fee) as assessed, SUM(paid_fee) as collected FROM students GROUP BY fee_status');

    console.log(`\n🎉 MIGRATION COMPLETE!`);
    console.log(`- Branches in PG: ${pgBranchCount.rows[0].count}`);
    console.log(`- Courses in PG: ${pgCourseCount.rows[0].count}`);
    console.log(`- Students in PG: ${pgStudentCount.rows[0].count}`);
    console.log('\nFee Status Breakdown in PostgreSQL:');
    console.table(feeStatusStats.rows);

    const sample = await pgClient.query('SELECT id, student_id, first_name, last_name, branch_code, course_code, total_fee, paid_fee, fee_status FROM students LIMIT 3');
    console.log('Sample Seeded Student Records in PostgreSQL:');
    console.table(sample.rows);

  } catch (err) {
    console.error('❌ Migration Error:', err);
    throw err;
  } finally {
    pgClient.release();
    await pool.end();
    await mongoose.disconnect();
    console.log('\nDisconnected from databases.');
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
