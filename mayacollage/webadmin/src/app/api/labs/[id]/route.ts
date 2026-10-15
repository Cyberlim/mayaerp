import { NextResponse } from "next/server";
import { query } from "@/lib/postgres";
import { delCachePattern } from "@/lib/redis";
import { mapLabRow } from "@/lib/labMapper";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const labName = body.labName || body.lab_name;
    const roomNumber = body.roomNumber || body.room_number;
    const capacity = body.capacity !== undefined ? Number(body.capacity) : undefined;
    const labType = body.labType || body.lab_type;
    const labIncharge = typeof body.labIncharge === 'object' ? (body.labIncharge?._id || body.labIncharge?.id) : body.labIncharge;
    const description = body.description;
    const isActive = body.isActive;

    const res = await query(`
      UPDATE labs
      SET
        lab_name = COALESCE($2, lab_name),
        room_number = COALESCE($3, room_number),
        capacity = COALESCE($4, capacity),
        lab_type = COALESCE($5, lab_type),
        lab_incharge = COALESCE($6, lab_incharge),
        description = COALESCE($7, description),
        is_active = COALESCE($8, is_active),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [id, labName, roomNumber, capacity, labType, labIncharge, description, isActive]);

    if (res.rowCount === 0) {
      return NextResponse.json({ message: "Lab not found" }, { status: 404 });
    }

    const updatedLab = mapLabRow(res.rows[0]);
    await delCachePattern("master:labs*");

    return NextResponse.json({ message: "Lab updated successfully in PostgreSQL", lab: updatedLab });
  } catch (error: any) {
    console.error("Labs PUT Error:", error);
    return NextResponse.json({ message: "Error updating lab", error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const res = await query(`DELETE FROM labs WHERE id = $1 RETURNING id;`, [id]);
    if (res.rowCount === 0) {
      return NextResponse.json({ message: "Lab not found" }, { status: 404 });
    }

    await delCachePattern("master:labs*");
    return NextResponse.json({ message: "Lab deleted successfully from PostgreSQL" });
  } catch (error: any) {
    console.error("Labs DELETE Error:", error);
    return NextResponse.json({ message: "Error deleting lab", error: error.message }, { status: 500 });
  }
}
