import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { mapPgStudent } from "@/lib/studentMapper";
import { getCache, setCache, delCache, delCachePattern, DEFAULT_CACHE_TTL } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const bustCache = searchParams.get("refresh") === "true" || searchParams.get("bust") === "true";
    const cacheKey = `student:${id}`;

    // 1. Try serving from Redis cache (unless bust requested)
    if (!bustCache) {
      const cachedStudent = await getCache(cacheKey);
      if (cachedStudent) {
        return NextResponse.json(cachedStudent, {
          headers: {
            'X-Cache-Source': 'Upstash-Redis',
            'X-Database': 'Neon-PostgreSQL'
          }
        });
      }
    }

    // 2. Query PostgreSQL
    const res = await pgQuery(
      `SELECT * FROM students WHERE id = $1 OR student_id = $1 OR admission_number = $1 LIMIT 1`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Student not found in PostgreSQL" }, { status: 404 });
    }

    const student = mapPgStudent(res.rows[0]);

    // 3. Cache student profile in Redis
    await setCache(cacheKey, student, DEFAULT_CACHE_TTL);

    return NextResponse.json(student, {
      headers: {
        'X-Cache-Source': 'Neon-PostgreSQL-Miss',
        'X-Database': 'Neon-PostgreSQL'
      }
    });
  } catch (error: any) {
    console.error("GET /api/students/[id] error (PostgreSQL):", error);
    return NextResponse.json({ error: error.message || "Failed to fetch student details" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 1. Check existing student in PostgreSQL
    const checkRes = await pgQuery('SELECT * FROM students WHERE id = $1 LIMIT 1', [id]);
    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: "Student not found in PostgreSQL" }, { status: 404 });
    }
    const current = checkRes.rows[0];

    // Compute fee totals if fees updated
    const fees = body.fees !== undefined ? body.fees : current.fees;
    let totalFee = Number(current.total_fee) || 0;
    let paidFee = Number(current.paid_fee) || 0;
    let tuitionFee = Number(current.tuition_fee) || 0;
    let tuitionPaid = Number(current.tuition_paid) || 0;
    let examFee = Number(current.exam_fee) || 0;
    let examPaid = Number(current.exam_paid) || 0;
    let transportFee = Number(current.transport_fee) || 0;
    let transportPaid = Number(current.transport_paid) || 0;
    let otherFee = Number(current.other_fee) || 0;
    let otherPaid = Number(current.other_paid) || 0;

    if (body.fees) {
      totalFee = 0;
      paidFee = 0;
      tuitionFee = 0;
      tuitionPaid = 0;
      examFee = 0;
      examPaid = 0;
      transportFee = 0;
      transportPaid = 0;
      otherFee = 0;
      otherPaid = 0;

      if (Array.isArray(body.fees.years)) {
        body.fees.years.forEach((yr: any) => {
          let yrGross = 0;
          let yrPaid = 0;

          if (Array.isArray(yr.components) && yr.components.length > 0) {
            yr.components.forEach((c: any) => {
              const amt = Number(c.amount) || 0;
              const pd = Number(c.paid) || 0;
              const catLower = (c.category || "").toLowerCase();

              if (catLower.includes("tuition")) {
                tuitionFee += amt;
                tuitionPaid += pd;
              } else if (catLower.includes("exam")) {
                examFee += amt;
                examPaid += pd;
              } else if (catLower.includes("transport") || catLower.includes("bus")) {
                transportFee += amt;
                transportPaid += pd;
              } else {
                otherFee += amt;
                otherPaid += pd;
              }

              yrGross += amt;
              yrPaid += pd;
            });
          } else {
            const tTot = Number(yr.tuition?.total) || 0;
            const tPd = Number(yr.tuition?.paid) || 0;
            const eTot = Number(yr.exam?.total) || 0;
            const ePd = Number(yr.exam?.paid) || 0;
            const trTot = Number(yr.transport?.total) || 0;
            const trPd = Number(yr.transport?.paid) || 0;
            const oTot = Number(yr.other?.total) || 0;
            const oPd = Number(yr.other?.paid) || 0;

            tuitionFee += tTot;
            tuitionPaid += tPd;
            examFee += eTot;
            examPaid += ePd;
            transportFee += trTot;
            transportPaid += trPd;
            otherFee += oTot;
            otherPaid += oPd;

            yrGross = tTot + eTot + trTot + oTot;
            yrPaid = tPd + ePd + trPd + oPd;
          }

          const yrDiscount = Number(yr.discount) || 0;
          totalFee += Math.max(0, yrGross - yrDiscount);
          paidFee += yrPaid;
        });
      }
    }

    const feeBalance = Math.max(0, totalFee - paidFee);
    const feeStatus = totalFee > 0 ? (paidFee >= totalFee ? 'paid' : paidFee > 0 ? 'partial' : 'unpaid') : 'unpaid';

    // 2. Update PostgreSQL
    const updateSQL = `
      UPDATE students SET
        first_name = COALESCE($2, first_name),
        middle_name = COALESCE($3, middle_name),
        last_name = COALESCE($4, last_name),
        dob = COALESCE($5, dob),
        gender = COALESCE($6, gender),
        email = COALESCE($7, email),
        mobile = COALESCE($8, mobile),
        parent_mobile = COALESCE($9, parent_mobile),
        alternate_mobile = COALESCE($10, alternate_mobile),
        address = COALESCE($11, address),
        city = COALESCE($12, city),
        state = COALESCE($13, state),
        pin_code = COALESCE($14, pin_code),
        aadhar_number = COALESCE($15, aadhar_number),
        religion = COALESCE($16, religion),
        entry_type = COALESCE($17, entry_type),
        selected_branch = COALESCE($18, selected_branch),
        branch_name = COALESCE($19, branch_name),
        selected_program = COALESCE($20, selected_program),
        course_name = COALESCE($21, course_name),
        selected_semester = COALESCE($22, selected_semester),
        selected_section = COALESCE($23, selected_section),
        session_year = COALESCE($24, session_year),
        admission_year = COALESCE($25, admission_year),
        batch = COALESCE($26, batch),
        course_year = COALESCE($27, course_year),
        fees = $28,
        total_fee = $29,
        paid_fee = $30,
        fee_balance = $31,
        fee_status = $32,
        tuition_fee = $33,
        tuition_paid = $34,
        exam_fee = $35,
        exam_paid = $36,
        transport_fee = $37,
        transport_paid = $38,
        other_fee = $39,
        other_paid = $40,
        documents = COALESCE($41, documents),
        status = COALESCE($42, status),
        student_status = COALESCE($43, student_status),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const updateRes = await pgQuery(updateSQL, [
      id,
      body.firstName !== undefined ? body.firstName : null,
      body.middleName !== undefined ? body.middleName : null,
      body.lastName !== undefined ? body.lastName : null,
      body.dob !== undefined ? body.dob : null,
      body.gender !== undefined ? body.gender : null,
      body.email !== undefined ? body.email : null,
      body.mobile !== undefined ? body.mobile : (body.phone !== undefined ? body.phone : null),
      body.parentMobile !== undefined ? body.parentMobile : null,
      body.alternateMobile !== undefined ? body.alternateMobile : null,
      body.address !== undefined ? body.address : null,
      body.city !== undefined ? body.city : null,
      body.state !== undefined ? body.state : null,
      body.pinCode !== undefined ? body.pinCode : null,
      body.aadharNumber !== undefined ? body.aadharNumber : null,
      body.religion !== undefined ? body.religion : null,
      body.entryType !== undefined ? body.entryType : null,
      body.selectedBranch !== undefined ? body.selectedBranch : null,
      body.branchName !== undefined ? body.branchName : null,
      body.selectedProgram !== undefined ? body.selectedProgram : null,
      body.courseName !== undefined ? body.courseName : null,
      body.selectedSemester !== undefined ? Number(body.selectedSemester) : null,
      body.selectedSection !== undefined ? body.selectedSection : null,
      body.sessionYear !== undefined ? body.sessionYear : null,
      body.admissionYear !== undefined ? body.admissionYear : null,
      body.batch !== undefined ? body.batch : null,
      body.courseYear !== undefined ? Number(body.courseYear) : null,
      JSON.stringify(fees),
      totalFee,
      paidFee,
      feeBalance,
      feeStatus,
      tuitionFee,
      tuitionPaid,
      examFee,
      examPaid,
      transportFee,
      transportPaid,
      otherFee,
      otherPaid,
      body.documents ? JSON.stringify(body.documents) : null,
      body.status !== undefined ? body.status : null,
      body.studentStatus !== undefined ? body.studentStatus : null
    ]);

    const updatedStudent = mapPgStudent(updateRes.rows[0]);

    // 3. Update Redis cache & invalidate related caches immediately
    const cacheKey = `student:${id}`;
    await Promise.all([
      setCache(cacheKey, updatedStudent, DEFAULT_CACHE_TTL),
      delCachePattern("students:*"),
      delCache(`fee:student-account:${id}`),
      delCache("finance:all-data"),
      delCachePattern("fee:student-accounts:*"),
      delCachePattern("fee:alerts:*")
    ]);

    return NextResponse.json(updatedStudent);
  } catch (error: any) {
    console.error("PUT /api/students/[id] error (PostgreSQL):", error);
    return NextResponse.json({ error: error.message || "Failed to update student in PostgreSQL" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Delete in PostgreSQL
    const delRes = await pgQuery('DELETE FROM students WHERE id = $1 RETURNING id', [id]);
    if (delRes.rows.length === 0) {
      return NextResponse.json({ error: "Student not found in PostgreSQL" }, { status: 404 });
    }

    // 2. Invalidate Redis Caches
    await Promise.all([
      delCache(`student:${id}`),
      delCachePattern("students:*"),
      delCache(`fee:student-account:${id}`),
      delCachePattern("fee:student-accounts:*"),
      delCachePattern("fee:transactions:*"),
      delCachePattern("fee:alerts:*")
    ]);

    return NextResponse.json({ success: true, message: "Student deleted successfully from PostgreSQL" });
  } catch (error: any) {
    console.error("DELETE /api/students/[id] error (PostgreSQL):", error);
    return NextResponse.json({ error: error.message || "Failed to delete student from PostgreSQL" }, { status: 500 });
  }
}
