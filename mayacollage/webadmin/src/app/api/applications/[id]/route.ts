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

    await client.query('BEGIN');

    // 1. Fetch current application first
    const curAppRes = await client.query('SELECT * FROM applications WHERE id = $1', [id]);
    if (curAppRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    const currentApp = curAppRes.rows[0];

    // Determine updated values
    const newStatus = body.status || currentApp.status;
    const studentId = body.studentId || currentApp.student_id || `STU${Date.now()}`;
    const admNo = body.admissionNumber || currentApp.admission_number || `ADM${Date.now()}`;
    const selectedProgram = body.selectedProgram || currentApp.selected_program;
    const selectedBranch = body.selectedBranch || currentApp.selected_branch;
    const sessionYear = body.sessionYear || currentApp.session_year || '2024-2025';
    const batch = body.batch || `${(sessionYear || '2024').split('-')[0]}-${Number((sessionYear || '2024').split('-')[0]) + 4}`;
    const selectedSemester = Number(body.selectedSemester) || 1;
    const selectedSection = body.selectedSection || 'A';
    const feesYears = Array.isArray(body.feesYears) ? body.feesYears : [];

    // Resolve Course Details from DB
    let courseName = body.courseName || '';
    let courseDuration = Number(body.courseDuration) || 4;
    let branchName = body.branchName || '';

    if (selectedProgram) {
      try {
        const crsRes = await client.query(`
          SELECT c.*, b.name as b_name 
          FROM courses c 
          LEFT JOIN branches b ON c.branch_id = b.id 
          WHERE c.id = $1 OR c.name ILIKE $1 
          LIMIT 1
        `, [selectedProgram]);
        if (crsRes.rows.length > 0) {
          courseName = crsRes.rows[0].name;
          courseDuration = Number(crsRes.rows[0].duration) || 4;
          if (!branchName && crsRes.rows[0].b_name) {
            branchName = crsRes.rows[0].b_name;
          }
        } else if (!courseName) {
          courseName = selectedProgram;
        }
      } catch (_) {
        if (!courseName) courseName = selectedProgram;
      }
    }

    if (selectedBranch && !branchName) {
      try {
        const brRes = await client.query(`SELECT name FROM branches WHERE id = $1 OR name ILIKE $1 LIMIT 1`, [selectedBranch]);
        if (brRes.rows.length > 0) {
          branchName = brRes.rows[0].name;
        } else {
          branchName = selectedBranch;
        }
      } catch (_) {
        branchName = selectedBranch;
      }
    }

    // 2. Update application table
    const appRes = await client.query(`
      UPDATE applications
      SET 
        status = $1,
        student_id = $2,
        admission_number = $3,
        selected_program = $4,
        selected_branch = $5,
        session_year = $6,
        updated_at = NOW()
      WHERE id = $7
      RETURNING *;
    `, [newStatus, studentId, admNo, selectedProgram, selectedBranch, sessionYear, id]);

    const application = appRes.rows[0];

    // Compute fees structure
    let totalFee = 0;
    let tuitionFee = 0;
    let examFee = 0;
    let transportFee = 0;
    let otherFee = 0;

    feesYears.forEach((yr: any) => {
      const t = Number(yr.tuition) || 0;
      const e = Number(yr.exam) || 0;
      const tr = Number(yr.transport) || 0;
      const o = Number(yr.other) || 0;
      tuitionFee += t;
      examFee += e;
      transportFee += tr;
      otherFee += o;
      totalFee += (t + e + tr + o);
    });

    const feesObj = {
      isConfigured: feesYears.length > 0,
      grandTotal: totalFee,
      totalPaid: 0,
      years: feesYears.map((yr: any) => ({
        year: Number(yr.year) || 1,
        yearTotal: (Number(yr.tuition) || 0) + (Number(yr.exam) || 0) + (Number(yr.transport) || 0) + (Number(yr.other) || 0),
        yearPaid: 0,
        tuition: { total: Number(yr.tuition) || 0, paid: 0 },
        exam: { total: Number(yr.exam) || 0, paid: 0 },
        transport: { total: Number(yr.transport) || 0, paid: 0 },
        other: { total: Number(yr.other) || 0, paid: 0 }
      }))
    };

    // If status is Approved or Accepted (or updating existing student), create/update student
    if (newStatus === "Approved" || newStatus === "Accepted") {
      const stuCheck = await client.query(`
        SELECT id, paid_fee FROM students WHERE application_id = $1 OR email = $2 LIMIT 1
      `, [id, application.email]);

      const pwd = application.dob ? application.dob.replace(/-/g, '') : "password123";

      if (stuCheck.rows.length > 0) {
        // Update existing student with updated course, branch, fees, batch
        const existingStudentId = stuCheck.rows[0].id;
        const currentPaid = Number(stuCheck.rows[0].paid_fee) || 0;
        const feeBalance = Math.max(0, totalFee - currentPaid);
        const feeStatus = totalFee > 0 ? (currentPaid >= totalFee ? 'paid' : currentPaid > 0 ? 'partial' : 'unpaid') : 'unpaid';

        await client.query(`
          UPDATE students
          SET
            selected_branch = $1,
            branch_name = $2,
            selected_program = $3,
            course_name = $4,
            course_duration = $5,
            session_year = $6,
            batch = $7,
            selected_semester = $8,
            selected_section = $9,
            student_id = COALESCE($10, student_id),
            admission_number = COALESCE($11, admission_number),
            fees = $12,
            total_fee = $13,
            fee_balance = $14,
            fee_status = $15,
            tuition_fee = $16,
            exam_fee = $17,
            transport_fee = $18,
            other_fee = $19,
            updated_at = NOW()
          WHERE id = $20;
        `, [
          selectedBranch,
          branchName,
          selectedProgram,
          courseName,
          courseDuration,
          sessionYear,
          batch,
          selectedSemester,
          selectedSection,
          studentId,
          admNo,
          JSON.stringify(feesObj),
          totalFee,
          feeBalance,
          feeStatus,
          tuitionFee,
          examFee,
          transportFee,
          otherFee,
          existingStudentId
        ]);
      } else {
        // Insert new student into PostgreSQL students table
        const newStuId = `stu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const feeBalance = totalFee;
        const feeStatus = totalFee > 0 ? 'unpaid' : 'unpaid';

        await client.query(`
          INSERT INTO students (
            id, application_id, student_id, admission_number, password,
            first_name, last_name, dob, gender, email, mobile,
            address, city, state, pin_code, applicant_photo,
            selected_branch, branch_name, selected_program, course_name, course_duration,
            selected_semester, selected_section, session_year, batch, course_year,
            fees, total_fee, paid_fee, fee_balance, fee_status,
            tuition_fee, tuition_paid, exam_fee, exam_paid,
            transport_fee, transport_paid, other_fee, other_paid,
            status, student_status, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21,
            $22, $23, $24, $25, 1,
            $26, $27, 0, $28, $29,
            $30, 0, $31, 0,
            $32, 0, $33, 0,
            'Active', 'Active', NOW(), NOW()
          );
        `, [
          newStuId,
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
          application.applicant_photo,
          selectedBranch,
          branchName,
          selectedProgram,
          courseName,
          courseDuration,
          selectedSemester,
          selectedSection,
          sessionYear,
          batch,
          JSON.stringify(feesObj),
          totalFee,
          feeBalance,
          feeStatus,
          tuitionFee,
          examFee,
          transportFee,
          otherFee
        ]);
      }

      // 3. Dual-sync to MongoDB Student model
      try {
        const connectToDatabase = (await import('@/lib/mongodb')).default;
        const { Student } = await import('@/models/Student');
        await connectToDatabase();
        await Student.findOneAndUpdate(
          { $or: [{ email: application.email }, { studentId: studentId }, { admissionNumber: admNo }] },
          {
            firstName: application.first_name,
            lastName: application.last_name,
            dob: application.dob,
            gender: application.gender,
            email: application.email,
            mobile: application.mobile,
            address: application.address,
            city: application.city,
            state: application.state,
            pinCode: application.pin_code,
            studentId: studentId,
            admissionNumber: admNo,
            password: pwd,
            selectedBranch: selectedBranch,
            selectedProgram: selectedProgram,
            sessionYear: sessionYear,
            batch: batch,
            selectedSemester: selectedSemester,
            selectedSection: selectedSection,
            fees: feesObj,
            applicantPhoto: application.applicant_photo,
            status: 'Active'
          },
          { upsert: true, new: true }
        );
      } catch (mongoErr) {
        console.warn("MongoDB student sync warning:", mongoErr);
      }
    }

    await client.query('COMMIT');

    // Invalidate Redis caches
    await delCachePattern('master:apps*');
    await delCachePattern('master:students*');
    await delCachePattern('students:list*');
    await delCachePattern('master:courses*');

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
