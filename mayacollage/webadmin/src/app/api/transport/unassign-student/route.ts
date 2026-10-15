import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { delCache, delCachePattern } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { busId, studentId } = body;

    if (!busId || !studentId) {
      return NextResponse.json({ message: "Bus ID and Student ID are required" }, { status: 400 });
    }

    const busRes = await pgQuery(`SELECT * FROM buses WHERE id = $1 LIMIT 1`, [busId]);
    if (busRes.rows.length === 0) {
      return NextResponse.json({ message: "Bus not found" }, { status: 404 });
    }
    const bus = busRes.rows[0];

    const currentStudents: any[] = typeof bus.students === 'string' ? JSON.parse(bus.students) : (bus.students || []);
    const updatedStudents = currentStudents.filter(st => String(st.student) !== String(studentId));
    const newFilled = updatedStudents.length;
    const capacity = Number(bus.capacity) || 40;
    const newStatus = newFilled >= capacity ? 'Full' : (bus.status === 'Full' ? 'Active' : bus.status);

    await pgQuery(`
      UPDATE buses SET
        students = $2,
        filled = $3,
        status = $4,
        updated_at = NOW()
      WHERE id = $1
    `, [busId, JSON.stringify(updatedStudents), newFilled, newStatus]);

    // Reset transport fee on student in PostgreSQL
    const stuRes = await pgQuery(`SELECT * FROM students WHERE id = $1 LIMIT 1`, [studentId]);
    if (stuRes.rows.length > 0) {
      const stu = stuRes.rows[0];
      const currentYearNum = Number(stu.course_year) || 1;
      let feesObj: any = typeof stu.fees === 'string' ? JSON.parse(stu.fees) : (stu.fees || {});
      if (feesObj && Array.isArray(feesObj.years)) {
        const yrObj = feesObj.years.find((y: any) => y.year === currentYearNum);
        if (yrObj && Array.isArray(yrObj.components)) {
          yrObj.components = yrObj.components.filter((c: any) => !(c.category || '').toLowerCase().includes('transport'));
        }
      }

      // Recalculate totals
      let totalFee = 0;
      let paidFee = 0;

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
          transport_fee = 0,
          transport_paid = 0,
          total_fee = $3,
          paid_fee = $4,
          fee_balance = $5,
          fee_status = $6,
          updated_at = NOW()
        WHERE id = $1
      `, [
        studentId,
        JSON.stringify(feesObj),
        totalFee,
        paidFee,
        feeBalance,
        feeStatus
      ]);
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
      message: "Student unassigned from bus and transport fee cleared."
    }, { status: 200 });

  } catch (error: any) {
    console.error("Transport POST Unassign Student Error (PostgreSQL):", error);
    return NextResponse.json({ message: "Failed to unassign student", error: error.message }, { status: 500 });
  }
}
