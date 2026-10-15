import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { getCache, setCache, delCache, delCachePattern, DEFAULT_CACHE_TTL } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cacheKey = `course:${id}`;

    // 1. Try Redis cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Cache-Source": "Upstash-Redis" }
      });
    }

    // 2. Query Neon PostgreSQL
    const sql = `
      SELECT 
        c.*,
        b.name as branch_name,
        b.code as branch_code,
        b.dean_name,
        b.color_hex,
        b.icon_name
      FROM courses c
      LEFT JOIN branches b ON c.branch_id = b.id
      WHERE c.id = $1
    `;
    const res = await pgQuery(sql, [id]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const c = res.rows[0];
    const branchObj = c.branch_id ? {
      _id: c.branch_id,
      id: c.branch_id,
      name: c.branch_name || "",
      code: c.branch_code || "",
      deanName: c.dean_name || "",
      colorHex: c.color_hex || "#4F46E5",
      iconName: c.icon_name || "business_center_rounded"
    } : null;

    const course = {
      _id: c.id,
      id: c.id,
      branchId: branchObj || c.branch_id,
      code: c.code,
      name: c.name,
      duration: Number(c.duration) || 4,
      intakeCapacity: Number(c.intake_capacity) || 60,
      coordinator: c.coordinator,
      tuitionFee: Number(c.tuition_fee) || 0,
      labIndex: c.lab_index,
      totalSemesters: Number(c.total_semesters) || 8,
      semesterFees: typeof c.semester_fees === 'string' ? JSON.parse(c.semester_fees) : (c.semester_fees || []),
      curriculum: typeof c.curriculum === 'string' ? JSON.parse(c.curriculum) : (c.curriculum || []),
      createdAt: c.created_at,
      updatedAt: c.updated_at
    };

    // Cache in Redis
    await setCache(cacheKey, course, DEFAULT_CACHE_TTL);

    return NextResponse.json(course, {
      headers: { "X-Cache-Source": "Neon-PostgreSQL" }
    });
  } catch (error: any) {
    console.error("GET /api/courses/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { applyToStudents, updateStudents, ...courseData } = body;
    const shouldSync = Boolean(applyToStudents || updateStudents);

    // Check if course exists in PostgreSQL
    const existingRes = await pgQuery('SELECT * FROM courses WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    const existing = existingRes.rows[0];

    const branchId = courseData.branchId !== undefined 
      ? (typeof courseData.branchId === 'object' ? courseData.branchId?._id : courseData.branchId)
      : existing.branch_id;

    const code = courseData.code !== undefined ? courseData.code : existing.code;
    const name = courseData.name !== undefined ? courseData.name : existing.name;
    const duration = courseData.duration !== undefined ? Number(courseData.duration) : existing.duration;
    const intakeCapacity = courseData.intakeCapacity !== undefined ? Number(courseData.intakeCapacity) : existing.intake_capacity;
    const coordinator = courseData.coordinator !== undefined ? courseData.coordinator : existing.coordinator;
    const tuitionFee = courseData.tuitionFee !== undefined ? Number(courseData.tuitionFee) : existing.tuition_fee;
    const labIndex = courseData.labIndex !== undefined ? courseData.labIndex : existing.lab_index;
    const totalSemesters = courseData.totalSemesters !== undefined ? Number(courseData.totalSemesters) : existing.total_semesters;
    const semesterFees = courseData.semesterFees !== undefined 
      ? JSON.stringify(courseData.semesterFees) 
      : (typeof existing.semester_fees === 'string' ? existing.semester_fees : JSON.stringify(existing.semester_fees || []));
    const curriculum = courseData.curriculum !== undefined 
      ? JSON.stringify(courseData.curriculum) 
      : (typeof existing.curriculum === 'string' ? existing.curriculum : JSON.stringify(existing.curriculum || []));

    const updateSQL = `
      UPDATE courses SET
        branch_id = $1,
        code = $2,
        name = $3,
        duration = $4,
        intake_capacity = $5,
        coordinator = $6,
        tuition_fee = $7,
        lab_index = $8,
        total_semesters = $9,
        semester_fees = $10,
        curriculum = $11,
        updated_at = NOW()
      WHERE id = $12
      RETURNING *
    `;

    const updateRes = await pgQuery(updateSQL, [
      branchId,
      code,
      name,
      duration,
      intakeCapacity,
      coordinator,
      tuitionFee,
      labIndex,
      totalSemesters,
      semesterFees,
      curriculum,
      id
    ]);

    const updated = updateRes.rows[0];

    // If applyToStudents is requested, sync fees to students in PostgreSQL
    if (shouldSync && (Number(tuitionFee) > 0 || (courseData.semesterFees && courseData.semesterFees.length > 0))) {
      try {
        const courseDuration = Number(duration) || 4;
        let totalFee = Number(tuitionFee) || 0;
        const parsedSemesterFees = typeof semesterFees === 'string' ? JSON.parse(semesterFees) : semesterFees;
        if (Array.isArray(parsedSemesterFees) && parsedSemesterFees.length > 0) {
          const sumSem = parsedSemesterFees.reduce((acc: number, sf: any) => acc + (Number(sf.fee) || 0), 0);
          if (sumSem > 0) totalFee = sumSem;
        }
        const annualFee = Math.round(totalFee / courseDuration);

        // Fetch students enrolled in this course from PostgreSQL
        const studentsRes = await pgQuery('SELECT id, fees FROM students WHERE selected_program = $1', [id]);
        for (const st of studentsRes.rows) {
          const existingFees = typeof st.fees === 'string' ? JSON.parse(st.fees) : (st.fees || {});
          const existingYears = existingFees.years || [];
          const years = Array.from({ length: courseDuration }).map((_, idx) => ({
            year: idx + 1,
            tuition: { total: annualFee, paid: existingYears[idx]?.tuition?.paid || 0 },
            exam: { total: 0, paid: existingYears[idx]?.exam?.paid || 0 },
            transport: { total: 0, paid: existingYears[idx]?.transport?.paid || 0 },
            other: { total: 0, paid: existingYears[idx]?.other?.paid || 0 }
          }));

          const updatedFees = {
            isConfigured: true,
            years
          };

          await pgQuery('UPDATE students SET fees = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(updatedFees), st.id]);
        }
        // Invalidate students cache
        await delCachePattern("students:*");
      } catch (feeSyncErr) {
        console.error("Error syncing student fees:", feeSyncErr);
      }
    }

    // Invalidate Redis caches
    await delCachePattern("master:courses:*");
    await delCache(`course:${id}`);

    // Fetch joined branch info for returning
    const branchRes = await pgQuery('SELECT * FROM branches WHERE id = $1', [updated.branch_id]);
    const b = branchRes.rows[0];
    const branchObj = b ? {
      _id: b.id,
      id: b.id,
      name: b.name || "",
      code: b.code || "",
      deanName: b.dean_name || "",
      colorHex: b.color_hex || "#4F46E5",
      iconName: b.icon_name || "business_center_rounded"
    } : null;

    const formatted = {
      _id: updated.id,
      id: updated.id,
      branchId: branchObj || updated.branch_id,
      code: updated.code,
      name: updated.name,
      duration: Number(updated.duration) || 4,
      intakeCapacity: Number(updated.intake_capacity) || 60,
      coordinator: updated.coordinator,
      tuitionFee: Number(updated.tuition_fee) || 0,
      labIndex: updated.lab_index,
      totalSemesters: Number(updated.total_semesters) || 8,
      semesterFees: typeof updated.semester_fees === 'string' ? JSON.parse(updated.semester_fees) : (updated.semester_fees || []),
      curriculum: typeof updated.curriculum === 'string' ? JSON.parse(updated.curriculum) : (updated.curriculum || []),
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("PATCH /api/courses/[id] error:", error);
    if (error.code === '23505') {
      return NextResponse.json({ error: "Course code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await pgQuery('DELETE FROM courses WHERE id = $1 RETURNING *', [id]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Invalidate Redis caches
    await delCachePattern("master:courses:*");
    await delCache(`course:${id}`);

    return NextResponse.json({ message: "Course deleted successfully from PostgreSQL" });
  } catch (error: any) {
    console.error("DELETE /api/courses/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
