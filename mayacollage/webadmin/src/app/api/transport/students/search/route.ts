import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { getCache, setCache } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const all = searchParams.get("all") === "true";
    const refresh = searchParams.get("refresh") === "true";

    // If requesting all students for client-side local cache memory
    if (all || !q) {
      const cacheKey = "transport:students:all_active";
      if (!refresh) {
        const cached = await getCache(cacheKey);
        if (cached && Array.isArray(cached) && cached.length > 0) {
          return NextResponse.json(cached, {
            headers: { "X-Cache": "HIT", "X-Database": "PostgreSQL" }
          });
        }
      }

      const allSql = `
        SELECT 
          id,
          first_name,
          last_name,
          email,
          mobile,
          student_id,
          admission_number,
          selected_branch,
          selected_program,
          branch_name,
          course_name,
          course_year,
          student_status,
          fees
        FROM students
        ORDER BY first_name ASC
        LIMIT 1000
      `;

      const res = await pgQuery(allSql);
      const formatted = res.rows.map(s => ({
        _id: s.id,
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        email: s.email,
        mobile: s.mobile,
        studentId: s.student_id,
        admissionNumber: s.admission_number,
        selectedBranch: s.selected_branch || s.branch_name,
        selectedProgram: s.selected_program || s.course_name,
        courseName: s.course_name,
        branchName: s.branch_name,
        courseYear: s.course_year,
        status: s.student_status,
        fees: typeof s.fees === 'string' ? JSON.parse(s.fees) : s.fees
      }));

      // Cache for 15 minutes in Redis
      await setCache(cacheKey, formatted, 900);

      return NextResponse.json(formatted, {
        headers: { "X-Cache": "MISS", "X-Database": "PostgreSQL" }
      });
    }

    const searchPattern = `%${q}%`;

    const sql = `
      SELECT 
        id,
        first_name,
        last_name,
        email,
        mobile,
        student_id,
        admission_number,
        selected_branch,
        selected_program,
        branch_name,
        course_name,
        course_year,
        student_status,
        fees
      FROM students
      WHERE 
        first_name ILIKE $1 OR
        last_name ILIKE $1 OR
        CONCAT(first_name, ' ', last_name) ILIKE $1 OR
        student_id ILIKE $1 OR
        admission_number ILIKE $1 OR
        mobile ILIKE $1 OR
        email ILIKE $1
      ORDER BY 
        CASE 
          WHEN student_id ILIKE $1 THEN 1
          WHEN admission_number ILIKE $1 THEN 2
          WHEN first_name ILIKE $1 THEN 3
          ELSE 4
        END
      LIMIT 50
    `;

    const res = await pgQuery(sql, [searchPattern]);

    const formatted = res.rows.map(s => ({
      _id: s.id,
      id: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      email: s.email,
      mobile: s.mobile,
      studentId: s.student_id,
      admissionNumber: s.admission_number,
      selectedBranch: s.selected_branch || s.branch_name,
      selectedProgram: s.selected_program || s.course_name,
      courseName: s.course_name,
      branchName: s.branch_name,
      courseYear: s.course_year,
      status: s.student_status,
      fees: typeof s.fees === 'string' ? JSON.parse(s.fees) : s.fees
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Transport Student Search Error (PostgreSQL):", error);
    return NextResponse.json({ message: "Search error", error: error.message }, { status: 500 });
  }
}
