import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { delCachePattern } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export const DEMO_BUSES = [
  {
    busNo: "BUS-01 (UP-86-T-9542)",
    driverName: "Charan Singh",
    conductorName: "Rakesh Sharma",
    capacity: 42,
    routeName: "Maya Institute to Kachora / Sikandra Rao",
    status: "Active",
    stops: [
      { stationName: "Kachora", price: 2000 },
      { stationName: "Sikandra Rao", price: 1800 },
      { stationName: "Sua Mohanpura", price: 1800 },
      { stationName: "Bastoi", price: 1500 },
      { stationName: "Rati Ka Nagla", price: 1500 },
      { stationName: "Salempur", price: 1200 },
      { stationName: "Thulai", price: 1000 },
      { stationName: "Nagla Tajna", price: 1000 },
      { stationName: "Kailora / Vahanpur", price: 1000 },
      { stationName: "Mendu", price: 500 }
    ]
  },
  {
    busNo: "BUS-02 (UP-16-BT-5421)",
    driverName: "Surender Pal",
    conductorName: "Dinesh Kumar",
    capacity: 45,
    routeName: "Ghaziabad - Vaishali Transit Corridor",
    status: "Active",
    stops: [
      { stationName: "Old Ghaziabad Bus Stand", price: 14000 },
      { stationName: "Mohan Nagar Metro Station", price: 13000 },
      { stationName: "Vaishali Sector 4", price: 11500 },
      { stationName: "Indirapuram Shipra Mall", price: 10500 },
      { stationName: "Electronic City Metro", price: 9000 }
    ]
  },
  {
    busNo: "BUS-03 (UP-14-CC-1120)",
    driverName: "Balram Singh",
    conductorName: "Vikramaditya",
    capacity: 50,
    routeName: "Greater Noida - Expressway Corridor",
    status: "Active",
    stops: [
      { stationName: "Pari Chowk Bus Terminal", price: 15500 },
      { stationName: "Alpha 1 Commercial Complex", price: 14000 },
      { stationName: "Surajpur Police Lines", price: 12500 },
      { stationName: "Advant Navis Sector 142", price: 11000 },
      { stationName: "Sector 137 Metro Station", price: 10000 }
    ]
  }
];

export async function POST() {
  try {
    const results = [];
    for (const b of DEMO_BUSES) {
      const existing = await pgQuery(`SELECT id FROM buses WHERE bus_no = $1 LIMIT 1`, [b.busNo]);
      if (existing.rows.length === 0) {
        const busId = `bus_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await pgQuery(`
          INSERT INTO buses (
            id, bus_no, driver_name, conductor_name, capacity, filled, route_name, status, stops, students, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, '[]'::jsonb, NOW(), NOW())
        `, [
          busId,
          b.busNo,
          b.driverName,
          b.conductorName,
          b.capacity,
          b.routeName,
          b.status,
          JSON.stringify(b.stops)
        ]);
        results.push({ action: "created", busNo: b.busNo });
      } else {
        await pgQuery(`
          UPDATE buses SET
            driver_name = $2,
            conductor_name = $3,
            capacity = $4,
            route_name = $5,
            stops = $6,
            updated_at = NOW()
          WHERE id = $1
        `, [
          existing.rows[0].id,
          b.driverName,
          b.conductorName,
          b.capacity,
          b.routeName,
          JSON.stringify(b.stops)
        ]);
        results.push({ action: "updated", busNo: b.busNo });
      }
    }

    await delCachePattern("transport:*");
    const countRes = await pgQuery(`SELECT COUNT(*) as total FROM buses`);

    return NextResponse.json({
      success: true,
      message: `Successfully seeded college fleet buses in PostgreSQL!`,
      totalBuses: Number(countRes.rows[0].total),
      results
    }, { status: 200 });
  } catch (error: any) {
    console.error("Transport Seed Error (PostgreSQL):", error);
    return NextResponse.json({ message: "Error seeding buses", error: error.message }, { status: 500 });
  }
}
