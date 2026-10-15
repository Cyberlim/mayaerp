import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { mapPgPayouts, mapPgPayout } from "@/lib/financeMapper";
import { getCache, setCache, delCache, delCachePattern, DEFAULT_CACHE_TTL } from "@/lib/redis";

export const dynamic = 'force-dynamic';

const CACHE_KEY = "fee:payouts";

export async function GET() {
  try {
    const cachedPayouts = await getCache(CACHE_KEY);
    if (cachedPayouts) {
      return NextResponse.json(cachedPayouts, {
        headers: { "X-Cache-Source": "Upstash-Redis" }
      });
    }

    const sql = `
      SELECT p.*
      FROM payouts p
      ORDER BY p.payment_date DESC, p.created_at DESC
      LIMIT 100
    `;
    const res = await pgQuery(sql);
    const payouts = mapPgPayouts(res.rows);

    await setCache(CACHE_KEY, payouts, DEFAULT_CACHE_TTL);

    return NextResponse.json(payouts, {
      headers: { "X-Cache-Source": "Neon-PostgreSQL" }
    });
  } catch (error: any) {
    console.error("Finance Payouts GET Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { payeeId, amount, paymentDate, paymentMethod, notes, payoutType, designation, department } = body;

    if (!payeeId || !amount) {
      return NextResponse.json({ error: "Missing required fields (payeeId and amount)" }, { status: 400 });
    }

    const payNum = parseFloat(amount);
    if (isNaN(payNum) || payNum <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    // Try finding payee in users table or fallback
    let payeeName = body.payeeName || "Staff Member";
    let userDesignation = designation || "Faculty / Staff";
    let userDept = department || "Academics";

    const userRes = await pgQuery('SELECT * FROM users WHERE id = $1', [payeeId]);
    if (userRes.rows.length > 0) {
      const u = userRes.rows[0];
      payeeName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || payeeName;
      userDesignation = u.role || userDesignation;
      userDept = u.department || userDept;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const transactionId = `PAY-${Date.now()}-${randomSuffix}`;
    const receiptNumber = `VCH-${dateStr}-${randomSuffix}`;
    const payoutId = `pay_${Date.now()}_${randomSuffix}`;

    const insertRes = await pgQuery(`
      INSERT INTO payouts (
        id, payee_id, payee_name, receipt_number, designation, department,
        payout_type, amount, payment_date, payment_method, transaction_id,
        status, notes, disbursed_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Completed', $12, 'Admin Finance', NOW(), NOW())
      RETURNING *
    `, [
      payoutId,
      payeeId,
      payeeName,
      receiptNumber,
      userDesignation,
      userDept,
      payoutType || 'Salary',
      payNum,
      paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod || 'Bank Transfer',
      transactionId,
      notes || ''
    ]);

    const newPayout = mapPgPayout(insertRes.rows[0]);

    // Invalidate caches
    await Promise.all([
      delCache(CACHE_KEY),
      delCache("fee:bundle:master"),
      delCachePattern("fee:receipts:*")
    ]);

    return NextResponse.json(newPayout, { status: 201 });
  } catch (error: any) {
    console.error("Finance Payouts POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
