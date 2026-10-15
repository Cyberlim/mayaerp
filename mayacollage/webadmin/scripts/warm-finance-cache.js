const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_pADeFi9rGlU2@ep-royal-field-b4fsklle-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || "https://moved-vervet-41278.upstash.io";
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "AaE-AAIgcDE4MjRhZDE5M2JhMGE0NmJlOGNmZTMwNzJlMGY3MzFhYQ";

async function setRedis(key, data, ex = 1800) {
  try {
    const res = await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}?ex=${ex}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    console.log(`[Redis Warmed] ${key} ->`, json.result);
  } catch (e) {
    console.error(`[Redis Error] ${key}:`, e.message);
  }
}

async function warmCache() {
  console.log("=== WARMING FINANCE REDIS CACHE ===");
  const [
    branchesRes,
    coursesRes,
    studentsRes,
    txnsRes,
    payoutsRes,
    categoriesRes,
    alertsRes,
    txnSumRes,
    stuCountRes
  ] = await Promise.all([
    pool.query('SELECT * FROM branches ORDER BY created_at DESC'),
    pool.query(`
      SELECT c.*, b.name as branch_name, b.code as branch_code
      FROM courses c
      LEFT JOIN branches b ON c.branch_id = b.id
      ORDER BY c.created_at DESC
    `),
    pool.query("SELECT * FROM students WHERE student_status = 'Active' ORDER BY first_name ASC"),
    pool.query(`
      SELECT t.*, s.first_name as student_first_name, s.last_name as student_last_name,
             s.enrollment_number as student_enrollment_number, s.admission_number as student_admission_number,
             s.mobile as student_mobile, s.email as student_email, b.name as branch_name,
             c.name as course_name, c.code as course_code
      FROM fee_transactions t
      LEFT JOIN students s ON t.student_id = s.id
      LEFT JOIN branches b ON s.selected_branch = b.id
      LEFT JOIN courses c ON t.course_id = c.id
      ORDER BY t.payment_date DESC, t.created_at DESC
      LIMIT 250
    `),
    pool.query(`
      SELECT p.*
      FROM payouts p
      ORDER BY p.payment_date DESC, p.created_at DESC
      LIMIT 100
    `),
    pool.query('SELECT * FROM fee_categories ORDER BY is_mandatory DESC, name ASC'),
    pool.query('SELECT * FROM fee_alerts ORDER BY created_at DESC LIMIT 50'),
    pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM fee_transactions WHERE status = 'Completed'"),
    pool.query("SELECT COUNT(*) as count FROM students WHERE student_status = 'Active'")
  ]);

  const branches = branchesRes.rows.map(b => ({
    _id: b.id, id: b.id, code: b.code, name: b.name, deanName: b.dean_name,
    colorHex: b.color_hex || '#4F46E5'
  }));

  const courses = coursesRes.rows.map(c => ({
    _id: c.id, id: c.id, name: c.name, code: c.code, branchId: c.branch_id,
    branchName: c.branch_name, tuitionFee: Number(c.tuition_fee) || 0,
    semesterFees: typeof c.semester_fees === 'string' ? JSON.parse(c.semester_fees) : (c.semester_fees || [])
  }));

  const categories = categoriesRes.rows.map(c => ({
    _id: c.id, id: c.id, name: c.name, code: c.code, type: c.type,
    defaultAmount: Number(c.default_amount) || 0, frequency: c.frequency,
    isMandatory: Boolean(c.is_mandatory), description: c.description || ''
  }));

  const totalCollected = Number(txnSumRes.rows[0]?.total) || 0;
  const activeStudentCount = parseInt(stuCountRes.rows[0]?.count || "0", 10);

  const courseFeeMap = new Map();
  courses.forEach(c => courseFeeMap.set(c.id, c.tuitionFee));

  let totalReceivable = 0;
  studentsRes.rows.forEach(s => {
    let feesObj = typeof s.fees === 'string' ? JSON.parse(s.fees) : (s.fees || {});
    if (feesObj.isConfigured && Array.isArray(feesObj.years) && feesObj.years.length > 0) {
      let stuAssessed = 0;
      feesObj.years.forEach(y => {
        const yGross = (Number(y.tuition?.total) || 0) + (Number(y.exam?.total) || 0) + (Number(y.transport?.total) || 0) + (Number(y.other?.total) || 0);
        const yDisc = Number(y.discount) || 0;
        stuAssessed += Math.max(0, yGross - yDisc);
      });
      totalReceivable += stuAssessed;
    } else if (Number(s.total_fee) > 0) {
      totalReceivable += Number(s.total_fee);
    } else if (s.selected_program && courseFeeMap.has(s.selected_program)) {
      totalReceivable += courseFeeMap.get(s.selected_program) || 0;
    }
  });

  const stats = { totalCollected, totalReceivable, activeStudentCount };

  // Set individual keys
  await setRedis("fee:stats", stats, 1800);
  await setRedis("fee:categories", categories, 1800);
  await setRedis("master:branches", branches, 1800);
  await setRedis("master:courses:all", courses, 1800);

  // Set master bundle
  const bundle = {
    stats,
    transactions: txnsRes.rows,
    payouts: payoutsRes.rows,
    staffList: [],
    branches,
    courses,
    students: studentsRes.rows,
    categories,
    alertsData: {
      summary: { totalAlerts: alertsRes.rows.length },
      alerts: alertsRes.rows,
      defaulters: []
    },
    timestamp: Date.now()
  };
  await setRedis("fee:bundle:master", bundle, 1800);

  console.log("=== FINANCE REDIS CACHE FULLY PRIMED & READY ===");
  await pool.end();
}

warmCache().catch(console.error);
