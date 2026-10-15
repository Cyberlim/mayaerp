import { NextResponse } from "next/server";
import { query, getClient } from "@/lib/postgres";
import { delCachePattern } from "@/lib/redis";
import { mapApplicationRow } from "@/lib/admissionsMapper";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await query(`SELECT * FROM applications WHERE id = $1`, [id]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json(mapApplicationRow(res.rows[0]));
  } catch (error: any) {
    console.error("GET /api/applications/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch application", details: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await getClient();
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    await client.query('BEGIN');

    // Update application
    const appRes = await client.query(`
      UPDATE applications
      SET 
        status = $1,
        student_id = COALESCE($2, student_id),
        admission_number = COALESCE($3, admission_number),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `, [body.status, body.studentId || null, body.admissionNumber || null, id]);

    if (appRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const application = appRes.rows[0];

    // If approved, create or link in students table if exists in PostgreSQL
    if (body.status === "Approved" || body.status === "Accepted") {
      try {
        const studentCheck = await client.query(`
          SELECT id FROM students WHERE application_id = $1 OR email = $2
        `, [id, application.email]);

        if (studentCheck.rows.length === 0) {
          const studentId = body.studentId || application.student_id || `STU${Date.now()}`;
          const admNo = body.admissionNumber || application.admission_number || `ADM${Date.now()}`;
          const pwd = application.dob ? application.dob.replace(/-/g, '') : "password123";

          await client.query(`
            INSERT INTO students (
              id, application_id, student_id, admission_number, password,
              first_name, last_name, dob, gender, email, mobile,
              address, city, state, pin_code, applicant_photo,
              status, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5,
              $6, $7, $8, $9, $10, $11,
              $12, $13, $14, $15, $16,
              'Active', NOW(), NOW()
            ) ON CONFLICT DO NOTHING;
          `, [
            `stu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            id,
            studentId,
            admNo,
            pwd,
            application.first_name,
            application.last_name,
            application.dob,
            application.gender,
            application.email,
            application.mobile,
            application.address,
            application.city,
            application.state,
            application.pin_code,
            application.applicant_photo
          ]);
        }
      } catch (stuErr) {
        // Students table might have different schema or constraints, don't fail application status update
        console.warn("Student creation note:", stuErr);
      }
    }

    await client.query('COMMIT');

    // Invalidate Redis caches
    await delCachePattern('master:apps*');
    await delCachePattern('master:students*');

    return NextResponse.json(mapApplicationRow(application));
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("PATCH /api/applications/[id] error:", error);
    return NextResponse.json({ error: "Failed to update application", details: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await query(`DELETE FROM applications WHERE id = $1`, [id]);
    await delCachePattern('master:apps*');
    return NextResponse.json({ success: true, message: "Application deleted" });
  } catch (error: any) {
    console.error("DELETE /api/applications/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete application", details: error.message }, { status: 500 });
  }
}
