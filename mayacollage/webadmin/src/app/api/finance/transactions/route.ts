import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { mapPgTransaction, mapPgTransactions } from "@/lib/financeMapper";
import { mapPgStudent } from "@/lib/studentMapper";
import { getCache, setCache, delCache, delCachePattern, DEFAULT_CACHE_TTL } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString() || 'all';
    const cacheKey = `fee:transactions:${queryString}`;

    // 1. Try Redis cache (30 min TTL)
    const cachedTxns = await getCache(cacheKey);
    if (cachedTxns) {
      return NextResponse.json(cachedTxns, {
        headers: { "X-Cache-Source": "Upstash-Redis" }
      });
    }

    const studentId = searchParams.get("studentId");
    const semester = searchParams.get("semester");
    const academicYear = searchParams.get("academicYear");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "250", 10);

    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (studentId) {
      conditions.push(`t.student_id = $${pIdx++}`);
      params.push(studentId);
    }
    if (semester && semester !== "all") {
      conditions.push(`t.semester = $${pIdx++}`);
      params.push(Number(semester));
    }
    if (academicYear && academicYear !== "all") {
      conditions.push(`t.academic_year = $${pIdx++}`);
      params.push(academicYear);
    }
    if (category && category !== "all") {
      conditions.push(`t.category = $${pIdx++}`);
      params.push(category);
    }
    if (search && search.trim() !== '') {
      conditions.push(`(
        s.first_name ILIKE $${pIdx} OR 
        s.last_name ILIKE $${pIdx} OR 
        s.enrollment_number ILIKE $${pIdx} OR 
        s.admission_number ILIKE $${pIdx} OR 
        t.transaction_id ILIKE $${pIdx} OR 
        t.receipt_number ILIKE $${pIdx}
      )`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit);

    const sql = `
      SELECT 
        t.*,
        s.first_name as student_first_name,
        s.middle_name as student_middle_name,
        s.last_name as student_last_name,
        s.student_id as student_code,
        s.enrollment_number as student_enrollment_number,
        s.admission_number as student_admission_number,
        s.mobile as student_mobile,
        s.email as student_email,
        s.selected_branch as student_branch,
        s.selected_program as student_program,
        c.name as course_name,
        c.code as course_code,
        c.duration as course_duration
      FROM fee_transactions t
      LEFT JOIN students s ON t.student_id = s.id
      LEFT JOIN courses c ON t.course_id = c.id
      ${whereClause}
      ORDER BY t.payment_date DESC, t.created_at DESC
      LIMIT $${pIdx}
    `;

    const res = await pgQuery(sql, params);
    const transactions = mapPgTransactions(res.rows);

    // 2. Cache in Redis for 30 minutes
    await setCache(cacheKey, transactions, DEFAULT_CACHE_TTL);

    return NextResponse.json(transactions, {
      headers: { "X-Cache-Source": "Neon-PostgreSQL" }
    });
  } catch (error: any) {
    console.error("Finance Transactions GET Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      studentId,
      amount,
      paymentDate,
      paymentMethod = "Cash",
      transactionId,
      year = 1,
      category = "tuition",
      categoryName,
      semester = 1,
      academicYear,
      notes,
      collectedBy = "Admin Finance",
      receiptNumber,
      receiptId
    } = body;

    if (!studentId || !amount) {
      return NextResponse.json({ error: "Student ID and amount are required" }, { status: 400 });
    }

    const payNum = Number(amount);
    if (isNaN(payNum) || payNum <= 0) {
      return NextResponse.json({ error: "Valid payment amount is required" }, { status: 400 });
    }

    // 1. Fetch student from PostgreSQL
    const studentRes = await pgQuery('SELECT * FROM students WHERE id = $1', [studentId]);
    if (studentRes.rows.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    const studentRow = studentRes.rows[0];

    let targetCourseId = body.courseId || studentRow.selected_program;
    if (!targetCourseId) {
      const fallbackCourse = await pgQuery('SELECT id FROM courses LIMIT 1');
      if (fallbackCourse.rows.length > 0) targetCourseId = fallbackCourse.rows[0].id;
    }

    const yrNum = Number(year) || 1;
    const catCode = category || 'tuition';

    // 2. Parse & update student's internal fees JSONB
    let feesObj: any = typeof studentRow.fees === 'string' ? JSON.parse(studentRow.fees) : (studentRow.fees || {});
    if (!feesObj || typeof feesObj !== 'object') {
      feesObj = { isConfigured: true, years: [] };
    }
    feesObj.isConfigured = true;
    if (!Array.isArray(feesObj.years)) {
      feesObj.years = [];
    }

    // Ensure the target year exists
    if (!feesObj.years.find((y: any) => y.year === yrNum)) {
      feesObj.years.push({
        year: yrNum,
        tuition: { total: 0, paid: 0 },
        exam:    { total: 0, paid: 0 },
        transport: { total: 0, paid: 0 },
        other:   { total: 0, paid: 0 }
      });
    }

    // Sort years ascending so distribution flows Year 1 → Year 2 → Year 3 …
    feesObj.years.sort((a: any, b: any) => a.year - b.year);

    // ─── Sequential Distribution ────────────────────────────────────────────
    // The payment starts at the specified year/component and fills each
    // component's remaining due in order. Any excess automatically flows to
    // the next component / next year instead of being over-credited to one
    // slot. This fixes the bug where a full-balance payment (e.g. ₹1,18,290)
    // was dumped entirely into Year 1 Tuition while other slots stayed at ₹0.
    // ─────────────────────────────────────────────────────────────────────────
    let remaining = payNum;
    const normalizedCat = (categoryName || catCode).toLowerCase().replace(/[^a-z0-9]/g, '');
    const startYearIdx = feesObj.years.findIndex((y: any) => y.year === yrNum);

    for (let yi = startYearIdx; yi < feesObj.years.length && remaining > 0; yi++) {
      const yr = feesObj.years[yi];

      if (Array.isArray(yr.components) && yr.components.length > 0) {
        // ── Component-based structure ────────────────────────────────────────
        // For the starting year begin at the specified component; for
        // subsequent years start at component index 0.
        let startCI = 0;
        if (yi === startYearIdx) {
          const idx = yr.components.findIndex((c: any) => {
            const cNorm = (c.category || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return cNorm === normalizedCat || cNorm.includes(normalizedCat) || normalizedCat.includes(cNorm);
          });
          if (idx >= 0) startCI = idx;
        }

        for (let ci = startCI; ci < yr.components.length && remaining > 0; ci++) {
          const comp = yr.components[ci];
          const compDue = Math.max(0, (Number(comp.amount) || 0) - (Number(comp.paid) || 0));
          if (compDue > 0) {
            const toApply = Math.min(remaining, compDue);
            comp.paid = (Number(comp.paid) || 0) + toApply;
            remaining -= toApply;
          }
        }
      } else {
        // ── Legacy flat structure (tuition / exam / transport / other) ───────
        // For the starting year try the specified category first, then the rest.
        const standardCats = ['tuition', 'exam', 'transport', 'other'];
        const orderedCats = yi === startYearIdx
          ? [catCode, ...standardCats.filter(c => c !== catCode)]
          : standardCats;

        for (const cat of orderedCats) {
          if (remaining <= 0) break;
          if (!yr[cat]) {
            // Only create the slot when it is the directly targeted category
            if (yi === startYearIdx && cat === catCode) {
              yr[cat] = { total: 0, paid: 0 };
            } else {
              continue;
            }
          }
          const catDue = Math.max(0, (Number(yr[cat].total) || 0) - (Number(yr[cat].paid) || 0));
          if (catDue > 0) {
            const toApply = Math.min(remaining, catDue);
            yr[cat].paid = (Number(yr[cat].paid) || 0) + toApply;
            remaining -= toApply;
          }
        }
      }
    }

    // If any amount still remains after filling all defined dues (edge case:
    // payment slightly exceeds structure, e.g. rounding or unconfigured years),
    // credit the remainder to the originally targeted year/category so the
    // payment is never silently lost.
    if (remaining > 0) {
      const targetYr = feesObj.years.find((y: any) => y.year === yrNum);
      if (targetYr) {
        if (Array.isArray(targetYr.components) && targetYr.components.length > 0) {
          const comp =
            targetYr.components.find((c: any) => {
              const cNorm = (c.category || '').toLowerCase().replace(/[^a-z0-9]/g, '');
              return cNorm === normalizedCat || cNorm.includes(normalizedCat) || normalizedCat.includes(cNorm);
            }) || targetYr.components[0];
          if (comp) comp.paid = (Number(comp.paid) || 0) + remaining;
        } else {
          const fallbackCat = ['tuition', 'exam', 'transport', 'other'].includes(catCode) ? catCode : 'other';
          if (!targetYr[fallbackCat]) targetYr[fallbackCat] = { total: 0, paid: 0 };
          targetYr[fallbackCat].paid = (Number(targetYr[fallbackCat].paid) || 0) + remaining;
          if ((Number(targetYr[fallbackCat].total) || 0) < targetYr[fallbackCat].paid) {
            targetYr[fallbackCat].total = targetYr[fallbackCat].paid;
          }
        }
      }
    }

    // Calculate new total and paid fee for the student
    let newTotalFee = 0;
    let newPaidFee = 0;
    feesObj.years.forEach((y: any) => {
      let yGross = 0;
      let yPaid = 0;
      if (Array.isArray(y.components) && y.components.length > 0) {
        y.components.forEach((c: any) => {
          yGross += Number(c.amount) || 0;
          yPaid += Number(c.paid) || 0;
        });
      } else {
        yGross = (Number(y.tuition?.total) || 0) + (Number(y.exam?.total) || 0) + (Number(y.transport?.total) || 0) + (Number(y.other?.total) || 0);
        yPaid = (Number(y.tuition?.paid) || 0) + (Number(y.exam?.paid) || 0) + (Number(y.transport?.paid) || 0) + (Number(y.other?.paid) || 0);
      }
      const yDisc = Number(y.discount) || 0;
      newTotalFee += Math.max(0, yGross - yDisc);
      newPaidFee += yPaid;
    });

    const newBalance = Math.max(0, newTotalFee - newPaidFee);
    const newStatus = newPaidFee >= newTotalFee && newTotalFee > 0 ? 'paid' : (newPaidFee > 0 ? 'partial' : 'unpaid');

    // 3. Determine unique receipt number and transaction ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const manualReceipt = (typeof receiptNumber === 'string' && receiptNumber.trim()) 
      || (typeof receiptId === 'string' && receiptId.trim()) 
      || "";
    const finalReceiptNo = manualReceipt !== "" ? manualReceipt : `RCP-STU-${dateStr}-${randomSuffix}`;
    const txnId = transactionId && transactionId.trim() !== ""
      ? transactionId.trim()
      : `TXN-${Date.now()}-${randomSuffix}`;

    // Verify receipt number uniqueness if custom
    if (manualReceipt !== "") {
      const existing = await pgQuery('SELECT id FROM fee_transactions WHERE receipt_number = $1', [finalReceiptNo]);
      if (existing.rows.length > 0) {
        return NextResponse.json(
          { error: `Receipt ID "${finalReceiptNo}" is already in use. Please enter a unique Receipt ID.` },
          { status: 400 }
        );
      }
    }

    const txnUUID = `txn_${Date.now()}_${randomSuffix}`;

    // 4. Insert transaction into PostgreSQL
    const insertTxnRes = await pgQuery(`
      INSERT INTO fee_transactions (
        id, student_id, course_id, receipt_number, amount, category, category_name,
        breakup, payment_date, payment_method, transaction_id, status, semester,
        academic_year, notes, collected_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *
    `, [
      txnUUID,
      studentId,
      targetCourseId,
      finalReceiptNo,
      payNum,
      catCode,
      categoryName || catCode.toUpperCase(),
      JSON.stringify(body.breakup || []),
      paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod || 'Cash',
      txnId,
      'Completed',
      Number(semester) || 1,
      academicYear || `Year ${yrNum}`,
      notes || '',
      collectedBy
    ]);

    // 5. Update student in PostgreSQL
    const updateStudentRes = await pgQuery(`
      UPDATE students
      SET fees = $2,
          total_fee = $3,
          paid_fee = $4,
          fee_balance = $5,
          fee_status = $6,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [
      studentId,
      JSON.stringify(feesObj),
      newTotalFee,
      newPaidFee,
      newBalance,
      newStatus
    ]);

    const updatedStudent = mapPgStudent(updateStudentRes.rows[0]);

    // 6. Query populated transaction details
    const populatedRes = await pgQuery(`
      SELECT 
        t.*,
        s.first_name as student_first_name,
        s.middle_name as student_middle_name,
        s.last_name as student_last_name,
        s.student_id as student_code,
        s.enrollment_number as student_enrollment_number,
        s.admission_number as student_admission_number,
        s.mobile as student_mobile,
        s.email as student_email,
        s.selected_branch as student_branch,
        s.selected_program as student_program,
        c.name as course_name,
        c.code as course_code,
        c.duration as course_duration
      FROM fee_transactions t
      LEFT JOIN students s ON t.student_id = s.id
      LEFT JOIN courses c ON t.course_id = c.id
      WHERE t.id = $1
    `, [txnUUID]);

    const populatedTxn = mapPgTransaction(populatedRes.rows[0] || insertTxnRes.rows[0]);

    // 7. Invalidate all affected Redis caches
    await Promise.all([
      delCache(`student:${studentId}`),
      delCache(`fee:student-account:${studentId}`),
      delCache("fee:bundle:master"),
      delCachePattern("fee:transactions:*"),
      delCachePattern("fee:student-accounts:*"),
      delCachePattern("students:list:*"),
      delCachePattern("fee:receipts:*"),
      delCachePattern("fee:alerts:*"),
      delCache("fee:stats")
    ]);

    return NextResponse.json({
      success: true,
      message: "Fee payment recorded & Receipt generated successfully",
      student: updatedStudent,
      transaction: populatedTxn,
      receiptNumber: finalReceiptNo
    });

  } catch (error: any) {
    console.error("POST /api/finance/transactions error:", error);
    return NextResponse.json({ error: error.message || "Failed to record transaction" }, { status: 500 });
  }
}
