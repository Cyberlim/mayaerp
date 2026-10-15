import { NextResponse } from "next/server";
import { query } from "@/lib/postgres";
import { getCache, setCache } from "@/lib/redis";

export const dynamic = 'force-dynamic';

const STATS_CACHE_KEY = "master:labs:stats";

export async function GET() {
  try {
    const cached = await getCache<any>(STATS_CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Data-Source": "Redis-Cache" }
      });
    }

    // 1. Total Labs
    const labsRes = await query(`SELECT COUNT(*) AS count FROM labs WHERE is_active = TRUE;`);
    const totalLabs = Number(labsRes.rows[0]?.count) || 0;

    // 2. Inventory Stats
    const invRes = await query(`
      SELECT 
        COALESCE(SUM(quantity), 0) AS total_items,
        COUNT(CASE WHEN available_quantity <= low_stock_threshold THEN 1 END) AS low_stock_count,
        COUNT(CASE WHEN condition = 'Damaged' THEN 1 END) AS damaged_count
      FROM lab_inventory;
    `);
    const totalItems = Number(invRes.rows[0]?.total_items) || 0;
    const lowStockCount = Number(invRes.rows[0]?.low_stock_count) || 0;
    const damagedCount = Number(invRes.rows[0]?.damaged_count) || 0;

    // 3. Issue Stats
    const issuesRes = await query(`
      SELECT 
        COUNT(CASE WHEN status IN ('Issued', 'Overdue') THEN 1 END) AS active_issues,
        COUNT(CASE WHEN status = 'Overdue' THEN 1 END) AS overdue_issues
      FROM lab_issues;
    `);
    const activeIssues = Number(issuesRes.rows[0]?.active_issues) || 0;
    const overdueIssues = Number(issuesRes.rows[0]?.overdue_issues) || 0;

    const stats = {
      totalLabs,
      totalItems,
      lowStockCount,
      damagedCount,
      activeIssues,
      overdueIssues
    };

    await setCache(STATS_CACHE_KEY, stats, 120);

    return NextResponse.json(stats, {
      headers: { "X-Data-Source": "PostgreSQL-Neon" }
    });
  } catch (error: any) {
    console.error("Labs Stats GET Error:", error);
    return NextResponse.json({ message: "Error fetching stats", error: error.message }, { status: 500 });
  }
}
