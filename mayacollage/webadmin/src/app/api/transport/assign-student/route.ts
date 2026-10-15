import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { delCache, delCachePattern } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { busId, studentId, stopName, customFare, paymentStatus = 'Pending' } = body;

    if (!busId || !studentId) {
      return NextResponse.json({ message: 'Bus ID and Student ID are required' }, { status: 400 });
    }

    // 1. Get bus from PostgreSQL
    const busRes = await pgQuery(`SELECT * FROM buses WHERE id = $1 LIMIT 1`, [busId]);
    if (busRes.rows.length === 0) {
      return NextResponse.json({ message: 'Bus not found' }, { status: 404 });
    }
    const bus = busRes.rows[0];

    const currentStudents: any[] = typeof bus.students === 'string' ? JSON.parse(bus.students) : (bus.students || []);
    const stops: any[] = typeof bus.stops === 'string' ? JSON.parse(bus.stops) : (bus.stops || []);
    const capacity = Number(bus.capacity) || 40;

    if (currentStudents.length >= capacity) {
      return NextResponse.json({ message: 'Bus is already full to capacity' }, { status: 400 });
    }

    // 2. Check if student is already assigned to ANY bus in PostgreSQL
    const checkAllBuses = await pgQuery(`SELECT id, bus_no, route_name, students FROM buses`);
    for (const b of checkAllBuses.rows) {
      const bStuds: any[] = typeof b.students === 'string' ? JSON.parse(b.students) : (b.students || []);
      const exists = bStuds.some(st => String(st.student) === String(studentId));
      if (exists) {
        return NextResponse.json({
          message: `Student is already assigned to Fleet ${b.bus_no} (${b.route_name}). Please unassign them first.`
        }, { status: 400 });
      }
    }

    const matchedStop = stops.find((s: any) => s.stationName === stopName);
    const fare = customFare !== undefined && customFare !== null && customFare !== ""
      ? Number(customFare)
      : (matchedStop ? Number(matchedStop.price) || 0 : 0);

    const isPaid = paymentStatus === 'Paid';
    const txnId = isPaid ? `TRN-BUS-${Date.now().toString().slice(-6)}` : null;

    // 3. Append to bus students
    const newStudentEntry = {
      student: studentId,
      stopName: stopName || (stops[0]?.stationName || 'Main Station'),
      fare: fare,
      paymentStatus: isPaid ? 'Paid' : 'Pending',
      paymentDate: isPaid ? new Date().toISOString() : null,
      transactionId: txnId
    };

    const updatedStudents = [...currentStudents, newStudentEntry];
    const newFilled = updatedStudents.length;
    const newStatus = newFilled >= capacity ? 'Full' : (bus.status === 'Full' ? 'Active' : bus.status);

    await pgQuery(`
      UPDATE buses SET
        students = $2,
        filled = $3,
        status = $4,
        updated_at = NOW()
      WHERE id = $1
    `, [busId, JSON.stringify(updatedStudents), newFilled, newStatus]);

    // 4. Update student record in PostgreSQL students table
    const stuRes = await pgQuery(`SELECT * FROM students WHERE id = $1 LIMIT 1`, [studentId]);
    if (stuRes.rows.length > 0) {
      const stu = stuRes.rows[0];
      const currentYearNum = Number(stu.course_year) || 1;
      let feesObj: any = typeof stu.fees === 'string' ? JSON.parse(stu.fees) : (stu.fees || {});
      if (!feesObj || typeof feesObj !== 'object') {
        feesObj = { isConfigured: true, years: [] };
      }
      if (!Array.isArray(feesObj.years)) feesObj.years = [];

      let yrObj = feesObj.years.find((y: any) => y.year === currentYearNum);
      if (!yrObj) {
        yrObj = {
          year: currentYearNum,
          discount: 0,
          components: [{ category: 'Tuition Fee', amount: 0, paid: 0, frequency: 'Annual' }]
        };
        feesObj.years.push(yrObj);
      }

      // Add or update Transport Fee in components
      if (!Array.isArray(yrObj.components)) yrObj.components = [];
      const compIdx = yrObj.components.findIndex((c: any) => (c.category || '').toLowerCase().includes('transport'));
      if (compIdx >= 0) {
        yrObj.components[compIdx].amount = fare;
        yrObj.components[compIdx].paid = isPaid ? fare : 0;
      } else {
        yrObj.components.push({
          category: 'Transport Fee',
          amount: fare,
          paid: isPaid ? fare : 0,
          frequency: 'Annual'
        });
      }

      // Recalculate totals
      let totalFee = 0;
      let paidFee = 0;
      let transportFee = 0;
      let transportPaid = 0;

      feesObj.years.forEach((y: any) => {
        let yrGross = 0;
        let yrPaid = 0;
        (y.components || []).forEach((c: any) => {
          const amt = Number(c.amount) || 0;
          const pd = Number(c.paid) || 0;
          if ((c.category || '').toLowerCase().includes('transport')) {
            transportFee += amt;
            transportPaid += pd;
          }
          yrGross += amt;
          yrPaid += pd;
        });
        const disc = Number(y.discount) || 0;
        totalFee += Math.max(0, yrGross - disc);
        paidFee += yrPaid;
      });

      const feeBalance = Math.max(0, totalFee - paidFee);
      const feeStatus = totalFee > 0 ? (paidFee >= totalFee ? 'paid' : paidFee > 0 ? 'partial' : 'unpaid') : 'unpaid';

      await pgQuery(`
        UPDATE students SET
          fees = $2,
          transport_fee = $3,
          transport_paid = $4,
          total_fee = $5,
          paid_fee = $6,
          fee_balance = $7,
          fee_status = $8,
          updated_at = NOW()
        WHERE id = $1
      `, [
        studentId,
        JSON.stringify(feesObj),
        transportFee,
        transportPaid,
        totalFee,
        paidFee,
        feeBalance,
        feeStatus
      ]);

      // 5. If paid, insert into fee_transactions in PostgreSQL
      if (isPaid && fare > 0) {
        try {
          await pgQuery(`
            INSERT INTO fee_transactions (
              id, transaction_id, student_id, amount, payment_date, payment_method,
              status, category, category_name, academic_year, notes, receipt_number, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, NOW(), 'Cash', 'Completed', 'transport', 'Transport Fee', $5, $6, $7, NOW(), NOW())
          `, [
            `txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            txnId,
            studentId,
            fare,
            `Year ${currentYearNum}`,
            `Transport Fee for Bus ${bus.bus_no} (${newStudentEntry.stopName})`,
            `RCP-TRN-${Date.now().toString().slice(-6)}`
          ]);
        } catch (txnErr) {
          console.warn("Could not record fee transaction:", txnErr);
        }
      }
    }

    // 6. Invalidate caches
    await Promise.all([
      delCachePattern("transport:*"),
      delCache(`student:${studentId}`),
      delCachePattern("students:*"),
      delCache(`fee:student-account:${studentId}`),
      delCache("finance:all-data")
    ]);

    return NextResponse.json({
      success: true,
      message: `Student successfully assigned to Fleet ${bus.bus_no}!`,
      busId,
      studentId
    }, { status: 200 });

  } catch (error: any) {
    console.error("Transport POST Assign Student Error (PostgreSQL):", error);
    return NextResponse.json({ message: "Failed to assign student", error: error.message }, { status: 500 });
  }
}
