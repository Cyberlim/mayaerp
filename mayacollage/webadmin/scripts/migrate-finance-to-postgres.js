/**
 * Migration & Seeding script: MongoDB Fee Categories, Fee Transactions, Fee Alerts, Payouts -> Neon PostgreSQL
 */
const mongoose = require('mongoose');
const { Pool } = require('pg');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://thestudentzilla_db_user:NL2wc3tgnB6EzpPl@mayacollage.ktxtgpi.mongodb.net/';
const PG_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_pADeFi9rGlU2@ep-royal-field-b4fsklle-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: PG_URL,
  ssl: { rejectUnauthorized: false }
});

const DEFAULT_CATEGORIES = [
  { id: 'cat_tuition', name: 'Tuition Fee', code: 'tuition', type: 'Academic', default_amount: 45000, frequency: 'Semester-wise', is_mandatory: true, description: 'Core academic and lecture fee' },
  { id: 'cat_exam', name: 'Exam Fee', code: 'exam', type: 'Academic', default_amount: 2500, frequency: 'Semester-wise', is_mandatory: true, description: 'Semester end assessment and examination fee' },
  { id: 'cat_book', name: 'Books & Course Material', code: 'book', type: 'Kit/Uniform', default_amount: 3500, frequency: 'Yearly', is_mandatory: false, description: 'Prescribed syllabus textbooks & study kits' },
  { id: 'cat_blazer', name: 'College Blazer', code: 'blazer', type: 'Kit/Uniform', default_amount: 2800, frequency: 'One-Time', is_mandatory: false, description: 'Official institution blazer with emblem' },
  { id: 'cat_uniform', name: 'College Uniform (Pair)', code: 'uniform', type: 'Kit/Uniform', default_amount: 2200, frequency: 'One-Time', is_mandatory: true, description: 'Official daily college uniform set' },
  { id: 'cat_tshirt', name: 'College T-Shirt', code: 'tshirt', type: 'Kit/Uniform', default_amount: 650, frequency: 'One-Time', is_mandatory: false, description: 'Departmental and sports event t-shirt' },
  { id: 'cat_bag', name: 'College Bag / Backpack', code: 'bag', type: 'Kit/Uniform', default_amount: 850, frequency: 'One-Time', is_mandatory: false, description: 'Heavy-duty branded college backpack' },
  { id: 'cat_labcoat', name: 'Lab Coat & Apron', code: 'labcoat', type: 'Facility/Lab', default_amount: 750, frequency: 'One-Time', is_mandatory: false, description: 'Protective lab coat for chemistry/physics/pharmacy labs' },
  { id: 'cat_lab_fee', name: 'Lab Facility & Consumables', code: 'lab_fee', type: 'Facility/Lab', default_amount: 4000, frequency: 'Semester-wise', is_mandatory: false, description: 'Laboratory equipment, computers & consumable charges' },
  { id: 'cat_fine', name: 'Disciplinary / Library Fine', code: 'fine', type: 'Fine/Penalty', default_amount: 500, frequency: 'As Applicable', is_mandatory: false, description: 'Penalties for overdue books, attendance or disciplinary actions' },
  { id: 'cat_late_fee', name: 'Late Fee / Surcharge', code: 'late_fee', type: 'Fine/Penalty', default_amount: 1000, frequency: 'As Applicable', is_mandatory: false, description: 'Late fee penalty on overdue installment dates' },
  { id: 'cat_transport', name: 'Transport / Bus Fee', code: 'transport', type: 'Facility/Lab', default_amount: 12000, frequency: 'Yearly', is_mandatory: false, description: 'Campus bus route commutation fee' },
  { id: 'cat_other', name: 'Miscellaneous / Other', code: 'other', type: 'Other', default_amount: 1000, frequency: 'As Applicable', is_mandatory: false, description: 'Miscellaneous university activities and events' },
];

