import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { delCachePattern } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { busNo, driverName, conductorName, capacity, routeName, stops } = body;

    if (!busNo || !driverName || !conductorName || !capacity || !routeName) {
      return NextResponse.json({ message: 'Missing required fleet coordinates' }, { status: 400 });
    }

    const trimmedBusNo = busNo.trim();

    // Check existing
    const existing = await pgQuery(`SELECT id FROM buses WHERE LOWER(bus_no) = LOWER($1) LIMIT 1`, [trimmedBusNo]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ message: 'Fleet ID already exists in system' }, { status: 400 });
    }

    const busId = `bus_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const stopsList = Array.isArray(stops) ? stops.map((s: any) => ({
      stationName: (s.stationName || "").trim(),
      price: Number(s.price) || 0
    })) : [];

    const insertRes = await pgQuery(`
      INSERT INTO buses (
        id, bus_no, driver_name, conductor_name, capacity, filled, route_name, status, stops, students, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 0, $6, 'Active', $7, '[]'::jsonb, NOW(), NOW())
      RETURNING *
    `, [
      busId,
      trimmedBusNo,
      driverName.trim(),
      conductorName.trim(),
      Number(capacity),
      routeName.trim(),
      JSON.stringify(stopsList)
    ]);

    await delCachePattern("transport:*");

    const created = insertRes.rows[0];
    return NextResponse.json({
      _id: created.id,
      id: created.id,
      busNo: created.bus_no,
      driverName: created.driver_name,
      conductorName: created.conductor_name,
      capacity: Number(created.capacity),
      filled: 0,
      routeName: created.route_name,
      status: created.status,
      stops: stopsList,
      students: [],
      createdAt: created.created_at,
      updatedAt: created.updated_at
    }, { status: 201 });
  } catch (error: any) {
    console.error("Transport POST Bus Error (PostgreSQL):", error);
    return NextResponse.json({ message: "Error creating bus", error: error.message }, { status: 500 });
  }
}
