const mongoose = require('mongoose');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log("=== SYNCING REAL STUDENTS & FEES FROM MONGO DB TO POSTGRESQL ===");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  // Fetch courses from PG to get tuition fees
  const coursesRes = await pool.query("SELECT id, name, code, tuition_fee, semester_fees FROM courses");
  const courseMap = new Map();
  coursesRes.rows.forEach(c => {
    let base = Number(c.tuition_fee) || 0;
    courseMap.set(c.id, {
      name: c.name,
      code: c.code,
      tuitionFee: base
    });
  });

  // Fetch transactions from PG to get exact paid totals per student
  const txnsRes = await pool.query("SELECT student_id, COALESCE(SUM(amount), 0) as paid_sum FROM fee_transactions WHERE status = 'Completed' GROUP BY student_id");
  const txnPaidMap = new Map();
  txnsRes.rows.forEach(t => {
    txnPaidMap.set(t.student_id, Number(t.paid_sum) || 0);
  });

  // Fetch all Mongo students
  const mongoStudents = await mongoose.connection.db.collection('students').find({}).toArray();
  console.log(`Found ${mongoStudents.length} students in MongoDB.`);

  let updatedCount = 0;
  for (const ms of mongoStudents) {
    const sId = ms._id.toString();
    const courseId = ms.selectedProgram ? (ms.selectedProgram._id ? ms.selectedProgram._id.toString() : ms.selectedProgram.toString()) : null;
    const branchId = ms.selectedBranch ? (ms.selectedBranch._id ? ms.selectedBranch._id.toString() : ms.selectedBranch.toString()) : null;
    const courseInfo = courseId ? courseMap.get(courseId) : null;

    let feesObj = ms.fees || { isConfigured: false, years: [] };
    let totalFee = 0;
    let paidFromConfig = 0;

    if (feesObj.isConfigured && Array.isArray(feesObj.years) && feesObj.years.length > 0) {
      feesObj.years.forEach(y => {
        let yrGross = 0;
        let yrPaid = 0;
        if (y.components && y.components.length > 0) {
          y.components.forEach(c => {
            yrGross += Number(c.amount) || 0;
            yrPaid += Number(c.paid) || 0;
          });
        } else {
          yrGross += (Number(y.tuition?.total) || 0) + (Number(y.exam?.total) || 0) + (Number(y.transport?.total) || 0) + (Number(y.other?.total) || 0);
          yrPaid += (Number(y.tuition?.paid) || 0) + (Number(y.exam?.paid) || 0) + (Number(y.transport?.paid) || 0) + (Number(y.other?.paid) || 0);
        }
        const yrDisc = Number(y.discount) || 0;
        totalFee += Math.max(0, yrGross - yrDisc);
        paidFromConfig += yrPaid;
      });
    }

    if (totalFee === 0 && courseInfo && courseInfo.tuitionFee > 0) {
      totalFee = courseInfo.tuitionFee;
    }

    // Actual paid amount from fee transactions or config
    const txnPaid = txnPaidMap.get(sId) || 0;
    const finalPaid = Math.max(txnPaid, paidFromConfig);
    const feeBalance = Math.max(0, totalFee - finalPaid);
    let feeStatus = 'unpaid';
    if (totalFee > 0) {
      if (finalPaid >= totalFee) feeStatus = 'paid';
      else if (finalPaid > 0) feeStatus = 'partial';
      else feeStatus = 'unpaid';
    }

    // UPDATE in PostgreSQL
    const updateRes = await pool.query(`
      UPDATE students SET
        first_name = $2,
        middle_name = $3,
        last_name = $4,
        enrollment_number = $5,
        admission_number = $6,
        student_id = $7,
        email = $8,
        mobile = $9,
        selected_branch = $10,
        selected_program = $11,
        course_year = $12,
        selected_semester = $13,
        fees = $14,
        total_fee = $15,
        paid_fee = $16,
        fee_balance = $17,
        fee_status = $18,
        student_status = $19,
        applicant_photo = $20,
        updated_at = NOW()
      WHERE id = $1
    `, [
      sId,
      ms.firstName || 'Student',
      ms.middleName || '',
      ms.lastName || '',
      ms.enrollmentNumber || ms.admissionNumber || '',
      ms.admissionNumber || '',
      ms.studentId || ms.admissionNumber || '',
      ms.email || '',
      ms.mobile || '',
      branchId,
      courseId,
      Number(ms.courseYear) || 1,
      Number(ms.selectedSemester) || 1,
      JSON.stringify(feesObj),
      totalFee,
      finalPaid,
      feeBalance,
      feeStatus,
      ms.studentStatus || 'Active',
      ms.applicantPhoto || ''
    ]);

    if (updateRes.rowCount > 0) {
      updatedCount++;
    }
  }

  console.log(`Successfully synced and updated ${updatedCount} students in PostgreSQL!`);

  // Print summary of PG students
  const statsRes = await pool.query(`
    SELECT 
      COUNT(*) as total_students,
      COUNT(CASE WHEN fee_status = 'paid' THEN 1 END) as paid_count,
      COUNT(CASE WHEN fee_status = 'partial' THEN 1 END) as partial_count,
      COUNT(CASE WHEN fee_status = 'unpaid' THEN 1 END) as unpaid_count,
      COALESCE(SUM(total_fee), 0) as total_receivable,
      COALESCE(SUM(paid_fee), 0) as total_collected,
      COALESCE(SUM(fee_balance), 0) as total_due
    FROM students
    WHERE student_status = 'Active'
  `);
  console.log("=== POSTGRESQL REAL FINANCIAL METRICS ===", statsRes.rows[0]);

  await mongoose.disconnect();
  await pool.end();
}

run().catch(console.error);
