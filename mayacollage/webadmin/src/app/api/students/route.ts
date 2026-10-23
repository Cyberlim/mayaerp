import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { mapPgStudents, mapPgStudent } from "@/lib/studentMapper";
import { getCache, setCache, delCachePattern, DEFAULT_CACHE_TTL } from "@/lib/redis";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bustCache = searchParams.get("refresh") === "true" || searchParams.get("bust") === "true";
    
    // Create query key without bust parameter
    const cacheSearchParams = new URLSearchParams(searchParams);
    cacheSearchParams.delete("refresh");
    cacheSearchParams.delete("bust");
    const queryString = cacheSearchParams.toString() || 'all';
    const cacheKey = `students:list:${queryString}`;

    // 1. Check Upstash Redis cache (unless manual bust requested)
    if (!bustCache) {
      const cachedStudents = await getCache(cacheKey);
      if (cachedStudents) {
        return NextResponse.json(cachedStudents, {
          headers: {
            'X-Cache-Source': 'Upstash-Redis',
            'X-Database': 'Neon-PostgreSQL'
          }
        });
      }
    }

    const selectedProgram = searchParams.get("selectedProgram");
    const selectedBranch = searchParams.get("selectedBranch");
    const batch = searchParams.get("batch");
    const courseYear = searchParams.get("courseYear");
    const selectedSemester = searchParams.get("selectedSemester");
    const selectedSection = searchParams.get("selectedSection");
    const sessionYear = searchParams.get("sessionYear");
    const feeStatus = searchParams.get("feeStatus");
    const search = searchParams.get("search");
    const countOnly = searchParams.get("countOnly") === "true";

    // Build dynamic SQL query for PostgreSQL
    const whereClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (selectedProgram) {
      whereClauses.push(`selected_program = $${paramIndex++}`);
      values.push(selectedProgram);
    }

    if (selectedBranch) {
      whereClauses.push(`selected_branch = $${paramIndex++}`);
      values.push(selectedBranch);
    }

    if (batch) {
      whereClauses.push(`batch = $${paramIndex++}`);
      values.push(batch);
    }

    if (sessionYear) {
      whereClauses.push(`(session_year ILIKE $${paramIndex} OR batch = $${paramIndex})`);
      paramIndex++;
      values.push(`%${sessionYear}%`);
    }

    if (courseYear) {
      whereClauses.push(`course_year = $${paramIndex++}`);
      values.push(Number(courseYear));
    }

    if (selectedSemester) {
      whereClauses.push(`selected_semester = $${paramIndex++}`);
      values.push(Number(selectedSemester));
    }

    if (selectedSection) {
      whereClauses.push(`selected_section = $${paramIndex++}`);
      values.push(selectedSection);
    }

    if (feeStatus && feeStatus !== 'all') {
      whereClauses.push(`fee_status = $${paramIndex++}`);
      values.push(feeStatus);
    }

    if (search) {
      whereClauses.push(`(
        first_name ILIKE $${paramIndex} OR
        last_name ILIKE $${paramIndex} OR
        student_id ILIKE $${paramIndex} OR
        admission_number ILIKE $${paramIndex} OR
        email ILIKE $${paramIndex}
      )`);
      paramIndex++;
      values.push(`%${search.trim()}%`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    if (countOnly) {
      const countRes = await pgQuery(`SELECT COUNT(*) FROM students ${whereSQL}`, values);
      const count = Number(countRes.rows[0]?.count) || 0;
      return NextResponse.json({ count });
    }

    // Self-healing migration for legacy records where father's name was placed in middle_name
    try {
      await pgQuery(`
        UPDATE students
        SET father_name = TRIM(middle_name),
            middle_name = '',
            last_name = CASE WHEN LOWER(TRIM(last_name)) = 'student' THEN '' ELSE last_name END,
            updated_at = NOW()
        WHERE (father_name IS NULL OR TRIM(father_name) = '')
          AND middle_name IS NOT NULL
          AND TRIM(middle_name) != '';
      `);
      await pgQuery(`
        UPDATE students
        SET last_name = ''
        WHERE LOWER(TRIM(last_name)) = 'student';
      `);
    } catch (_) {}

    const sql = `
      SELECT 
        id, enrollment_number, admission_number, student_id, first_name, middle_name, last_name,
        dob, gender, email, mobile, parent_mobile, alternate_mobile, address, city, state, pin_code,
        aadhar_number, religion, entry_type, selected_branch, branch_name, selected_program, course_name,
        course_duration, selected_semester, selected_section, session_year, admission_year, batch, course_year,
        fees, total_fee, paid_fee, fee_balance, fee_status, tuition_fee, tuition_paid, exam_fee, exam_paid,
        transport_fee, transport_paid, other_fee, other_paid, documents, status, student_status, created_at, updated_at,
        father_name, mother_name, caste_category, pan_number, grn_number, admission_form_date, enrollment_date, caste_certificate_number
      FROM students
      ${whereSQL}
      ORDER BY created_at DESC
    `;

    const res = await pgQuery(sql, values);
    const students = mapPgStudents(res.rows);

    // 2. Store in L1 RAM + L2 Redis cache with 30 minutes TTL
    await setCache(cacheKey, students, DEFAULT_CACHE_TTL);

    return NextResponse.json(students, {
      headers: {
        'X-Cache-Source': 'Neon-PostgreSQL-Warmed',
        'X-Database': 'Neon-PostgreSQL'
      }
    });
  } catch (error: any) {
    console.error("GET /api/students error (PostgreSQL):", error);
    return NextResponse.json({ error: error.message || "Failed to fetch students from PostgreSQL" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const studentId = body.studentId || `STU-${Date.now().toString().slice(-6)}`;

    // 1. Check existing in PostgreSQL
    const existing = await pgQuery('SELECT id FROM students WHERE student_id = $1 OR admission_number = $2', [
      studentId,
      body.admissionNumber || null
    ]);

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Student ID or Admission Number already exists" }, { status: 400 });
    }

    const id = body._id || body.id || crypto.randomBytes(12).toString('hex');
    const fees = body.fees || { isConfigured: false, years: [] };

    // Calculate fee totals
    let totalFee = 0;
    let paidFee = 0;
    let tuitionFee = 0;
    let tuitionPaid = 0;
    let examFee = 0;
    let examPaid = 0;
    let transportFee = 0;
    let transportPaid = 0;
    let otherFee = 0;
    let otherPaid = 0;

    if (Array.isArray(fees.years)) {
      fees.years.forEach((yr: any) => {
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
        totalFee += (tTot + eTot + trTot + oTot);
        paidFee += (tPd + ePd + trPd + oPd);
      });
    }

    const feeBalance = Math.max(0, totalFee - paidFee);
    const feeStatus = totalFee > 0 ? (paidFee >= totalFee ? 'paid' : paidFee > 0 ? 'partial' : 'unpaid') : 'unpaid';

    // 2. Insert into PostgreSQL
    const fatherName = body.fatherName || body.documents?.fatherName || null;
    const motherName = body.motherName || body.documents?.motherName || null;
    const casteCategory = body.casteCategory || body.category || body.documents?.casteCategory || null;
    const panNumber = body.panNumber || body.documents?.panNumber || null;
    const grnNumber = body.grnNumber || body.documents?.grnNumber || null;
    const admissionFormDate = body.admissionFormDate || body.documents?.admissionFormDate || null;
    const enrollmentDate = body.enrollmentDate || body.documents?.enrollmentDate || null;
    const casteCertificateNumber = body.casteCertificateNumber || body.documents?.casteCertificateNumber || null;

    const mergedDocs = {
      ...(body.documents || {}),
      fatherName: fatherName || body.documents?.fatherName || '',
      motherName: motherName || body.documents?.motherName || '',
      casteCategory: casteCategory || body.documents?.casteCategory || '',
      panNumber: panNumber || body.documents?.panNumber || '',
      grnNumber: grnNumber || body.documents?.grnNumber || '',
      admissionFormDate: admissionFormDate || body.documents?.admissionFormDate || '',
      enrollmentDate: enrollmentDate || body.documents?.enrollmentDate || '',
      casteCertificateNumber: casteCertificateNumber || body.documents?.casteCertificateNumber || ''
    };

    const insertSQL = `
      INSERT INTO students (
        id, enrollment_number, admission_number, student_id, password, library_pin,
        first_name, middle_name, last_name, dob, gender, email, mobile,
        parent_mobile, alternate_mobile, address, city, state, pin_code,
        aadhar_number, religion, entry_type, selected_branch, branch_name,
        selected_program, course_name, course_duration, selected_semester,
        selected_section, session_year, admission_year, batch, course_year,
        fees, total_fee, paid_fee, fee_balance, fee_status,
        tuition_fee, tuition_paid, exam_fee, exam_paid, transport_fee, transport_paid, other_fee, other_paid,
        documents, status, student_status,
        father_name, mother_name, caste_category, pan_number, grn_number,
        admission_form_date, enrollment_date, caste_certificate_number,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
        $41, $42, $43, $44, $45, $46, $47, $48, $49,
        $50, $51, $52, $53, $54, $55, $56, $57,
        NOW(), NOW()
      )
      RETURNING *
    `;

    const insertRes = await pgQuery(insertSQL, [
      id,
      body.enrollmentNumber || null,
      body.admissionNumber || null,
      studentId,
      body.password || '$2b$10$defaultPasswordHash1234567890',
      body.libraryPin || null,
      body.firstName || '',
      body.middleName || null,
      body.lastName || '',
      body.dob || null,
      body.gender || 'Male',
      body.email || null,
      body.mobile || body.phone || '',
      body.parentMobile || null,
      body.alternateMobile || null,
      body.address || null,
      body.city || null,
      body.state || null,
      body.pinCode || null,
      body.aadharNumber || null,
      body.religion || null,
      body.entryType || 'Direct',
      body.selectedBranch || null,
      body.branchName || null,
      body.selectedProgram || null,
      body.courseName || null,
      Number(body.courseDuration) || 4,
      Number(body.selectedSemester) || 1,
      body.selectedSection || null,
      body.sessionYear || null,
      body.admissionYear || null,
      body.batch || null,
      Number(body.courseYear) || 1,
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
      JSON.stringify(mergedDocs),
      body.status || 'Approved',
      body.studentStatus || 'Active',
      fatherName,
      motherName,
      casteCategory,
      panNumber,
      grnNumber,
      admissionFormDate,
      enrollmentDate,
      casteCertificateNumber
    ]);

    const createdStudent = mapPgStudent(insertRes.rows[0]);

    // 3. Invalidate Redis Caches and cache new student
    await Promise.all([
      setCache(`student:${id}`, createdStudent, DEFAULT_CACHE_TTL),
      delCachePattern("students:*"),
      delCachePattern("fee:student-accounts:*"),
      delCachePattern("fee:alerts:*")
    ]);

    return NextResponse.json(createdStudent, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/students error (PostgreSQL):", error);
    return NextResponse.json({ error: error.message || "Failed to create student in PostgreSQL" }, { status: 500 });
  }
}
