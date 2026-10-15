import { NextResponse } from "next/server";
import { query, getClient } from "@/lib/postgres";
import { delCachePattern } from "@/lib/redis";
import { mapIssueRow } from "@/lib/labMapper";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const client = await getClient();
  try {
    const { id } = await params;
    const body = await req.json();
    const { returnStatus, remarks } = body;

    await client.query('BEGIN');

    const issueRes = await client.query(`
      SELECT id, item_id, quantity_issued, status FROM lab_issues WHERE id = $1 FOR UPDATE;
    `, [id]);

    if (issueRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "Issue record not found" }, { status: 404 });
    }

    const currentIssue = issueRes.rows[0];
    if (currentIssue.status === 'Returned') {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "Item already returned" }, { status: 400 });
    }

    const newStatus = returnStatus || 'Returned';

    // Update Issue record
    await client.query(`
      UPDATE lab_issues
      SET status = $2, return_date = NOW(), remarks = COALESCE($3, remarks), updated_at = NOW()
      WHERE id = $1;
    `, [id, newStatus, remarks]);

    // Restore available quantity
    if (newStatus === 'Returned' || !newStatus) {
      await client.query(`
        UPDATE lab_inventory
        SET available_quantity = available_quantity + $2, updated_at = NOW()
        WHERE id = $1;
      `, [currentIssue.item_id, currentIssue.quantity_issued]);
    } else if (newStatus === 'Damaged') {
      await client.query(`
        UPDATE lab_inventory
        SET condition = 'Damaged', available_quantity = available_quantity + $2, updated_at = NOW()
        WHERE id = $1;
      `, [currentIssue.item_id, currentIssue.quantity_issued]);
    }

    await client.query('COMMIT');

    const joined = await query(`
      SELECT 
        iss.*,
        inv.item_name,
        inv.category AS item_category,
        l.lab_name,
        l.room_number,
        u.first_name AS staff_first_name,
        u.last_name AS staff_last_name
      FROM lab_issues iss
      LEFT JOIN lab_inventory inv ON iss.item_id = inv.id
      LEFT JOIN labs l ON iss.lab_id = l.id
      LEFT JOIN users u ON iss.issued_by = u.id
      WHERE iss.id = $1;
    `, [id]);

    const updatedIssue = mapIssueRow(joined.rows[0]);

    await delCachePattern("master:lab-issues*");
    await delCachePattern("master:lab-inv*");
    await delCachePattern("master:labs:stats*");

    return NextResponse.json({ message: "Item return processed in PostgreSQL", issue: updatedIssue });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Lab Issues PUT Error:", error);
    return NextResponse.json({ message: "Error returning item", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
