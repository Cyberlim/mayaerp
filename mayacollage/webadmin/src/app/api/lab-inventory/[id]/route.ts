import { NextResponse } from "next/server";
import { query } from "@/lib/postgres";
import { delCachePattern } from "@/lib/redis";
import { mapInventoryRow } from "@/lib/labMapper";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

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

    return NextResponse.json({ message: "Item updated successfully in PostgreSQL", item: updatedItem });
  } catch (error: any) {
    console.error("Lab Inventory PUT Error:", error);
    return NextResponse.json({ message: "Error updating item", error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const res = await query(`DELETE FROM lab_inventory WHERE id = $1 RETURNING id;`, [id]);
    if (res.rowCount === 0) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    await delCachePattern("master:lab-inv*");
    await delCachePattern("master:labs:stats*");

    return NextResponse.json({ message: "Item deleted successfully from PostgreSQL" });
  } catch (error: any) {
    console.error("Lab Inventory DELETE Error:", error);
    return NextResponse.json({ message: "Error deleting item", error: error.message }, { status: 500 });
  }
}
