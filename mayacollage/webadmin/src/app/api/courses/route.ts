import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { getCache, setCache, delCachePattern, DEFAULT_CACHE_TTL } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") || "all";
    const bust = searchParams.get("bust") === "true";
    const cacheKey = `master:courses:${branchId}`;

    // 1. Try Redis cache (sub-10ms response) if not busting cache
    if (!bust) {
      const cachedCourses = await getCache(cacheKey);
      if (cachedCourses && Array.isArray(cachedCourses) && cachedCourses.length > 0) {
        return NextResponse.json(cachedCourses, {
          headers: { "X-Cache-Source": "Upstash-Redis" }
        });
      }
    }

    // 2. Query Neon PostgreSQL directly with joined branch data
    let sql = `
      SELECT 
        c.*,
        b.name as branch_name,
        b.code as branch_code,
        b.dean_name,
        b.color_hex,
        b.icon_name
      FROM courses c
      LEFT JOIN branches b ON c.branch_id = b.id
      ORDER BY c.created_at DESC
    `;
    let params: any[] = [];

    if (branchId !== "all") {
      sql = `
        SELECT 
          c.*,
          b.name as branch_name,
          b.code as branch_code,
          b.dean_name,
          b.color_hex,
          b.icon_name
        FROM courses c
        LEFT JOIN branches b ON c.branch_id = b.id
        WHERE c.branch_id = $1
        ORDER BY c.created_at DESC
      `;
      params = [branchId];
    }

    const res = await pgQuery(sql, params);
    const courses = res.rows.map(c => {
      const branchObj = c.branch_id ? {
        _id: c.branch_id,
        id: c.branch_id,
        name: c.branch_name || "",
        code: c.branch_code || "",
        deanName: c.dean_name || "",
        colorHex: c.color_hex || "#4F46E5",
        iconName: c.icon_name || "business_center_rounded"
      } : null;

      return {
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
        feeStructureTemplate: typeof c.fee_structure_template === 'string' ? JSON.parse(c.fee_structure_template) : (c.fee_structure_template || []),
        curriculum: typeof c.curriculum === 'string' ? JSON.parse(c.curriculum) : (c.curriculum || []),
        createdAt: c.created_at,
        updatedAt: c.updated_at
      };
    });

    // 3. Cache in Redis
    await setCache(cacheKey, courses, DEFAULT_CACHE_TTL);

    return NextResponse.json(courses, {
      headers: { "X-Cache-Source": "Neon-PostgreSQL" }
    });
  } catch (error: any) {
    console.error("GET /api/courses error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body._id || body.id || `crs_${Date.now().toString(36)}`;
    const branchId = typeof body.branchId === 'object' ? body.branchId?._id : (body.branchId || null);

    // 1. Insert into Neon PostgreSQL directly (No MongoDB)
    const insertSQL = `
      INSERT INTO courses (
        id, branch_id, code, name, duration, intake_capacity, coordinator, tuition_fee, lab_index, total_semesters, semester_fees, fee_structure_template, curriculum, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *
    `;

    const res = await pgQuery(insertSQL, [
      id,
      branchId,
      body.code,
      body.name,
      Number(body.duration) || 4,
      Number(body.intakeCapacity) || 60,
      body.coordinator || null,
      Number(body.tuitionFee) || 0,
      body.labIndex || null,
      Number(body.totalSemesters) || 8,
      JSON.stringify(body.semesterFees || []),
      JSON.stringify(body.feeStructureTemplate || []),
      JSON.stringify(body.curriculum || [])
    ]);

    const created = res.rows[0];
    const formatted = {
      _id: created.id,
      id: created.id,
      branchId: created.branch_id,
      code: created.code,
      name: created.name,
      duration: Number(created.duration) || 4,
      intakeCapacity: Number(created.intake_capacity) || 60,
      coordinator: created.coordinator,
      tuitionFee: Number(created.tuition_fee) || 0,
      labIndex: created.lab_index,
      totalSemesters: Number(created.total_semesters) || 8,
      semesterFees: typeof created.semester_fees === 'string' ? JSON.parse(created.semester_fees) : (created.semester_fees || []),
      feeStructureTemplate: typeof created.fee_structure_template === 'string' ? JSON.parse(created.fee_structure_template) : (created.fee_structure_template || []),
      curriculum: typeof created.curriculum === 'string' ? JSON.parse(created.curriculum) : (created.curriculum || []),
      createdAt: created.created_at,
      updatedAt: created.updated_at
    };

    // 2. Invalidate Redis courses cache
    await delCachePattern("master:courses:*");

    return NextResponse.json(formatted, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/courses error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
