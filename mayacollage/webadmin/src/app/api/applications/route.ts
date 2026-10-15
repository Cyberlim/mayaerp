import { NextResponse } from "next/server";
import { query } from "@/lib/postgres";
import { getCache, setCache, delCachePattern } from "@/lib/redis";
import { mapApplicationRow } from "@/lib/admissionsMapper";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const selectedProgram = searchParams.get("selectedProgram");

    const cacheKey = `master:apps:${status || 'all'}:${selectedProgram || 'all'}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Data-Source": "Redis-Cache" }
      });
    }

    // 1. Applications query
    let sql = `SELECT * FROM applications WHERE 1=1`;
    const params: any[] = [];
    let pIdx = 1;

    if (status && status !== "All") {
      sql += ` AND status = $${pIdx++}`;
      params.push(status);
    }
    if (selectedProgram && selectedProgram !== "All Courses") {
      sql += ` AND (selected_program = $${pIdx} OR selected_program ILIKE $${pIdx})`;
      params.push(selectedProgram);
      pIdx++;
    }

    sql += ` ORDER BY created_at DESC;`;

    const appsRes = await query(sql, params);
    const applications = appsRes.rows.map(mapApplicationRow);

    // 2. Student course stats from courses & students (or mock fallback if students is in pg)
    // Query courses from courses table or distinct programs
    let studentCourseStats: any[] = [];
    try {
      const courseStatsRes = await query(`
        SELECT 
          c.id,
          c.name,
          c.intake_capacity as "intakeCapacity",
          COALESCE(count(a.id), 0) as filled
        FROM courses c
        LEFT JOIN applications a ON (a.selected_program = c.id OR a.selected_program = c.name) AND a.status IN ('Accepted', 'Approved')
        GROUP BY c.id, c.name, c.intake_capacity
        ORDER BY c.name ASC;
      `);
      studentCourseStats = courseStatsRes.rows.map(r => ({
        name: r.name,
        total: r.intakeCapacity || 60,
        filled: parseInt(r.filled || '0', 10)
      }));
    } catch {
      // If courses table doesn't exist or differs, aggregate from applications directly
      const fallbackStats = await query(`
        SELECT 
          selected_program as name,
          count(*) as filled
        FROM applications
        WHERE status IN ('Accepted', 'Approved')
        GROUP BY selected_program;
      `);
      studentCourseStats = fallbackStats.rows.map(r => ({
        name: r.name,
        total: 60,
        filled: parseInt(r.filled || '0', 10)
      }));
    }

    // 3. Overall Statistics
    const statsRes = await query(`
      SELECT 
        count(*) as total_apps,
        count(*) FILTER (WHERE status IN ('Accepted', 'Approved')) as admitted_count,
        count(*) FILTER (WHERE status = 'Pending') as pending_count,
        count(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_this_month
      FROM applications;
    `);

    const st = statsRes.rows[0] || {};
    const stats = {
      totalStudents: parseInt(st.admitted_count || '0', 10),
      newAdmissions: parseInt(st.new_this_month || '0', 10),
      totalApplications: parseInt(st.total_apps || '0', 10),
      pendingReview: parseInt(st.pending_count || '0', 10)
    };

    const payload = {
      applications,
      studentCourseStats,
      stats
    };

    // Cache in Redis for 120 seconds
    await setCache(cacheKey, payload, 120);

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("GET /api/applications error:", error);
    return NextResponse.json({ error: "Failed to fetch applications", details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body.id || `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const sql = `
      INSERT INTO applications (
        id, first_name, last_name, dob, gender, email, mobile, alternate_mobile,
        address, city, state, pin_code, applicant_photo,
        highest_qualification, institution_name, board_university, percentage_cgpa,
        year_of_passing, subject_marks, entrance_score,
        selected_program, selected_branch, session_year, category, statement_of_purpose,
        documents, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16, $17,
        $18, $19, $20,
        $21, $22, $23, $24, $25,
        $26, $27, NOW(), NOW()
      ) RETURNING *;
    `;

    const res = await query(sql, [
      id,
      body.firstName || 'Applicant',
      body.lastName || '',
      body.dob || '2004-01-01',
      body.gender || 'Male',
      body.email,
      body.mobile,
      body.alternateMobile || null,
      body.address || '',
      body.city || '',
      body.state || '',
      body.pinCode || '',
      body.applicantPhoto || null,
      body.highestQualification || '12th',
      body.institutionName || '',
      body.boardUniversity || '',
      body.percentageCGPA || '',
      body.yearOfPassing || '2024',
      JSON.stringify(body.subjectMarks || {}),
      body.entranceScore || null,
      body.selectedProgram,
      body.selectedBranch || null,
      body.sessionYear || '2024-2025',
      body.category || 'General',
      body.statementOfPurpose || null,
      JSON.stringify(body.documents || {}),
      'Pending'
    ]);

    // Invalidate caches
    await delCachePattern('master:apps*');

    return NextResponse.json(mapApplicationRow(res.rows[0]), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/applications error:", error);
    return NextResponse.json({ error: "Failed to create application", details: error.message }, { status: 500 });
  }
}
