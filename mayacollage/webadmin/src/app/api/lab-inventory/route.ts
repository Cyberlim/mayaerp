import { NextResponse } from "next/server";
import { query } from "@/lib/postgres";
import { getCache, setCache, delCachePattern } from "@/lib/redis";
import { mapInventoryRow } from "@/lib/labMapper";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const labId = url.searchParams.get('lab');
    const category = url.searchParams.get('category');
    const condition = url.searchParams.get('condition') || url.searchParams.get('status');
    const search = url.searchParams.get('search');

    const cacheKey = `master:lab-inv:${labId || 'all'}:${category || 'all'}:${condition || 'all'}:${search || 'all'}`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Data-Source": "Redis-Cache" }
      });
    }

    let sql = `
      SELECT 
        i.*,
        l.lab_name,
        l.room_number
      FROM lab_inventory i
      LEFT JOIN labs l ON i.lab_id = l.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIdx = 1;

    if (labId) {
      sql += ` AND i.lab_id = $${paramIdx++}`;
      params.push(labId);
    }
    if (category) {
      sql += ` AND i.category = $${paramIdx++}`;
      params.push(category);
    }
    if (condition) {
      sql += ` AND i.condition = $${paramIdx++}`;
      params.push(condition);
    }
    if (search) {
      sql += ` AND (i.item_name ILIKE $${paramIdx} OR i.item_code ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    sql += ` ORDER BY i.created_at DESC;`;

    const res = await query(sql, params);
    const items = res.rows.map(mapInventoryRow);

    await setCache(cacheKey, items, 300);

    return NextResponse.json(items, {
      headers: { "X-Data-Source": "PostgreSQL-Neon" }
    });
  } catch (error: any) {
    console.error("Lab Inventory GET Error:", error);
    return NextResponse.json({ message: "Error fetching inventory", error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body.id || body._id || `inv_${Date.now()}`;
    const itemName = body.itemName || body.item_name;
    const itemCode = body.itemCode || body.item_code || `ITEM-${Date.now().toString().slice(-6)}`;
    const category = body.category || 'Equipment';
    const quantity = Number(body.quantity) || 0;
    const availableQuantity = body.availableQuantity !== undefined ? Number(body.availableQuantity) : quantity;
    const labId = typeof body.lab === 'object' ? (body.lab?._id || body.lab?.id) : (body.lab || body.lab_id);
    const condition = body.condition || 'Good';
    const lowStockThreshold = Number(body.lowStockThreshold) || 5;
    const description = body.description || '';
    const purchaseDate = body.purchaseDate || new Date();
    const purchaseCost = Number(body.purchaseCost) || 0;
    const vendor = body.vendor || '';
    const isIssuable = body.isIssuable !== false;

    if (!itemName) {
      return NextResponse.json({ message: "Item name is required" }, { status: 400 });
    }

    const res = await query(`
      INSERT INTO lab_inventory (
        id, item_name, item_code, category, quantity, available_quantity, lab_id, 
        condition, low_stock_threshold, description, purchase_date, purchase_cost, 
        vendor, is_issuable, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING *;
    `, [
      id, itemName, itemCode, category, quantity, availableQuantity, labId,
      condition, lowStockThreshold, description, purchaseDate, purchaseCost,
      vendor, isIssuable
    ]);

    // Fetch joined for response
    const joined = await query(`
      SELECT i.*, l.lab_name, l.room_number FROM lab_inventory i LEFT JOIN labs l ON i.lab_id = l.id WHERE i.id = $1;
    `, [id]);

    const createdItem = mapInventoryRow(joined.rows[0]);

    await delCachePattern("master:lab-inv*");
    await delCachePattern("master:labs:stats*");

    return NextResponse.json({ message: "Item added successfully to PostgreSQL", item: createdItem }, { status: 201 });
  } catch (error: any) {
    console.error("Lab Inventory POST Error:", error);
    return NextResponse.json({ message: "Error adding item", error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const id = body.id || body._id;

    if (!id) {
      return NextResponse.json({ message: "Item ID is required" }, { status: 400 });
    }

    const itemName = body.itemName || body.item_name;
    const itemCode = body.itemCode || body.item_code;
    const category = body.category;
    const quantity = body.quantity !== undefined ? Number(body.quantity) : undefined;
    const availableQuantity = body.availableQuantity !== undefined ? Number(body.availableQuantity) : undefined;
    const labId = typeof body.lab === 'object' ? (body.lab?._id || body.lab?.id) : (body.lab || body.lab_id);
    const condition = body.condition;
    const lowStockThreshold = body.lowStockThreshold !== undefined ? Number(body.lowStockThreshold) : undefined;
    const description = body.description;
    const purchaseCost = body.purchaseCost !== undefined ? Number(body.purchaseCost) : undefined;
    const vendor = body.vendor;
    const isIssuable = body.isIssuable;

    await query(`
      UPDATE lab_inventory
      SET
        item_name = COALESCE($2, item_name),
        item_code = COALESCE($3, item_code),
        category = COALESCE($4, category),
        quantity = COALESCE($5, quantity),
        available_quantity = COALESCE($6, available_quantity),
        lab_id = COALESCE($7, lab_id),
        condition = COALESCE($8, condition),
        low_stock_threshold = COALESCE($9, low_stock_threshold),
        description = COALESCE($10, description),
        purchase_cost = COALESCE($11, purchase_cost),
        vendor = COALESCE($12, vendor),
        is_issuable = COALESCE($13, is_issuable),
        updated_at = NOW()
      WHERE id = $1;
    `, [
      id, itemName, itemCode, category, quantity, availableQuantity, labId,
      condition, lowStockThreshold, description, purchaseCost, vendor, isIssuable
    ]);

    const joined = await query(`
      SELECT i.*, l.lab_name, l.room_number FROM lab_inventory i LEFT JOIN labs l ON i.lab_id = l.id WHERE i.id = $1;
    `, [id]);

    if (joined.rowCount === 0) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    const updatedItem = mapInventoryRow(joined.rows[0]);

    await delCachePattern("master:lab-inv*");
    await delCachePattern("master:labs:stats*");

    return NextResponse.json({ message: "Item updated successfully", item: updatedItem }, { status: 200 });
  } catch (error: any) {
    console.error("Lab Inventory PUT Error:", error);
    return NextResponse.json({ message: "Error updating item", error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Item ID is required" }, { status: 400 });
    }

    const res = await query(`DELETE FROM lab_inventory WHERE id = $1 RETURNING id;`, [id]);
    if (res.rowCount === 0) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    await delCachePattern("master:lab-inv*");
    await delCachePattern("master:labs:stats*");

    return NextResponse.json({ message: "Item deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Lab Inventory DELETE Error:", error);
    return NextResponse.json({ message: "Error deleting item", error: error.message }, { status: 500 });
  }
}
