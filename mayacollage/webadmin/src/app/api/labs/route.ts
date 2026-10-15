import { NextResponse } from "next/server";
import { query } from "@/lib/postgres";
import { getCache, setCache, delCachePattern } from "@/lib/redis";
import { mapLabRow } from "@/lib/labMapper";

export const dynamic = 'force-dynamic';

const CACHE_KEY = "master:labs";

export async function GET() {
  try {
    const cached = await getCache<any[]>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Data-Source": "Redis-Cache" }
      });
    }

    const res = await query(`
      SELECT 
        l.*,
        u.first_name AS incharge_first_name,
        u.last_name AS incharge_last_name,
        u.email AS incharge_email
      FROM labs l
      LEFT JOIN users u ON l.lab_incharge = u.id
      ORDER BY l.created_at DESC;
    `);

    const labs = res.rows.map(mapLabRow);
    await setCache(CACHE_KEY, labs, 300);

    return NextResponse.json(labs, {
      headers: { "X-Data-Source": "PostgreSQL-Neon" }
    });
  } catch (error: any) {
    console.error("Labs GET Error:", error);
    return NextResponse.json({ message: "Error fetching labs", error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body.id || body._id || `lab_${Date.now()}`;
    const labName = body.labName || body.lab_name;
    const roomNumber = body.roomNumber || body.room_number;
    const capacity = Number(body.capacity) || 30;
    const labType = body.labType || body.lab_type || 'Computer';
    const labIncharge = typeof body.labIncharge === 'object' ? (body.labIncharge?._id || body.labIncharge?.id) : body.labIncharge;
    const description = body.description || '';
    const isActive = body.isActive !== false;

    if (!labName || !roomNumber) {
      return NextResponse.json({ message: "Lab name and room number are required" }, { status: 400 });
    }

    const res = await query(`
      INSERT INTO labs (id, lab_name, room_number, capacity, lab_type, lab_incharge, description, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *;
    `, [id, labName, roomNumber, capacity, labType, labIncharge || null, description, isActive]);

    const createdLab = mapLabRow(res.rows[0]);

    // Invalidate Redis caches
    await delCachePattern("master:labs*");

    return NextResponse.json({ message: "Lab created successfully in PostgreSQL", lab: createdLab }, { status: 201 });
  } catch (error: any) {
    console.error("Labs POST Error:", error);
    return NextResponse.json({ message: "Error creating lab", error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const id = body.id || body._id;

    if (!id) {
      return NextResponse.json({ message: "Lab ID is required" }, { status: 400 });
    }

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

    return NextResponse.json({ message: "Lab updated successfully", lab: updatedLab }, { status: 200 });
  } catch (error: any) {
    console.error("Labs PUT Error:", error);
    return NextResponse.json({ message: "Error updating lab", error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Lab ID is required" }, { status: 400 });
    }

    const res = await query(`DELETE FROM labs WHERE id = $1 RETURNING id;`, [id]);
    if (res.rowCount === 0) {
      return NextResponse.json({ message: "Lab not found" }, { status: 404 });
    }

    await delCachePattern("master:labs*");
    return NextResponse.json({ message: "Lab deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Labs DELETE Error:", error);
    return NextResponse.json({ message: "Error deleting lab", error: error.message }, { status: 500 });
  }
}
