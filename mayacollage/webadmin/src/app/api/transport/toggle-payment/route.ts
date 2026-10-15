import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { delCache, delCachePattern } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { busId, studentId, markPaid, paymentMode = 'Cash' } = body;

    if (!busId || !studentId) {
      return NextResponse.json({ message: "Bus ID and Student ID are required" }, { status: 400 });
    }

    const busRes = await pgQuery(`SELECT * FROM buses WHERE id = $1 LIMIT 1`, [busId]);
    if (busRes.rows.length === 0) {
      return NextResponse.json({ message: "Bus not found" }, { status: 404 });
    }
    const bus = busRes.rows[0];

    const currentStudents: any[] = typeof bus.students === 'string' ? JSON.parse(bus.students) : (bus.students || []);
    const studentIdx = currentStudents.findIndex(st => String(st.student) === String(studentId));

    if (studentIdx === -1) {
      return NextResponse.json({ message: "Student is not assigned to this bus" }, { status: 404 });
    }

    const willBePaid = Boolean(markPaid);
    const fare = Number(currentStudents[studentIdx].fare) || 0;
    const txnId = willBePaid ? (currentStudents[studentIdx].transactionId || `TRN-BUS-${Date.now().toString().slice(-6)}`) : null;

    currentStudents[studentIdx].paymentStatus = willBePaid ? 'Paid' : 'Pending';
    currentStudents[studentIdx].paymentDate = willBePaid ? new Date().toISOString() : null;
    currentStudents[studentIdx].transactionId = txnId;

    await pgQuery(`
      UPDATE buses SET
        students = $2,
        updated_at = NOW()
      WHERE id = $1
    `, [busId, JSON.stringify(currentStudents)]);

    // Update student in PostgreSQL
    const stuRes = await pgQuery(`SELECT * FROM students WHERE id = $1 LIMIT 1`, [studentId]);
    if (stuRes.rows.length > 0) {
      const stu = stuRes.rows[0];
      const currentYearNum = Number(stu.course_year) || 1;
      let feesObj: any = typeof stu.fees === 'string' ? JSON.parse(stu.fees) : (stu.fees || {});

      if (feesObj && Array.isArray(feesObj.years)) {
        const yrObj = feesObj.years.find((y: any) => y.year === currentYearNum);
        if (yrObj && Array.isArray(yrObj.components)) {
          const comp = yrObj.components.find((c: any) => (c.category || '').toLowerCase().includes('transport'));
          if (comp) {
            comp.paid = willBePaid ? (Number(comp.amount) || fare) : 0;
          }
        }
      }

      // Recalculate totals
      let totalFee = 0;
      let paidFee = 0;
      let transportPaid = willBePaid ? fare : 0;

      if (feesObj && Array.isArray(feesObj.years)) {
        feesObj.years.forEach((y: any) => {
          let yrGross = 0;
          let yrPaid = 0;
          (y.components || []).forEach((c: any) => {
            yrGross += Number(c.amount) || 0;
            yrPaid += Number(c.paid) || 0;
          });
          const disc = Number(y.discount) || 0;
          totalFee += Math.max(0, yrGross - disc);
          paidFee += yrPaid;
        });
      }

      const feeBalance = Math.max(0, totalFee - paidFee);
      const feeStatus = totalFee > 0 ? (paidFee >= totalFee ? 'paid' : paidFee > 0 ? 'partial' : 'unpaid') : 'unpaid';

      await pgQuery(`
        UPDATE students SET
          fees = $2,
          transport_paid = $3,
          total_fee = $4,
          paid_fee = $5,
          fee_balance = $6,
          fee_status = $7,
          updated_at = NOW()
        WHERE id = $1
      `, [
        studentId,
        JSON.stringify(feesObj),
        transportPaid,
        totalFee,
        paidFee,
        feeBalance,
        feeStatus
      ]);

      // Record transaction if marked Paid
      if (willBePaid && fare > 0) {
        try {
          await pgQuery(`
            INSERT INTO fee_transactions (
              id, transaction_id, student_id, amount, payment_date, payment_method,
              status, category, category_name, academic_year, notes, receipt_number, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, NOW(), $5, 'Completed', 'transport', 'Transport Fee', $6, $7, $8, NOW(), NOW())
          `, [
            `txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            txnId,
            studentId,
            fare,
            paymentMode,
            `Year ${currentYearNum}`,
            `Transport Fee for Bus ${bus.bus_no} (${currentStudents[studentIdx].stopName || 'Route Stop'})`,
            `RCP-TRN-${Date.now().toString().slice(-6)}`
          ]);
        } catch (txnErr) {
          console.warn("Could not record fee transaction:", txnErr);
        }
      }
    }

    // Invalidate caches
    await Promise.all([
      delCachePattern("transport:*"),
      delCache(`student:${studentId}`),
      delCachePattern("students:*"),
      delCache(`fee:student-account:${studentId}`),
      delCache("finance:all-data")
    ]);

    return NextResponse.json({
      success: true,
      message: `Transport fee marked as ${willBePaid ? 'PAID' : 'PENDING'} in database!`,
      paymentStatus: willBePaid ? 'Paid' : 'Pending'
    }, { status: 200 });

  } catch (error: any) {
    console.error("Transport POST Toggle Payment Error (PostgreSQL):", error);
    return NextResponse.json({ message: "Failed to update payment status", error: error.message }, { status: 500 });
  }
}
