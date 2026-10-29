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
          s.id,
          s.first_name,
          s.middle_name,
          s.last_name,
          s.father_name,
          s.email,
          s.mobile,
          s.parent_mobile,
          s.student_id,
          s.admission_number,
          s.enrollment_number,
          s.selected_branch,
          s.selected_program,
          COALESCE(NULLIF(s.branch_name, ''), b.name, '') as branch_name,
          COALESCE(NULLIF(s.course_name, ''), c.name, '') as course_name,
          COALESCE(NULLIF(s.course_code, ''), c.code, '') as course_code,
          s.course_year,
          s.selected_semester,
          s.session_year,
          s.batch,
          s.admission_year,
          s.student_status,
          s.documents,
          s.fees
        FROM students s
        LEFT JOIN courses c ON s.selected_program = c.id
        LEFT JOIN branches b ON s.selected_branch = b.id
        ORDER BY s.first_name ASC
        LIMIT 1000
      `;

      const res = await pgQuery(allSql);
      const formatted = res.rows.map(s => {
        const docs = typeof s.documents === 'string' ? JSON.parse(s.documents) : (s.documents || {});
        const fatherName = (s.father_name || docs.fatherName || docs.father_name || '').trim();
        const course = (s.course_name || s.course_code || '').trim() || 'General Course';
        const branch = (s.branch_name || '').trim() || 'General Branch';

        return {
          _id: s.id,
          id: s.id,
          firstName: s.first_name || '',
          middleName: s.middle_name || '',
          lastName: s.last_name || '',
          fatherName: fatherName,
          email: s.email || '',
          mobile: s.mobile || '',
          parentMobile: s.parent_mobile || docs.parentMobile || docs.parent_mobile || '',
          studentId: s.student_id || s.admission_number || '',
          admissionNumber: s.admission_number || s.student_id || '',
          enrollmentNumber: s.enrollment_number || '',
          selectedBranch: branch,
          selectedProgram: course,
          courseName: course,
          courseCode: s.course_code || '',
          branchName: branch,
          courseYear: Number(s.course_year) || 1,
          selectedSemester: Number(s.selected_semester) || 1,
          sessionYear: s.session_year || '',
          batch: s.batch || s.admission_year || '',
          admissionYear: s.admission_year || '',
          status: s.student_status || 'Active',
          fees: typeof s.fees === 'string' ? JSON.parse(s.fees) : (s.fees || {})
        };
      });

      // Cache for 15 minutes in Redis
      await setCache(cacheKey, formatted, 900);

      return NextResponse.json(formatted, {
        headers: { "X-Cache": "MISS", "X-Database": "PostgreSQL" }
      });
    }

    const searchPattern = `%${q}%`;

    const sql = `
      SELECT 
        s.id,
        s.first_name,
        s.middle_name,
        s.last_name,
        s.father_name,
        s.email,
        s.mobile,
        s.parent_mobile,
        s.student_id,
        s.admission_number,
        s.enrollment_number,
        s.selected_branch,
        s.selected_program,
        COALESCE(NULLIF(s.branch_name, ''), b.name, '') as branch_name,
        COALESCE(NULLIF(s.course_name, ''), c.name, '') as course_name,
        COALESCE(NULLIF(s.course_code, ''), c.code, '') as course_code,
        s.course_year,
        s.selected_semester,
        s.session_year,
        s.batch,
        s.admission_year,
        s.student_status,
        s.documents,
        s.fees
      FROM students s
      LEFT JOIN courses c ON s.selected_program = c.id
      LEFT JOIN branches b ON s.selected_branch = b.id
      WHERE 
        s.first_name ILIKE $1 OR
        s.last_name ILIKE $1 OR
        s.father_name ILIKE $1 OR
        CONCAT(s.first_name, ' ', s.last_name) ILIKE $1 OR
        s.student_id ILIKE $1 OR
        s.admission_number ILIKE $1 OR
        s.enrollment_number ILIKE $1 OR
        s.mobile ILIKE $1 OR
        s.email ILIKE $1 OR
        s.course_name ILIKE $1 OR
        c.name ILIKE $1 OR
        b.name ILIKE $1
      ORDER BY 
        CASE 
          WHEN s.student_id ILIKE $1 THEN 1
          WHEN s.admission_number ILIKE $1 THEN 2
          WHEN s.enrollment_number ILIKE $1 THEN 3
          WHEN s.first_name ILIKE $1 THEN 4
          ELSE 5
        END
      LIMIT 50
    `;

    const res = await pgQuery(sql, [searchPattern]);

    const formatted = res.rows.map(s => {
      const docs = typeof s.documents === 'string' ? JSON.parse(s.documents) : (s.documents || {});
      const fatherName = (s.father_name || docs.fatherName || docs.father_name || '').trim();
      const course = (s.course_name || s.course_code || '').trim() || 'General Course';
      const branch = (s.branch_name || '').trim() || 'General Branch';

      return {
        _id: s.id,
        id: s.id,
        firstName: s.first_name || '',
        middleName: s.middle_name || '',
        lastName: s.last_name || '',
        fatherName: fatherName,
        email: s.email || '',
        mobile: s.mobile || '',
        parentMobile: s.parent_mobile || docs.parentMobile || docs.parent_mobile || '',
        studentId: s.student_id || s.admission_number || '',
        admissionNumber: s.admission_number || s.student_id || '',
        enrollmentNumber: s.enrollment_number || '',
        selectedBranch: branch,
        selectedProgram: course,
        courseName: course,
        courseCode: s.course_code || '',
        branchName: branch,
        courseYear: Number(s.course_year) || 1,
        selectedSemester: Number(s.selected_semester) || 1,
        sessionYear: s.session_year || '',
        batch: s.batch || s.admission_year || '',
        admissionYear: s.admission_year || '',
        status: s.student_status || 'Active',
        fees: typeof s.fees === 'string' ? JSON.parse(s.fees) : (s.fees || {})
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Transport Student Search Error (PostgreSQL):", error);
    return NextResponse.json({ message: "Search error", error: error.message }, { status: 500 });
  }
}
