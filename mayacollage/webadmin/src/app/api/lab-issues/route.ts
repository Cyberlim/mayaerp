import { NextResponse } from "next/server";
import { query, getClient } from "@/lib/postgres";
import { getCache, setCache, delCachePattern } from "@/lib/redis";
import { mapIssueRow } from "@/lib/labMapper";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const labId = url.searchParams.get('lab');

    const cacheKey = `master:lab-issues:${status || 'all'}:${labId || 'all'}`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Data-Source": "Redis-Cache" }
      });
    }

    let sql = `
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
      WHERE 1=1
    `;
    const params: any[] = [];
    let pIdx = 1;

    if (status) {
      sql += ` AND iss.status = $${pIdx++}`;
      params.push(status);
    }
    if (labId) {
      sql += ` AND iss.lab_id = $${pIdx++}`;
      params.push(labId);
    }

    sql += ` ORDER BY iss.created_at DESC;`;

    const res = await query(sql, params);
    const issues = res.rows.map(mapIssueRow);

    await setCache(cacheKey, issues, 300);

    return NextResponse.json(issues, {
      headers: { "X-Data-Source": "PostgreSQL-Neon" }
    });
  } catch (error: any) {
    console.error("Lab Issues GET Error:", error);
    return NextResponse.json({ message: "Error fetching issues", error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const client = await getClient();
  try {
    const body = await req.json();
    const itemId = typeof body.item === 'object' ? (body.item?._id || body.item?.id) : (body.item || body.item_id);
    const issuedTo = typeof body.issuedTo === 'object' ? (body.issuedTo?._id || body.issuedTo?.id) : body.issuedTo;
    const issuedToModel = body.issuedToModel || 'Student';
    const issuedToName = body.issuedToName || '';
    const issuedToId = body.issuedToId || '';
    const quantityIssued = Number(body.quantityIssued) || 1;
    const expectedReturnDate = body.expectedReturnDate;
    const remarks = body.remarks || '';
    const labId = typeof body.lab === 'object' ? (body.lab?._id || body.lab?.id) : (body.lab || body.lab_id);
    const issuedBy = typeof body.issuedBy === 'object' ? (body.issuedBy?._id || body.issuedBy?.id) : body.issuedBy;
    const issueId = body.id || body._id || `issue_${Date.now()}`;
    const transactionId = body.transactionId || `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (!itemId) {
      return NextResponse.json({ message: "Inventory item is required" }, { status: 400 });
    }
    if (!issuedTo) {
      return NextResponse.json({ message: "Recipient (Student/Faculty) is required" }, { status: 400 });
    }

    await client.query('BEGIN');

    // Check inventory stock
    const itemRes = await client.query(`
      SELECT id, available_quantity, lab_id, is_issuable FROM lab_inventory WHERE id = $1 FOR UPDATE;
    `, [itemId]);

    if (itemRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "Inventory item not found" }, { status: 404 });
    }

    const inv = itemRes.rows[0];
    if (inv.available_quantity < quantityIssued) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: `Not enough stock. Available: ${inv.available_quantity}` }, { status: 400 });
    }

    // Decrement stock
    await client.query(`
      UPDATE lab_inventory
      SET available_quantity = available_quantity - $2, updated_at = NOW()
      WHERE id = $1;
    `, [itemId, quantityIssued]);

    // Insert issue record
    const effectiveLabId = labId || inv.lab_id;
    await client.query(`
      INSERT INTO lab_issues (
        id, transaction_id, item_id, lab_id, issued_to, issued_to_model, 
        issued_to_name, issued_to_id, quantity_issued, issue_date, 
        expected_return_date, status, remarks, issued_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, 'Issued', $11, $12, NOW(), NOW());
    `, [
      issueId, transactionId, itemId, effectiveLabId, issuedTo, issuedToModel,
      issuedToName, issuedToId, quantityIssued, expectedReturnDate, remarks, issuedBy || null
    ]);

    await client.query('COMMIT');

    // Query joined issue for return
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
    `, [issueId]);

    const createdIssue = mapIssueRow(joined.rows[0]);

    await delCachePattern("master:lab-issues*");
    await delCachePattern("master:lab-inv*");
    await delCachePattern("master:labs:stats*");

    return NextResponse.json({ message: "Item issued successfully in PostgreSQL", issue: createdIssue }, { status: 201 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Lab Issues POST Error:", error);
    return NextResponse.json({ message: "Error issuing item", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(req: Request) {
  const client = await getClient();
  try {
    const body = await req.json();
    const id = body.id || body._id;
    const status = body.status;
    const returnRemarks = body.returnRemarks || body.remarks;

    if (!id) {
      return NextResponse.json({ message: "Issue ID is required" }, { status: 400 });
    }

    await client.query('BEGIN');

    const issueRes = await client.query(`
      SELECT id, item_id, quantity_issued, status FROM lab_issues WHERE id = $1 FOR UPDATE;
    `, [id]);

    if (issueRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "Issue record not found" }, { status: 404 });
    }

    const currentIssue = issueRes.rows[0];

    // If transitioning to Returned, restore quantity
    if (currentIssue.status !== "Returned" && status === "Returned") {
      await client.query(`
        UPDATE lab_inventory
        SET available_quantity = available_quantity + $2, updated_at = NOW()
        WHERE id = $1;
      `, [currentIssue.item_id, currentIssue.quantity_issued]);

      await client.query(`
        UPDATE lab_issues
        SET status = $2, return_date = NOW(), remarks = COALESCE($3, remarks), updated_at = NOW()
        WHERE id = $1;
      `, [id, status, returnRemarks]);
    } else {
      await client.query(`
        UPDATE lab_issues
        SET status = COALESCE($2, status), remarks = COALESCE($3, remarks), updated_at = NOW()
        WHERE id = $1;
      `, [id, status, returnRemarks]);
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

    return NextResponse.json({ message: "Issue updated successfully in PostgreSQL", issue: updatedIssue }, { status: 200 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Lab Issues PUT Error:", error);
    return NextResponse.json({ message: "Error updating issue", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Issue ID is required" }, { status: 400 });
    }

    const res = await query(`DELETE FROM lab_issues WHERE id = $1 RETURNING id;`, [id]);
    if (res.rowCount === 0) {
      return NextResponse.json({ message: "Issue not found" }, { status: 404 });
    }

    await delCachePattern("master:lab-issues*");
    await delCachePattern("master:labs:stats*");

    return NextResponse.json({ message: "Issue deleted successfully from PostgreSQL" }, { status: 200 });
  } catch (error: any) {
    console.error("Lab Issues DELETE Error:", error);
    return NextResponse.json({ message: "Error deleting issue", error: error.message }, { status: 500 });
  }
}
