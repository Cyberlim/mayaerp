import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Bus } from "@/models/Bus";

export const dynamic = 'force-dynamic';

export const DEMO_BUSES = [
  {
    busNo: "BUS-01 (DL-1P-9842)",
    driverName: "Ramesh Chandra",
    conductorName: "Mohan Lal",
    capacity: 40,
    routeName: "South Delhi - Noida Express Line",
    status: "Active",
    stops: [
      { stationName: "Lajpat Nagar Ring Road", price: 16000 },
      { stationName: "Ashram Chowk", price: 15000 },
      { stationName: "Mayur Vihar Phase 1", price: 13500 },
      { stationName: "Noida Sector 18 Metro", price: 12000 },
      { stationName: "Noida Sector 62 Main Gate", price: 10000 }
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
        await connectDB();
        const results = [];

        for (const b of DEMO_BUSES) {
            const existing = await Bus.findOne({ busNo: b.busNo });
            if (!existing) {
                const created = await Bus.create(b);
                results.push({ action: 'created', bus: created });
            } else {
                existing.driverName = b.driverName;
                existing.conductorName = b.conductorName;
                existing.capacity = b.capacity;
                existing.routeName = b.routeName;
                existing.stops = b.stops;
                await existing.save();
                results.push({ action: 'updated', bus: existing });
            }
        }

        const count = await Bus.countDocuments();
        return NextResponse.json({
            success: true,
            message: `Successfully seeded ${results.length} college fleet buses with routes & stops!`,
            totalBuses: count,
            buses: results
        }, { status: 200 });

    } catch (error: any) {
        console.error("Transport Seed Error:", error);
        return NextResponse.json({ message: "Error seeding buses", error: error.message }, { status: 500 });
    }
}
