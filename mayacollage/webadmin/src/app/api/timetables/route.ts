import { NextResponse } from "next/server";
import { query } from "@/lib/postgres";
import { getCache, setCache, delCachePattern } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const branchId = searchParams.get("branchId");
    const semester = searchParams.get("semester");
    const section = searchParams.get("section") || "A";

    if (!courseId || !branchId || !semester) {
      return NextResponse.json({ error: "Missing required query parameters" }, { status: 400 });
    }

    const semNum = parseInt(semester, 10);
    const cacheKey = `master:tt:${courseId}:${branchId}:${semNum}:${section}`;
    
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const res = await query(`
      SELECT * FROM timetables
      WHERE course_id = $1 AND branch_id = $2 AND semester = $3 AND section = $4
      LIMIT 1;
    `, [courseId, branchId, semNum, section]);

    if (res.rows.length === 0) {
      return NextResponse.json({ schedule: [] });
    }

    const tt = res.rows[0];
    const data = {
      _id: tt.id,
      id: tt.id,
      courseId: tt.course_id,
      branchId: tt.branch_id,
      semester: tt.semester,
      section: tt.section,
      timeSlots: typeof tt.time_slots === 'string' ? JSON.parse(tt.time_slots) : tt.time_slots,
      schedule: typeof tt.schedule === 'string' ? JSON.parse(tt.schedule) : tt.schedule,
      updatedAt: tt.updated_at
    };

    await setCache(cacheKey, data, 300);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Timetables GET Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseId, branchId, semester, section, schedule, timeSlots } = body;

    if (!courseId || !branchId || !semester) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const semNum = parseInt(semester, 10);
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

    await delCachePattern('master:tt*');

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    console.error("Timetables POST Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
