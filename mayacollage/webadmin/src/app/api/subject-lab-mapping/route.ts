import { NextResponse } from "next/server";
import { query } from "@/lib/postgres";
import { getCache, setCache, delCachePattern } from "@/lib/redis";
import { mapMappingRow } from "@/lib/labMapper";

export const dynamic = 'force-dynamic';

const CACHE_KEY = "master:subject-lab-mappings";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search");

    const cacheKey = search ? `${CACHE_KEY}:${search}` : CACHE_KEY;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Data-Source": "Redis-Cache" }
      });
    }

    let sql = `
      SELECT 
        m.*,
        l.lab_name,
        l.room_number,
        u.first_name AS faculty_first_name,
        u.last_name AS faculty_last_name,
        u.email AS faculty_email
      FROM subject_lab_mappings m
      LEFT JOIN labs l ON m.lab_id = l.id
      LEFT JOIN users u ON m.faculty_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      sql += ` AND (m.subject ILIKE $1 OR m.course ILIKE $1 OR m.branch ILIKE $1)`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY m.created_at DESC;`;

    const res = await query(sql, params);
    const mappings = res.rows.map(mapMappingRow);

    await setCache(cacheKey, mappings, 300);

    return NextResponse.json(mappings, {
      headers: { "X-Data-Source": "PostgreSQL-Neon" }
    });
  } catch (error: any) {
    console.error("Subject Lab Mapping GET Error:", error);
    return NextResponse.json({ message: "Error fetching mappings", error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body.id || body._id || `map_${Date.now()}`;
    const subject = body.subject;
    const course = body.course;
    const branch = body.branch;
    const semester = body.semester;
    const labId = typeof body.lab === 'object' ? (body.lab?._id || body.lab?.id) : (body.lab || body.lab_id);
    const facultyId = typeof body.faculty === 'object' ? (body.faculty?._id || body.faculty?.id) : (body.faculty || body.faculty_id);
    const academicYear = body.academicYear || body.academic_year || '2024-2025';
    const isActive = body.isActive !== false;

    if (!subject || !course || !branch || !semester || !labId) {
      return NextResponse.json({ message: "Subject, course, branch, semester, and lab are required" }, { status: 400 });
    }

    await query(`
      INSERT INTO subject_lab_mappings (
        id, subject, course, branch, semester, lab_id, faculty_id, academic_year, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *;
    `, [id, subject, course, branch, semester, labId, facultyId || null, academicYear, isActive]);

    const joined = await query(`
      SELECT 
        m.*,
        l.lab_name,
        l.room_number,
        u.first_name AS faculty_first_name,
        u.last_name AS faculty_last_name,
        u.email AS faculty_email
      FROM subject_lab_mappings m
      LEFT JOIN labs l ON m.lab_id = l.id
      LEFT JOIN users u ON m.faculty_id = u.id
      WHERE m.id = $1;
    `, [id]);

    const created = mapMappingRow(joined.rows[0]);
    await delCachePattern("master:subject-lab-mappings*");

    return NextResponse.json({ message: "Mapping created successfully in PostgreSQL", mapping: created }, { status: 201 });
  } catch (error: any) {
    console.error("Subject Lab Mapping POST Error:", error);
    return NextResponse.json({ message: "Error creating mapping", error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const id = body.id || body._id;

    if (!id) {
      return NextResponse.json({ message: "Mapping ID is required" }, { status: 400 });
    }

    const subject = body.subject;
    const course = body.course;
    const branch = body.branch;
    const semester = body.semester;
    const labId = typeof body.lab === 'object' ? (body.lab?._id || body.lab?.id) : (body.lab || body.lab_id);
    const facultyId = typeof body.faculty === 'object' ? (body.faculty?._id || body.faculty?.id) : (body.faculty || body.faculty_id);
    const academicYear = body.academicYear || body.academic_year;
    const isActive = body.isActive;

    await query(`
      UPDATE subject_lab_mappings
      SET
        subject = COALESCE($2, subject),
        course = COALESCE($3, course),
        branch = COALESCE($4, branch),
        semester = COALESCE($5, semester),
        lab_id = COALESCE($6, lab_id),
        faculty_id = COALESCE($7, faculty_id),
        academic_year = COALESCE($8, academic_year),
        is_active = COALESCE($9, is_active),
        updated_at = NOW()
      WHERE id = $1;
    `, [id, subject, course, branch, semester, labId, facultyId, academicYear, isActive]);

    const joined = await query(`
      SELECT 
        m.*,
        l.lab_name,
        l.room_number,
        u.first_name AS faculty_first_name,
        u.last_name AS faculty_last_name,
        u.email AS faculty_email
      FROM subject_lab_mappings m
      LEFT JOIN labs l ON m.lab_id = l.id
      LEFT JOIN users u ON m.faculty_id = u.id
      WHERE m.id = $1;
    `, [id]);

    if (joined.rowCount === 0) {
      return NextResponse.json({ message: "Mapping not found" }, { status: 404 });
    }

    const updated = mapMappingRow(joined.rows[0]);
    await delCachePattern("master:subject-lab-mappings*");

    return NextResponse.json({ message: "Mapping updated successfully in PostgreSQL", mapping: updated }, { status: 200 });
  } catch (error: any) {
    console.error("Subject Lab Mapping PUT Error:", error);
    return NextResponse.json({ message: "Error updating mapping", error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Mapping ID is required" }, { status: 400 });
    }

    const res = await query(`DELETE FROM subject_lab_mappings WHERE id = $1 RETURNING id;`, [id]);
    if (res.rowCount === 0) {
      return NextResponse.json({ message: "Mapping not found" }, { status: 404 });
    }

    await delCachePattern("master:subject-lab-mappings*");
    return NextResponse.json({ message: "Mapping deleted successfully from PostgreSQL" }, { status: 200 });
  } catch (error: any) {
    console.error("Subject Lab Mapping DELETE Error:", error);
    return NextResponse.json({ message: "Error deleting mapping", error: error.message }, { status: 500 });
  }
}
