import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { mapPgStudents } from "@/lib/studentMapper";
import { mapPgTransactions, mapPgPayouts } from "@/lib/financeMapper";
import { getCache, setCache, DEFAULT_CACHE_TTL } from "@/lib/redis";
import connectDB from "@/lib/mongodb";
import { User } from "@/models/User";

export const dynamic = 'force-dynamic';

export const FINANCE_BUNDLE_CACHE_KEY = "fee:bundle:master";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bust = searchParams.get("bust") === "true" || searchParams.get("refresh") === "true";

    // 1. Check Upstash Redis Cache (sub-20ms instant response)
    if (!bust) {
      const cachedBundle = await getCache(FINANCE_BUNDLE_CACHE_KEY);
      if (cachedBundle && typeof cachedBundle === 'object' && cachedBundle.stats) {
        return NextResponse.json(cachedBundle, {
          headers: {
            "X-Cache-Source": "Upstash-Redis",
            "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=600"
          }
        });
      }
    }

    // 2. Fetch all Neon PostgreSQL data in parallel
    const [
      branchesRes,
      coursesRes,
      studentsRes,
      txnsRes,
      payoutsRes,
      categoriesRes,
      alertsRes,
      txnSumRes,
      stuCountRes,
      cachedStaff
    ] = await Promise.all([
      pgQuery('SELECT * FROM branches ORDER BY created_at DESC'),
      pgQuery(`
        SELECT 
          c.*,
          b.name as branch_name,
          b.code as branch_code
        FROM courses c
        LEFT JOIN branches b ON c.branch_id = b.id
        ORDER BY c.created_at DESC
      `),
      pgQuery(`
        SELECT 
          s.*,
          b.name as branch_name,
          b.code as branch_code,
          c.name as course_name,
          c.code as course_code,
          c.duration as course_duration,
          c.tuition_fee as course_tuition_fee
        FROM students s
        LEFT JOIN branches b ON s.selected_branch = b.id
        LEFT JOIN courses c ON s.selected_program = c.id
        WHERE s.student_status = 'Active'
        ORDER BY s.first_name ASC
      `),
      pgQuery(`
        SELECT 
          t.*,
          s.first_name as student_first_name,
          s.middle_name as student_middle_name,
          s.last_name as student_last_name,
          s.student_id as student_code,
          s.enrollment_number as student_enrollment_number,
          s.admission_number as student_admission_number,
          s.mobile as student_mobile,
          s.email as student_email,
          s.applicant_photo as student_photo,
          b.name as branch_name,
          c.name as course_name,
          c.code as course_code
        FROM fee_transactions t
        LEFT JOIN students s ON t.student_id = s.id
        LEFT JOIN branches b ON s.selected_branch = b.id
        LEFT JOIN courses c ON t.course_id = c.id
        ORDER BY t.payment_date DESC, t.created_at DESC
        LIMIT 250
      `),
      pgQuery(`
        SELECT p.*
        FROM payouts p
        ORDER BY p.payment_date DESC, p.created_at DESC
        LIMIT 100
      `),
      pgQuery('SELECT * FROM fee_categories ORDER BY is_mandatory DESC, name ASC'),
      pgQuery('SELECT * FROM fee_alerts ORDER BY created_at DESC LIMIT 50'),
      pgQuery("SELECT COALESCE(SUM(amount), 0) as total FROM fee_transactions WHERE status = 'Completed'"),
      pgQuery("SELECT COUNT(*) as count FROM students WHERE student_status = 'Active'"),
      getCache("users:staff:list")
    ]);

    // Format Branches
    const branches = branchesRes.rows.map(b => ({
      _id: b.id,
      id: b.id,
      code: b.code,
      name: b.name,
      deanName: b.dean_name,
      contactEmail: b.contact_email,
      contactExt: b.contact_ext,
      iconName: b.icon_name || 'business_center_rounded',
      colorHex: b.color_hex || '#4F46E5',
      location: b.location,
      establishedYear: b.established_year,
      createdAt: b.created_at,
      updatedAt: b.updated_at
    }));

    // Format Courses
    const courses = coursesRes.rows.map(c => ({
      _id: c.id,
      id: c.id,
      name: c.name,
      code: c.code,
      branchId: c.branch_id,
      branchName: c.branch_name,
      branchCode: c.branch_code,
      duration: c.duration,
      tuitionFee: Number(c.tuition_fee) || 0,
      semesterFees: typeof c.semester_fees === 'string' ? JSON.parse(c.semester_fees) : (c.semester_fees || []),
      status: c.status,
      createdAt: c.created_at,
      updatedAt: c.updated_at
    }));

    // Format Students
    const students = mapPgStudents(studentsRes.rows);

    // Format Transactions
    const transactions = mapPgTransactions(txnsRes.rows);

    // Format Payouts
    const payouts = mapPgPayouts(payoutsRes.rows);

    // Format Categories
    const categories = categoriesRes.rows.map(c => ({
      _id: c.id,
      id: c.id,
      name: c.name,
      code: c.code,
      type: c.type,
      defaultAmount: Number(c.default_amount) || 0,
      frequency: c.frequency,
      isMandatory: Boolean(c.is_mandatory),
      description: c.description || '',
      createdAt: c.created_at,
      updatedAt: c.updated_at
    }));

    // Compute Stats
    const totalCollected = Number(txnSumRes.rows[0]?.total) || 0;
    const activeStudentCount = parseInt(stuCountRes.rows[0]?.count || "0", 10);

    const courseFeeMap = new Map<string, number>();
    for (const c of courses) {
      courseFeeMap.set(c.id, c.tuitionFee);
    }

    let totalReceivable = 0;
    for (const s of students) {
      if (!s) continue;
      totalReceivable += Number(s.totalFee) || 0;
    }

    const stats = {
      totalCollected,
      totalReceivable,
      activeStudentCount
    };

    // Staff list (from Redis or MongoDB fallback)
    let staffList = cachedStaff;
    if (!staffList || !Array.isArray(staffList) || staffList.length === 0) {
      try {
        await connectDB();
        const users = await User.find({
          role: { $in: ['Staff', 'Faculty', 'Accountant', 'Librarian', 'HOD', 'Principal'] },
          status: 'Active'
        }).select('firstName lastName email role employeeId').lean();

        staffList = (users || []).map((u: any) => ({
          _id: u._id?.toString() || u.id,
          id: u._id?.toString() || u.id,
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          email: u.email || '',
          role: u.role || 'Staff',
          employeeId: u.employeeId || ''
        }));
        await setCache("users:staff:list", staffList, DEFAULT_CACHE_TTL);
      } catch (err) {
        console.warn("Failed fetching staff from MongoDB:", err);
        staffList = [];
      }
    }

    // Format Alerts Data
    const alerts = alertsRes.rows.map(a => ({
      _id: a.id,
      id: a.id,
      studentId: a.student_id,
      studentName: a.student_name,
      admissionNumber: a.admission_number,
      parentContact: a.parent_contact,
      alertType: a.alert_type,
      title: a.title,
      message: a.message,
      channel: a.channel,
      status: a.status,
      outstandingAmount: Number(a.outstanding_amount) || 0,
      sentAt: a.sent_at,
      createdAt: a.created_at
    }));

    // Find defaulters from students
    const defaulters: any[] = [];
    for (const st of students) {
      if (!st) continue;
      const stTotal = Number(st.totalFee) || 0;
      const stPaid = Number(st.paidFee) || 0;
      const stBalance = Math.max(0, stTotal - stPaid);

      if (stBalance > 0) {
        defaulters.push({
          _id: st._id || st.id,
          id: st._id || st.id,
          firstName: st.firstName,
          lastName: st.lastName,
          admissionNumber: st.admissionNumber,
          enrollmentNumber: st.enrollmentNumber,
          mobile: st.mobile,
          branchName: st.branchName || 'Main Campus',
          courseName: st.courseName || 'General',
          courseCode: st.courseCode || '',
          outstandingAmount: stBalance,
          riskLevel: stBalance > 50000 ? 'High' : stBalance > 20000 ? 'Medium' : 'Low'
        });
      }
    }

    const alertsData = {
      summary: {
        totalAlerts: alerts.length,
        totalDefaultersCount: defaulters.length,
        totalOutstandingSum: defaulters.reduce((acc, d) => acc + d.outstandingAmount, 0),
        highRiskCount: defaulters.filter(d => d.riskLevel === 'High').length
      },
      alerts,
      defaulters: defaulters.slice(0, 50)
    };

    const bundle = {
      stats,
      transactions,
      payouts,
      staffList,
      branches,
      courses,
      students,
      categories,
      alertsData,
      timestamp: Date.now()
    };

    // 3. Cache the full master bundle in Redis (30 min TTL)
    await setCache(FINANCE_BUNDLE_CACHE_KEY, bundle, DEFAULT_CACHE_TTL);

    return NextResponse.json(bundle, {
      headers: {
        "X-Cache-Source": "Neon-PostgreSQL",
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=600"
      }
    });

  } catch (error: any) {
    console.error("GET /api/finance/bundle error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate finance bundle" }, { status: 500 });
  }
}
