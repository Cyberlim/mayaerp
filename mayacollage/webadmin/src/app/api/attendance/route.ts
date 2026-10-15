import { NextResponse } from "next/server";
import { query, getClient } from "@/lib/postgres";
import { getCache, setCache, delCachePattern } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const studentIdsStr = searchParams.get("studentIds"); // Comma-separated student IDs
    const subject = searchParams.get("subject") || 'General Attendance';
    const subjCode = subject.substring(0, 3).toUpperCase();

    if (!dateStr) {
      return NextResponse.json({ error: "Missing required date parameter" }, { status: 400 });
    }

    const cleanDate = dateStr.split('T')[0];

    // If no studentIds provided, return all records for that date
    if (!studentIdsStr) {
      const res = await query(`
        SELECT 
          id,
          student_id as "student",
          student_roll as "studentId",
          student_name as "name",
          date,
          status,
          is_late as "isLate",
          subject,
          subject_code as "subjectCode"
        FROM attendance
        WHERE date = $1 AND subject_code = $2
        ORDER BY student_name ASC;
      `, [cleanDate, subjCode]);
      return NextResponse.json(res.rows);
    }

    const studentIds = studentIdsStr.split(',').map(s => s.trim()).filter(Boolean);
    if (studentIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch existing attendance records from PostgreSQL
    const res = await query(`
      SELECT 
        student_id as "student",
        status
      FROM attendance
      WHERE student_id = ANY($1) AND date = $2 AND subject_code = $3;
    `, [studentIds, cleanDate, subjCode]);

    const statusMap = new Map();
    res.rows.forEach(r => statusMap.set(r.student, r.status));

    // Also look up students in PostgreSQL students table if possible
    let studentsInfo: any[] = [];
    try {
      const sRes = await query(`
        SELECT id, student_id, first_name, last_name, applicant_photo
        FROM students
        WHERE id = ANY($1) OR student_id = ANY($1);
      `, [studentIds]);
      studentsInfo = sRes.rows;
    } catch (_) {}

    const result = studentIds.map(sid => {
      const st = studentsInfo.find(s => s.id === sid || s.student_id === sid);
      const name = st ? `${st.first_name || ''} ${st.last_name || ''}`.trim() : `Student ${sid.substring(0, 5)}`;
      return {
        _id: sid,
        id: sid,
        studentId: st?.student_id || sid,
        name,
        photo: st?.applicant_photo || null,
        status: statusMap.get(sid) || 'Present' // Default to Present for frictionless marking
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Attendance GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance", details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const client = await getClient();
  try {
    const body = await req.json();
    const { date, subject, records } = body;

    if (!date || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanDate = date.split('T')[0];
    const actualSubject = subject || 'General Attendance';
    const subjCode = actualSubject.substring(0, 3).toUpperCase();

    await client.query('BEGIN');

    let savedCount = 0;
    for (const rec of records) {
      const studentId = rec.student || rec.studentId || rec.id || rec._id;
      const status = rec.status || 'Present';
      const isLate = status === 'Late';
      const studentName = rec.studentName || rec.name || 'Student';
      const roll = rec.studentRoll || rec.studentId || null;
      const id = `att_${studentId}_${cleanDate}_${subjCode}`;

      await client.query(`
        INSERT INTO attendance (
          id, student_id, student_roll, student_name, date, status, is_late,
          subject, subject_code, department, course, section, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, 'Admin Manual', 'Admin Manual', 'A', NOW(), NOW()
        )
        ON CONFLICT (student_id, date, subject_code) DO UPDATE SET
          status = EXCLUDED.status,
          is_late = EXCLUDED.is_late,
          student_name = EXCLUDED.student_name,
          updated_at = NOW();
      `, [
        id,
        studentId,
        roll,
        studentName,
        cleanDate,
        status,
        isLate,
        actualSubject,
        subjCode
      ]);
      savedCount++;
    }

    await client.query('COMMIT');

    // Invalidate Redis caches
    await delCachePattern('master:att*');

    return NextResponse.json({ success: true, count: savedCount });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Attendance POST Error:", error);
    return NextResponse.json({ error: "Failed to save attendance in PostgreSQL", details: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
