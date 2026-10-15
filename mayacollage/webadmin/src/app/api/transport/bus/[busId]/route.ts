import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { delCachePattern } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ busId: string }> }) {
  try {
    const { busId } = await params;
    const body = await req.json();
    const { busNo, driverName, conductorName, capacity, routeName, stops, status } = body;

    const checkRes = await pgQuery(`SELECT * FROM buses WHERE id = $1 LIMIT 1`, [busId]);
    if (checkRes.rows.length === 0) {
      return NextResponse.json({ message: "Bus fleet not found" }, { status: 404 });
    }
    const current = checkRes.rows[0];

    const updatedBusNo = busNo !== undefined ? busNo.trim() : current.bus_no;
    const updatedDriver = driverName !== undefined ? driverName.trim() : current.driver_name;
    const updatedConductor = conductorName !== undefined ? conductorName.trim() : current.conductor_name;
    const updatedCapacity = capacity !== undefined ? Number(capacity) : Number(current.capacity);
    const updatedRoute = routeName !== undefined ? routeName.trim() : current.route_name;
    const updatedStatus = status !== undefined ? status : current.status;
    const updatedStops = Array.isArray(stops) ? stops.map((s: any) => ({
      stationName: (s.stationName || "").trim(),
      price: Number(s.price) || 0
    })) : (typeof current.stops === 'string' ? JSON.parse(current.stops) : current.stops);

    const updateRes = await pgQuery(`
      UPDATE buses SET
        bus_no = $2,
        driver_name = $3,
        conductor_name = $4,
        capacity = $5,
        route_name = $6,
        status = $7,
        stops = $8,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [
      busId,
      updatedBusNo,
      updatedDriver,
      updatedConductor,
      updatedCapacity,
      updatedRoute,
      updatedStatus,
      JSON.stringify(updatedStops)
    ]);

    await delCachePattern("transport:*");

    const updated = updateRes.rows[0];
    return NextResponse.json({
      success: true,
      message: `Bus ${updated.bus_no} updated successfully!`,
      bus: {
        _id: updated.id,
        id: updated.id,
        busNo: updated.bus_no,
        driverName: updated.driver_name,
        conductorName: updated.conductor_name,
        capacity: Number(updated.capacity),
        filled: Number(updated.filled),
        routeName: updated.route_name,
        status: updated.status,
        stops: updatedStops,
        students: typeof updated.students === 'string' ? JSON.parse(updated.students) : updated.students,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error("Transport PUT Bus Error (PostgreSQL):", error);
    return NextResponse.json({ message: "Error updating bus", error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ busId: string }> }) {
  try {
    const { busId } = await params;
    const delRes = await pgQuery(`DELETE FROM buses WHERE id = $1 RETURNING id`, [busId]);
    if (delRes.rows.length === 0) {
      return NextResponse.json({ message: "Bus not found" }, { status: 404 });
    }

    await delCachePattern("transport:*");
    return NextResponse.json({ success: true, message: "Bus removed successfully from fleet" }, { status: 200 });
  } catch (error: any) {
    console.error("Transport DELETE Bus Error (PostgreSQL):", error);
    return NextResponse.json({ message: "Error deleting bus", error: error.message }, { status: 500 });
  }
}
