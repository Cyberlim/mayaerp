import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { delCachePattern } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { sessionYear, selectedProgram, selectedBranch, newSemester, selectedSemester } = body;

    const whereClauses: string[] = [];
    const values: any[] = [];
    let pIdx = 1;

    if (sessionYear) {
      whereClauses.push(`(session_year ILIKE $${pIdx} OR batch = $${pIdx})`);
      pIdx++;
      values.push(`%${sessionYear}%`);
    }
    if (selectedProgram) {
      whereClauses.push(`selected_program = $${pIdx++}`);
      values.push(selectedProgram);
    }
    if (selectedBranch) {
      whereClauses.push(`selected_branch = $${pIdx++}`);
      values.push(selectedBranch);
    }
    if (selectedSemester) {
      whereClauses.push(`selected_semester = $${pIdx++}`);
      values.push(Number(selectedSemester));
    }

    // We only update students who match the query
    if (whereClauses.length === 0) {
      return NextResponse.json({ error: "No filters applied for batch update to prevent mass accidental override." }, { status: 400 });
    }

    const nextSem = Number(newSemester) || 1;
    const courseYear = Math.ceil(nextSem / 2);

    values.unshift(courseYear);
    values.unshift(nextSem);

    // After unshift, $1 is nextSem, $2 is courseYear, rest are shifted by 2
    const shiftedWhere = whereClauses.map(clause => {
      return clause.replace(/\$(\d+)/g, (_, num) => `$${Number(num) + 2}`);
    });

    const updateSQL = `
      UPDATE students
      SET selected_semester = $1, course_year = $2, updated_at = NOW()
      WHERE ${shiftedWhere.join(' AND ')}
      RETURNING id
    `;

    const res = await pgQuery(updateSQL, values);

    // Invalidate Redis Caches
    await Promise.all([
      delCachePattern("students:*"),
      delCachePattern("student:*")
    ]);

    return NextResponse.json({
      message: "Batch update successful in PostgreSQL",
      modifiedCount: res.rows.length,
      matchedCount: res.rows.length
    });

  } catch (error: any) {
    console.error("Batch update error (PostgreSQL):", error);
    return NextResponse.json({ error: error.message || "Failed to perform batch update in PostgreSQL" }, { status: 500 });
  }
}
