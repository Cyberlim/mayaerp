import { NextResponse } from "next/server";
import { query } from "@/lib/postgres";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!studentId || !startDateStr || !endDateStr) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const start = startDateStr.split('T')[0];
    const end = endDateStr.split('T')[0];

    // Fetch records from PostgreSQL
    const res = await query(`
      SELECT 
        date,
        status,
        is_late,
        subject,
        subject_code
      FROM attendance
      WHERE student_id = $1 AND date >= $2 AND date <= $3
      ORDER BY date ASC;
    `, [studentId, start, end]);

    const records = res.rows;

    let present = 0;
    let absent = 0;
    let late = 0;

    records.forEach(r => {
      if (r.status === 'Present') present++;
      else if (r.status === 'Absent') absent++;
      else if (r.status === 'Late') late++;
    });

    const totalMarked = records.length;
    const effectivePresent = present + (late * 0.5);
    const percentage = totalMarked > 0 ? Math.round((effectivePresent / totalMarked) * 100) : 0;

    return NextResponse.json({
      metrics: {
        totalDays: totalMarked || 1,
        workingDays: totalMarked || 1,
        presentDays: present,
        absentDays: absent,
        lateDays: late,
        percentage
      },
      records: records.map(r => ({
        date: r.date,
        status: r.status,
        subject: r.subject
      }))
    });
  } catch (error: any) {
    console.error("Attendance Analytics Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics", details: error.message }, { status: 500 });
  }
}
