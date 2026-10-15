import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { getCache, setCache, DEFAULT_CACHE_TTL } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bustCache = searchParams.get("refresh") === "true" || searchParams.get("bust") === "true";
    const cacheKey = "transport:buses:all";

    if (!bustCache) {
      const cached = await getCache(cacheKey);
      if (cached) {
        return NextResponse.json(cached, {
          headers: { "X-Cache-Source": "Upstash-Redis", "X-Database": "Neon-PostgreSQL" }
        });
      }
    }

    // 1. Fetch buses from PostgreSQL
    const res = await pgQuery(`SELECT * FROM buses ORDER BY created_at DESC`);
    const busRows = res.rows;

    // Collect all student IDs assigned to buses
    const studentIds = new Set<string>();
    busRows.forEach(b => {
      const studs = typeof b.students === 'string' ? JSON.parse(b.students) : (b.students || []);
      studs.forEach((st: any) => {
        if (st.student) studentIds.add(String(st.student));
      });
    });

    // 2. Fetch student details from PostgreSQL students table
    let studentMap: Record<string, any> = {};
    if (studentIds.size > 0) {
      const idArray = Array.from(studentIds);
      const stuRes = await pgQuery(
        `SELECT id, first_name, last_name, email, mobile, student_id, admission_number, selected_branch, selected_program, branch_name, course_name, course_year, fees FROM students WHERE id = ANY($1)`,
        [idArray]
      );
      stuRes.rows.forEach(s => {
        studentMap[s.id] = {
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
          courseYear: s.course_year,
          fees: typeof s.fees === 'string' ? JSON.parse(s.fees) : s.fees
        };
      });
    }

    // 3. Format buses to match frontend BusFleet interface exactly
    const buses = busRows.map(b => {
      const rawStudents = typeof b.students === 'string' ? JSON.parse(b.students) : (b.students || []);
      const stops = typeof b.stops === 'string' ? JSON.parse(b.stops) : (b.stops || []);

      const students = rawStudents.map((st: any) => {
        const sid = String(st.student);
        const stuObj = studentMap[sid] || {
          _id: sid,
          id: sid,
          firstName: "Student",
          lastName: sid.slice(-4),
          email: "",
          mobile: "",
          studentId: "N/A"
        };

        return {
          _id: st._id || `asg_${sid}`,
          student: stuObj,
          stopName: st.stopName || (stops[0]?.stationName || "Main Station"),
          fare: Number(st.fare) || 0,
          paymentStatus: st.paymentStatus || "Pending",
          paymentDate: st.paymentDate || null,
          transactionId: st.transactionId || null
        };
      });

      return {
        _id: b.id,
        id: b.id,
        busNo: b.bus_no,
        driverName: b.driver_name,
        conductorName: b.conductor_name,
        capacity: Number(b.capacity) || 40,
        filled: students.length,
        routeName: b.route_name,
        status: students.length >= (Number(b.capacity) || 40) ? "Full" : (b.status || "Active"),
        stops: stops,
        students: students,
        createdAt: b.created_at,
        updatedAt: b.updated_at
      };
    });

    await setCache(cacheKey, buses, DEFAULT_CACHE_TTL);

    return NextResponse.json(buses, {
      headers: { "X-Cache-Source": "Neon-PostgreSQL-Live", "X-Database": "Neon-PostgreSQL" }
    });
  } catch (error: any) {
    console.error("Transport GET Buses Error (PostgreSQL):", error);
    return NextResponse.json({ message: "Error fetching buses from PostgreSQL", error: error.message }, { status: 500 });
  }
}
