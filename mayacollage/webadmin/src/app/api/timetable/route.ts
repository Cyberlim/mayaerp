import { NextResponse } from "next/server";
import { query } from "@/lib/postgres";
import { getCache, setCache, delCachePattern } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const branchId = searchParams.get("branchId");
    const courseId = searchParams.get("courseId");
    const semester = searchParams.get("semester");
    const section = searchParams.get("section") || "A";

    if (!branchId || !courseId) {
      return NextResponse.json({ error: "Missing required query parameters" }, { status: 400 });
    }

    const semNum = semester ? parseInt(semester, 10) : 1;
    const cacheKey = `master:tt:${courseId}:${branchId}:${semNum}:${section}`;
    
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Data-Source": "Redis-Cache" }
      });
    }

    const res = await query(`
      SELECT 
        id,
        target_type as "targetType",
        course_id as "courseId",
        branch_id as "branchId",
        semester,
        section,
        time_slots as "timeSlots",
        schedule,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM timetables
      WHERE course_id = $1 AND branch_id = $2 AND semester = $3 AND section = $4
      LIMIT 1;
    `, [courseId, branchId, semNum, section]);

    if (res.rows.length === 0) {
      return NextResponse.json({ schedule: [], timeSlots: [] });
    }

    const tt = res.rows[0];
    const data = {
      _id: tt.id,
      id: tt.id,
      targetType: tt.targetType,
      courseId: tt.courseId,
      branchId: tt.branchId,
      semester: tt.semester,
      section: tt.section,
      timeSlots: typeof tt.timeSlots === 'string' ? JSON.parse(tt.timeSlots) : (tt.timeSlots || []),
      schedule: typeof tt.schedule === 'string' ? JSON.parse(tt.schedule) : (tt.schedule || []),
      createdAt: tt.createdAt,
      updatedAt: tt.updatedAt
    };

    await setCache(cacheKey, data, 300);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET /api/timetable error:", error);
    return NextResponse.json({ error: "Failed to fetch timetable", details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { branchId, courseId, semester, section, schedule, timeSlots } = body;

    if (!branchId || !courseId) {
      return NextResponse.json({ error: "Missing required fields for Class timetable" }, { status: 400 });
    }

    const semNum = semester ? parseInt(semester, 10) : 1;
    const secStr = section || "A";
    const id = body.id || `tt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const res = await query(`
      INSERT INTO timetables (
        id, target_type, course_id, branch_id, semester, section, time_slots, schedule, created_at, updated_at
      ) VALUES (
        $1, 'Class', $2, $3, $4, $5, $6, $7, NOW(), NOW()
      )
      ON CONFLICT (course_id, branch_id, semester, section) DO UPDATE SET
        time_slots = EXCLUDED.time_slots,
        schedule = EXCLUDED.schedule,
        updated_at = NOW()
      RETURNING *;
    `, [
      id,
      courseId,
      branchId,
      semNum,
      secStr,
      JSON.stringify(timeSlots || []),
      JSON.stringify(schedule || [])
    ]);

    const updated = res.rows[0];

    // Invalidate caches
    await delCachePattern('master:tt*');

    return NextResponse.json({
      _id: updated.id,
      id: updated.id,
      targetType: updated.target_type,
      courseId: updated.course_id,
      branchId: updated.branch_id,
      semester: updated.semester,
      section: updated.section,
      timeSlots: typeof updated.time_slots === 'string' ? JSON.parse(updated.time_slots) : updated.time_slots,
      schedule: typeof updated.schedule === 'string' ? JSON.parse(updated.schedule) : updated.schedule,
      updatedAt: updated.updated_at
    });
  } catch (error: any) {
    console.error("POST /api/timetable error:", error);
    return NextResponse.json({ error: "Failed to save timetable", details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await query(`DELETE FROM timetables WHERE id = $1`, [id]);
    await delCachePattern('master:tt*');

    return NextResponse.json({ success: true, message: "Timetable deleted" });
  } catch (error: any) {
    console.error("DELETE /api/timetable error:", error);
    return NextResponse.json({ error: "Failed to delete timetable", details: error.message }, { status: 500 });
  }
}
