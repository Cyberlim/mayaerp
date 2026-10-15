import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { getCache, setCache, DEFAULT_CACHE_TTL } from "@/lib/redis";

export const dynamic = 'force-dynamic';

const CACHE_KEY = "fee:stats";

export async function GET() {
  try {
    // 1. Try Redis cache (30 min TTL)
    const cachedStats = await getCache(CACHE_KEY);
    if (cachedStats) {
      return NextResponse.json(cachedStats, {
        headers: { "X-Cache-Source": "Upstash-Redis" }
      });
    }

    // 2. Query PostgreSQL real financial aggregates
    const [stuStatsRes, txnSumRes] = await Promise.all([
      pgQuery(`
        SELECT 
          COUNT(*) as active_count,
          COALESCE(SUM(total_fee), 0) as total_receivable,
          COALESCE(SUM(paid_fee), 0) as total_collected_stu,
          COALESCE(SUM(fee_balance), 0) as total_due
        FROM students 
        WHERE student_status = 'Active'
      `),
      pgQuery("SELECT COALESCE(SUM(amount), 0) as total FROM fee_transactions WHERE status = 'Completed'")
    ]);

    const activeStudentCount = parseInt(stuStatsRes.rows[0]?.active_count || "0", 10);
    const totalReceivable = Number(stuStatsRes.rows[0]?.total_receivable) || 0;
    const txnCollected = Number(txnSumRes.rows[0]?.total) || 0;
    const stuCollected = Number(stuStatsRes.rows[0]?.total_collected_stu) || 0;
    const totalCollected = Math.max(txnCollected, stuCollected);
    const totalDue = Math.max(0, totalReceivable - totalCollected);

    const stats = {
      totalCollected,
      totalReceivable,
      totalDue,
      activeStudentCount
    };

    // 3. Cache in Redis
    await setCache(CACHE_KEY, stats, DEFAULT_CACHE_TTL);

    return NextResponse.json(stats, {
      headers: { "X-Cache-Source": "Neon-PostgreSQL" }
    });

  } catch (error: any) {
    console.error("Finance Stats Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
