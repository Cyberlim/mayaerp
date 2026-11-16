import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { delCache, delCachePattern } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { busId, studentId, month, year, status, amount, markPaid, customFare } = body;

    if (!busId || !studentId || !month) {
      return NextResponse.json({ message: "busId, studentId, and month are required" }, { status: 400 });
    }

    const targetYear = String(year || 1);

    // 1. Fetch bus from PostgreSQL
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

    const assignment = currentStudents[studentIdx];
    const defaultMonthlyFare = Number(customFare || assignment.fare) || 0;

    // Resolve month record status: 'Paid' | 'Partial' | 'Absent' | 'Due'
    let resolvedStatus: 'Paid' | 'Partial' | 'Absent' | 'Due' = 'Due';
    let paidAmount = 0;

    if (status) {
      resolvedStatus = status;
      if (status === 'Paid') {
        paidAmount = defaultMonthlyFare;
      } else if (status === 'Partial') {
        paidAmount = Math.max(0, Number(amount) || 0);
      } else {
        // Absent or Due
        paidAmount = 0;
      }
    } else if (markPaid !== undefined) {
      if (markPaid) {
        resolvedStatus = 'Paid';
        paidAmount = defaultMonthlyFare;
      } else {
        resolvedStatus = 'Due';
        paidAmount = 0;
      }
    }

    // Initialize monthRecords
    if (!assignment.monthRecords || typeof assignment.monthRecords !== 'object') {
      assignment.monthRecords = {};
    }
    if (!assignment.monthRecords[targetYear]) {
      assignment.monthRecords[targetYear] = {};
    }

    assignment.monthRecords[targetYear][month] = {
      status: resolvedStatus,
      paid: resolvedStatus === 'Paid' || (resolvedStatus === 'Partial' && paidAmount > 0),
      amount: resolvedStatus === 'Partial' ? paidAmount : (resolvedStatus === 'Paid' ? defaultMonthlyFare : 0),
      paymentDate: (resolvedStatus === 'Paid' || resolvedStatus === 'Partial') ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    };

    // Calculate total transport fee paid from monthRecords
    const academicMonths = [
      "July", "August", "September", "October", "November", "December",
      "January", "February", "March", "April", "May", "June"
    ];

    let totalTransportPaid = 0;
    const yrRecs = assignment.monthRecords[targetYear] || {};
    academicMonths.forEach(m => {
      const rec = yrRecs[m];
      if (rec) {
        if (rec.status === 'Paid') {
          totalTransportPaid += defaultMonthlyFare;
        } else if (rec.status === 'Partial') {
          totalTransportPaid += Number(rec.amount) || 0;
        } else if (rec.paid && !rec.status) {
          totalTransportPaid += defaultMonthlyFare;
        }
      }
    });

    // Update overall bus assignment status
    const allMonthsCleared = academicMonths.every(m => {
      const rec = yrRecs[m];
      return rec && (rec.status === 'Paid' || rec.status === 'Absent');
    });

    assignment.paymentStatus = allMonthsCleared ? 'Paid' : 'Pending';
    assignment.paymentDate = allMonthsCleared ? new Date().toISOString() : null;

    currentStudents[studentIdx] = assignment;

    // Save updated students list into buses table
    await pgQuery(`
      UPDATE buses SET
        students = $2,
        updated_at = NOW()
      WHERE id = $1
    `, [busId, JSON.stringify(currentStudents)]);

    // Invalidate Redis caches
    await Promise.all([
      delCache("transport:buses:all"),
      delCachePattern("transport:*"),
      delCache(`student:${studentId}`),
      delCache(`fee:student-account:${studentId}`)
    ]);

    return NextResponse.json({
      success: true,
      message: `${month} transport status updated to ${resolvedStatus}`,
      assignment: assignment,
      monthRecord: assignment.monthRecords[targetYear][month],
      totalTransportPaid
    });

  } catch (error: any) {
    console.error("POST /api/transport/month-payment error:", error);
    return NextResponse.json({ message: "Failed to update month payment", error: error.message }, { status: 500 });
  }
}