async function run() {
  console.log('🚀 Connecting to Neon PostgreSQL and MongoDB...');
  const pg = await pool.connect();
  await mongoose.connect(MONGO_URI);
  const mongo = mongoose.connection.db;

  try {
    console.log('📦 Creating PostgreSQL finance tables...');
    await pg.query(`
      CREATE TABLE IF NOT EXISTS fee_categories (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100) UNIQUE NOT NULL,
        type VARCHAR(50) DEFAULT 'Kit/Uniform',
        default_amount NUMERIC(12, 2) DEFAULT 0,
        frequency VARCHAR(50) DEFAULT 'One-Time',
        is_mandatory BOOLEAN DEFAULT false,
        description TEXT,
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS fee_transactions (
        id VARCHAR(64) PRIMARY KEY,
        student_id VARCHAR(64),
        course_id VARCHAR(64),
        receipt_number VARCHAR(100),
        amount NUMERIC(12, 2) NOT NULL,
        category VARCHAR(100) DEFAULT 'tuition',
        category_name VARCHAR(255) DEFAULT 'Tuition Fee',
        breakup JSONB DEFAULT '[]'::jsonb,
        payment_date TIMESTAMPTZ DEFAULT NOW(),
        payment_method VARCHAR(50) DEFAULT 'Cash',
        transaction_id VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'Completed',
        semester INT DEFAULT 1,
        academic_year VARCHAR(50) DEFAULT 'Year 1',
        notes TEXT,
        collected_by VARCHAR(150) DEFAULT 'Admin Finance',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_fee_txns_student ON fee_transactions(student_id);
      CREATE INDEX IF NOT EXISTS idx_fee_txns_date ON fee_transactions(payment_date DESC);
      CREATE INDEX IF NOT EXISTS idx_fee_txns_rcpt ON fee_transactions(receipt_number);

      CREATE TABLE IF NOT EXISTS payouts (
        id VARCHAR(64) PRIMARY KEY,
        payee_id VARCHAR(64),
        payee_name VARCHAR(255) NOT NULL,
        receipt_number VARCHAR(100),
        designation VARCHAR(100) DEFAULT 'Faculty / Staff',
        department VARCHAR(100) DEFAULT 'Academics',
        payout_type VARCHAR(50) DEFAULT 'Salary',
        amount NUMERIC(12, 2) NOT NULL,
        payment_date TIMESTAMPTZ DEFAULT NOW(),
        payment_method VARCHAR(50) DEFAULT 'Bank Transfer',
        transaction_id VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'Completed',
        month_year VARCHAR(50),
        notes TEXT,
        disbursed_by VARCHAR(150) DEFAULT 'Admin Finance',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS fee_alerts (
        id VARCHAR(64) PRIMARY KEY,
        student_id VARCHAR(64),
        alert_type VARCHAR(100) DEFAULT 'Outstanding_Dues',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        outstanding_amount NUMERIC(12, 2) DEFAULT 0,
        channel VARCHAR(50) DEFAULT 'In-App',
        status VARCHAR(50) DEFAULT 'Active',
        sent_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Tables created or verified.');

    // 1. Fee Categories
    const mongoCategories = await mongo.collection('feecategories').find({}).toArray();
    console.log(`Found ${mongoCategories.length} categories in MongoDB.`);
    const catsToInsert = mongoCategories.length > 0 ? mongoCategories : DEFAULT_CATEGORIES;

    for (const c of catsToInsert) {
      const id = (c._id ? c._id.toString() : c.id) || `cat_${c.code}`;
      const code = (c.code || c.name.toLowerCase().replace(/[^a-z0-9]/g, '_')).trim();
      await pg.query(`
        INSERT INTO fee_categories (id, name, code, type, default_amount, frequency, is_mandatory, description, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          default_amount = EXCLUDED.default_amount,
          frequency = EXCLUDED.frequency,
          description = EXCLUDED.description,
          updated_at = NOW()
      `, [
        id,
        c.name || 'Fee Category',
        code,
        c.type || 'Kit/Uniform',
        Number(c.defaultAmount || c.default_amount) || 0,
        c.frequency || 'One-Time',
        Boolean(c.isMandatory || c.is_mandatory),
        c.description || '',
        c.status || 'Active',
        c.createdAt || new Date(),
        c.updatedAt || new Date()
      ]);
    }
    console.log('✅ Fee categories seeded/migrated.');

    // 2. Fee Transactions
    const mongoTxns = await mongo.collection('feetransactions').find({}).toArray();
    console.log(`Found ${mongoTxns.length} transactions in MongoDB.`);
    let txnCount = 0;
    for (const t of mongoTxns) {
      const id = t._id.toString();
      const studentId = t.studentId ? t.studentId.toString() : null;
      const courseId = t.courseId ? t.courseId.toString() : null;
      const txnId = t.transactionId || `TXN-${id}`;
      const rcpt = t.receiptNumber || null;

      await pg.query(`
        INSERT INTO fee_transactions (
          id, student_id, course_id, receipt_number, amount, category, category_name,
          breakup, payment_date, payment_method, transaction_id, status, semester,
          academic_year, notes, collected_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (transaction_id) DO UPDATE SET
          amount = EXCLUDED.amount,
          payment_method = EXCLUDED.payment_method,
          receipt_number = COALESCE(EXCLUDED.receipt_number, fee_transactions.receipt_number),
          notes = EXCLUDED.notes,
          updated_at = NOW()
      `, [
        id,
        studentId,
        courseId,
        rcpt,
        Number(t.amount) || 0,
        t.category || 'tuition',
        t.categoryName || 'Tuition Fee',
        JSON.stringify(t.breakup || []),
        t.paymentDate || t.createdAt || new Date(),
        t.paymentMethod || 'Cash',
        txnId,
        t.status || 'Completed',
        Number(t.semester) || 1,
        t.academicYear || 'Year 1',
        t.notes || '',
        t.collectedBy || 'Admin Finance',
        t.createdAt || new Date(),
        t.updatedAt || new Date()
      ]);
      txnCount++;
    }
    console.log(`✅ Migrated ${txnCount} fee transactions to PostgreSQL.`);

    // 3. Payouts
    const mongoPayouts = await mongo.collection('payouts').find({}).toArray();
    console.log(`Found ${mongoPayouts.length} payouts in MongoDB.`);
    let payoutCount = 0;
    for (const p of mongoPayouts) {
      const id = p._id.toString();
      const payeeId = p.payeeId ? p.payeeId.toString() : null;
      const txnId = p.transactionId || `PAY-${id}`;

      await pg.query(`
        INSERT INTO payouts (
          id, payee_id, payee_name, receipt_number, designation, department,
          payout_type, amount, payment_date, payment_method, transaction_id,
          status, month_year, notes, disbursed_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (transaction_id) DO UPDATE SET
          amount = EXCLUDED.amount,
          status = EXCLUDED.status,
          updated_at = NOW()
      `, [
        id,
        payeeId,
        p.payeeName || 'Staff Member',
        p.receiptNumber || null,
        p.designation || 'Faculty / Staff',
        p.department || 'Academics',
        p.payoutType || 'Salary',
        Number(p.amount) || 0,
        p.paymentDate || p.createdAt || new Date(),
        p.paymentMethod || 'Bank Transfer',
        txnId,
        p.status || 'Completed',
        p.monthYear || null,
        p.notes || '',
        p.disbursedBy || 'Admin Finance',
        p.createdAt || new Date(),
        p.updatedAt || new Date()
      ]);
      payoutCount++;
    }
    console.log(`✅ Migrated ${payoutCount} payouts to PostgreSQL.`);

    // 4. Fee Alerts
    const mongoAlerts = await mongo.collection('feealerts').find({}).toArray();
    console.log(`Found ${mongoAlerts.length} fee alerts in MongoDB.`);
    let alertCount = 0;
    for (const a of mongoAlerts) {
      const id = a._id.toString();
      const studentId = a.studentId ? a.studentId.toString() : null;
      await pg.query(`
        INSERT INTO fee_alerts (
          id, student_id, alert_type, title, message, outstanding_amount,
          channel, status, sent_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `, [
        id,
        studentId,
        a.alertType || 'Outstanding_Dues',
        a.title || 'Fee Due Payment Reminder',
        a.message || '',
        Number(a.outstandingAmount) || 0,
        a.channel || 'In-App',
        a.status || 'Active',
        a.sentAt || a.createdAt || new Date(),
        a.createdAt || new Date(),
        a.updatedAt || new Date()
      ]);
      alertCount++;
    }
    console.log(`✅ Migrated ${alertCount} fee alerts to PostgreSQL.`);

    // 5. Check row counts
    const countCats = await pg.query('SELECT COUNT(*) FROM fee_categories');
    const countTxns = await pg.query('SELECT COUNT(*) FROM fee_transactions');
    const countPays = await pg.query('SELECT COUNT(*) FROM payouts');
    const countAlrts = await pg.query('SELECT COUNT(*) FROM fee_alerts');

    console.log('\n📊 POSTGRESQL FINANCE COUNTS:');
    console.log(`  Categories:   ${countCats.rows[0].count}`);
    console.log(`  Transactions: ${countTxns.rows[0].count}`);
    console.log(`  Payouts:      ${countPays.rows[0].count}`);
    console.log(`  Alerts:       ${countAlrts.rows[0].count}`);

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    pg.release();
    await pool.end();
    await mongoose.disconnect();
    console.log('\n🏁 Done!');
  }
}

run();
