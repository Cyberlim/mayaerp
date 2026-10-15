/**
 * Migration & Seeding script: MongoDB Transport Buses -> Neon PostgreSQL
 */
const mongoose = require('mongoose');
const { Pool } = require('pg');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://thestudentzilla_db_user:NL2wc3tgnB6EzpPl@mayacollage.ktxtgpi.mongodb.net/';
const PG_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_pADeFi9rGlU2@ep-royal-field-b4fsklle-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: PG_URL,
  ssl: { rejectUnauthorized: false }
});

const DEMO_SEED_BUSES = [
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

async function run() {
  console.log('🚀 Connecting to Neon PostgreSQL and MongoDB...');
  const pg = await pool.connect();
  let mongoBuses = [];

  try {
    await mongoose.connect(MONGO_URI);
    const mongo = mongoose.connection.db;
    mongoBuses = await mongo.collection('buses').find({}).toArray();
    console.log(`📦 Found ${mongoBuses.length} buses in MongoDB.`);
  } catch (err) {
    console.warn('⚠️ Could not connect to MongoDB, falling back to demo seed buses:', err.message);
  }

  try {
    console.log('📦 Creating PostgreSQL buses table...');
    await pg.query(`
      CREATE TABLE IF NOT EXISTS buses (
        id VARCHAR(64) PRIMARY KEY,
        bus_no VARCHAR(100) UNIQUE NOT NULL,
        driver_name VARCHAR(255) NOT NULL,
        conductor_name VARCHAR(255) DEFAULT 'N/A',
        capacity INTEGER NOT NULL DEFAULT 40,
        filled INTEGER NOT NULL DEFAULT 0,
        route_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'Active',
        stops JSONB DEFAULT '[]'::jsonb,
        students JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_buses_bus_no ON buses(bus_no);
      CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(status);
    `);

    console.log('✅ PostgreSQL buses table verified/created.');

    // 1. Migrate MongoDB buses if found
    if (mongoBuses.length > 0) {
      for (const b of mongoBuses) {
        const id = b._id.toString();
        const busNo = (b.busNo || `BUS-${id.slice(-4)}`).trim();
        const driverName = (b.driverName || 'Driver').trim();
        const conductorName = (b.conductorName || 'Conductor').trim();
        const capacity = Number(b.capacity) || 40;
        const routeName = (b.routeName || 'Campus Line').trim();
        const status = b.status || 'Active';
        
        const stops = (b.stops || []).map(s => ({
          stationName: s.stationName || s.name || 'Station',
          price: Number(s.price) || 0
        }));

        const students = (b.students || []).map(st => ({
          student: st.student ? (st.student._id ? st.student._id.toString() : st.student.toString()) : '',
          stopName: st.stopName || '',
          fare: Number(st.fare) || 0,
          paymentStatus: st.paymentStatus || 'Pending',
          paymentDate: st.paymentDate || null,
          transactionId: st.transactionId || null
        })).filter(st => Boolean(st.student));

        const filled = students.length;

        await pg.query(`
          INSERT INTO buses (
            id, bus_no, driver_name, conductor_name, capacity, filled, route_name, status, stops, students, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, NOW()), NOW())
          ON CONFLICT (bus_no) DO UPDATE SET
            driver_name = EXCLUDED.driver_name,
            conductor_name = EXCLUDED.conductor_name,
            capacity = EXCLUDED.capacity,
            filled = EXCLUDED.filled,
            route_name = EXCLUDED.route_name,
            status = EXCLUDED.status,
            stops = EXCLUDED.stops,
            students = EXCLUDED.students,
            updated_at = NOW()
        `, [
          id,
          busNo,
          driverName,
          conductorName,
          capacity,
          filled,
          routeName,
          status,
          JSON.stringify(stops),
          JSON.stringify(students),
          b.createdAt ? new Date(b.createdAt) : null
        ]);

        console.log(`  ✓ Synced bus: ${busNo} (${filled}/${capacity} passengers, ${stops.length} stops)`);
      }
    } else {
      // 2. If no MongoDB buses, insert default demo seed buses
      for (const d of DEMO_SEED_BUSES) {
        const id = `bus_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await pg.query(`
          INSERT INTO buses (
            id, bus_no, driver_name, conductor_name, capacity, filled, route_name, status, stops, students
          ) VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, '[]'::jsonb)
          ON CONFLICT (bus_no) DO NOTHING
        `, [
          id,
          d.busNo,
          d.driverName,
          d.conductorName,
          d.capacity,
          d.routeName,
          d.status,
          JSON.stringify(d.stops)
        ]);
        console.log(`  ✓ Seeded default bus: ${d.busNo}`);
      }
    }

    const countRes = await pg.query('SELECT COUNT(*) as total FROM buses');
    console.log(`🎉 Total buses in PostgreSQL: ${countRes.rows[0].total}`);

  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    pg.release();
    await pool.end();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

run().catch(console.error);
