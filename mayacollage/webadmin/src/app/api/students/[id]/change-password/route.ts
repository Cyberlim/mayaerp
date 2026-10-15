import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { delCache, delCachePattern } from "@/lib/redis";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();
    
    if (!body.newPassword) {
      return NextResponse.json({ error: "New password is required" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(body.newPassword, 10);

    // 1. Update in PostgreSQL
    const pgRes = await pgQuery(
      `UPDATE students SET password = $1, updated_at = NOW() WHERE id = $2 OR student_id = $2 RETURNING id`,
      [hashedPassword, id]
    );

    if (pgRes.rows.length === 0) {
      return NextResponse.json({ error: "Student not found in PostgreSQL" }, { status: 404 });
    }

    // 2. Invalidate Redis Cache
    await Promise.all([
      delCache(`student:${id}`),
      delCachePattern("students:*")
    ]);

    return NextResponse.json({ success: true, message: "Password updated successfully in PostgreSQL & cache invalidated" });
  } catch (error) {
    console.error("Change Password Error (PostgreSQL):", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
