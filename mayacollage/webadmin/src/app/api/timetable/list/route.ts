import { NextResponse } from "next/server";
import { query } from "@/lib/postgres";
import { getCache, setCache } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cacheKey = `master:tt:list`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Data-Source": "Redis-Cache" }
      });
    }

    const res = await query(`
      SELECT 
        tt.id as "_id",
        tt.id,
        tt.course_id as "courseId",
        tt.branch_id as "branchId",
        tt.semester,
        tt.section,
        tt.target_type as "targetType",
        tt.time_slots as "timeSlots",
        tt.schedule,
        tt.updated_at as "updatedAt",
        COALESCE(c.name, tt.course_id) as "courseName",
        COALESCE(b.name, tt.branch_id) as "branchName"
      FROM timetables tt
      LEFT JOIN courses c ON (tt.course_id = c.id OR tt.course_id = c.name)
      LEFT JOIN branches b ON (tt.branch_id = b.id OR tt.branch_id = b.name)
      ORDER BY tt.updated_at DESC;
    `);

    const list = res.rows.map(r => ({
      _id: r._id,
      id: r.id,
      branchName: r.branchName || "General Branch",
      courseName: r.courseName || "General Course",
      semester: r.semester || 1,
      section: r.section || "A",
      updatedAt: r.updatedAt,
      targetType: r.targetType || "Class",
      branchId: r.branchId,
      courseId: r.courseId,
      timeSlots: typeof r.timeSlots === 'string' ? JSON.parse(r.timeSlots) : (r.timeSlots || []),
      schedule: typeof r.schedule === 'string' ? JSON.parse(r.schedule) : (r.schedule || [])
    }));

    await setCache(cacheKey, list, 120);

    return NextResponse.json(list);
  } catch (error: any) {
    console.error("GET /api/timetable/list error:", error);
    return NextResponse.json({ error: "Failed to fetch timetables", details: error.message }, { status: 500 });
  }
}
