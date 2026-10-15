/**
 * MongoDB to PostgreSQL Migration & Seeding for Labs, Lab Inventory, Lab Issues, and Subject Lab Mappings.
 */
const mongoose = require('mongoose');
const { Pool } = require('pg');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://thestudentzilla_db_user:NL2wc3tgnB6EzpPl@mayacollage.ktxtgpi.mongodb.net/';
const PG_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_pADeFi9rGlU2@ep-royal-field-b4fsklle-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: PG_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('🚀 Connecting to MongoDB and PostgreSQL...');
  const pgClient = await pool.connect();
  await mongoose.connect(MONGO_URI);
  const mongoDb = mongoose.connection.db;

  try {
    console.log('📦 Creating PostgreSQL tables for Labs...');

    await pgClient.query(`
      -- Labs / Lab Facilities Table
      CREATE TABLE IF NOT EXISTS labs (
        id VARCHAR(64) PRIMARY KEY,
        lab_name VARCHAR(255) NOT NULL,
        room_number VARCHAR(100) NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 30,
        lab_type VARCHAR(100) NOT NULL DEFAULT 'Computer',
        lab_incharge VARCHAR(64),
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Lab Inventory Items Table
      CREATE TABLE IF NOT EXISTS lab_inventory (
        id VARCHAR(64) PRIMARY KEY,
        item_name VARCHAR(255) NOT NULL,
        item_code VARCHAR(100) UNIQUE,
        category VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        available_quantity INTEGER NOT NULL DEFAULT 0,
        lab_id VARCHAR(64) REFERENCES labs(id) ON DELETE CASCADE,
        condition VARCHAR(100) DEFAULT 'Good',
        low_stock_threshold INTEGER DEFAULT 5,
        description TEXT,
        purchase_date TIMESTAMPTZ,
        purchase_cost NUMERIC(12,2) DEFAULT 0,
        vendor VARCHAR(255),
        is_issuable BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Lab Issues / Circulation Table
      CREATE TABLE IF NOT EXISTS lab_issues (
        id VARCHAR(64) PRIMARY KEY,
        transaction_id VARCHAR(100) UNIQUE NOT NULL,
        item_id VARCHAR(64) REFERENCES lab_inventory(id) ON DELETE CASCADE,
        lab_id VARCHAR(64) REFERENCES labs(id) ON DELETE SET NULL,
        issued_to VARCHAR(64) NOT NULL,
        issued_to_model VARCHAR(50) NOT NULL DEFAULT 'Student',
        issued_to_name VARCHAR(255),
        issued_to_id VARCHAR(100),
        quantity_issued INTEGER NOT NULL DEFAULT 1,
        issue_date TIMESTAMPTZ DEFAULT NOW(),
        expected_return_date TIMESTAMPTZ,
        return_date TIMESTAMPTZ,
        status VARCHAR(50) DEFAULT 'Issued',
        remarks TEXT,
        issued_by VARCHAR(64),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Subject Lab Mappings Table
      CREATE TABLE IF NOT EXISTS subject_lab_mappings (
        id VARCHAR(64) PRIMARY KEY,
        subject VARCHAR(255) NOT NULL,
        course VARCHAR(255) NOT NULL,
        branch VARCHAR(255) NOT NULL,
        semester VARCHAR(100) NOT NULL,
        lab_id VARCHAR(64) REFERENCES labs(id) ON DELETE CASCADE,
        faculty_id VARCHAR(64),
        academic_year VARCHAR(50) DEFAULT '2024-2025',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Fast Indexing
      CREATE INDEX IF NOT EXISTS idx_labs_active ON labs(is_active);
      CREATE INDEX IF NOT EXISTS idx_inventory_lab ON lab_inventory(lab_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_category ON lab_inventory(category);
      CREATE INDEX IF NOT EXISTS idx_issues_item ON lab_issues(item_id);
      CREATE INDEX IF NOT EXISTS idx_issues_status ON lab_issues(status);
      CREATE INDEX IF NOT EXISTS idx_issues_issued_to ON lab_issues(issued_to);
      CREATE INDEX IF NOT EXISTS idx_lab_mapping_lab ON subject_lab_mappings(lab_id);
    `);
    console.log('✅ Tables created or verified.');

    // Check existing data in MongoDB
    const mongoLabs = await mongoDb.collection('labfacilities').find({}).toArray();
    console.log(`Found ${mongoLabs.length} labs in MongoDB.`);

    const mongoItems = await mongoDb.collection('inventoryitems').find({}).toArray();
    console.log(`Found ${mongoItems.length} inventory items in MongoDB.`);

    const mongoIssues = await mongoDb.collection('labissues').find({}).toArray();
    console.log(`Found ${mongoIssues.length} lab issues in MongoDB.`);

    const mongoMappings = await mongoDb.collection('subjectlabmappings').find({}).toArray();
    console.log(`Found ${mongoMappings.length} subject lab mappings in MongoDB.`);

    // Check staff/users in MongoDB or Postgres for lab in-charge
    const mongoUsers = await mongoDb.collection('users').find({}).toArray();
    console.log(`Found ${mongoUsers.length} users in MongoDB.`);

    // 1. Seed/Migrate Labs
    let labIdMap = {};
    if (mongoLabs.length > 0) {
      for (const lab of mongoLabs) {
        const id = lab._id.toString();
        labIdMap[id] = id;
        await pgClient.query(`
          INSERT INTO labs (id, lab_name, room_number, capacity, lab_type, lab_incharge, description, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            lab_name = EXCLUDED.lab_name,
            room_number = EXCLUDED.room_number,
            capacity = EXCLUDED.capacity,
            lab_type = EXCLUDED.lab_type,
            lab_incharge = EXCLUDED.lab_incharge,
            description = EXCLUDED.description,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();
        `, [
          id,
          lab.labName || 'Advanced Lab',
          lab.roomNumber || 'LH-101',
          lab.capacity || 40,
          lab.labType || 'Computer',
          lab.labIncharge ? lab.labIncharge.toString() : null,
          lab.description || '',
          lab.isActive !== false,
          lab.createdAt || new Date(),
          new Date()
        ]);
      }
      console.log(`✅ Migrated ${mongoLabs.length} labs from MongoDB.`);
    } else {
      // Seed default modern institutional labs
      console.log('🌱 Seeding institutional default labs into PostgreSQL...');
      const defaultLabs = [
        {
          id: 'lab_cse_ai_01',
          lab_name: 'Artificial Intelligence & Data Systems Lab',
          room_number: 'CS-301',
          capacity: 45,
          lab_type: 'Computer',
          description: 'High-performance GPU cluster workstation facility for deep learning, NLP, and computer vision research.',
          is_active: true
        },
        {
          id: 'lab_robotics_02',
          lab_name: 'Advanced Robotics & Embedded Systems Lab',
          room_number: 'ME-105',
          capacity: 35,
          lab_type: 'Robotics',
          description: 'Industrial robotic arms, ROS development kits, Arduino/ESP32, and sensor interfacing workstations.',
          is_active: true
        },
        {
          id: 'lab_iot_03',
          lab_name: 'VLSI & IoT Network Systems Lab',
          room_number: 'EC-204',
          capacity: 40,
          lab_type: 'Engineering',
          description: 'Digital signal oscilloscopes, FPGA boards, Zigbee modules, and spectrum analyzers.',
          is_active: true
        },
        {
          id: 'lab_physics_04',
          lab_name: 'Applied Optics & Modern Physics Lab',
          room_number: 'SC-102',
          capacity: 50,
          lab_type: 'Physics',
          description: 'Spectrometers, laser interferometers, hall effect apparatus, and Planck constant setups.',
          is_active: true
        },
        {
          id: 'lab_chem_05',
          lab_name: 'Organic & Material Synthesis Lab',
          room_number: 'CH-201',
          capacity: 30,
          lab_type: 'Chemistry',
          description: 'Fume hoods, digital spectrophotometers, rotary evaporators, and analytical titration gear.',
          is_active: true
        }
      ];

      for (const lab of defaultLabs) {
        labIdMap[lab.id] = lab.id;
        await pgClient.query(`
          INSERT INTO labs (id, lab_name, room_number, capacity, lab_type, description, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING;
        `, [lab.id, lab.lab_name, lab.room_number, lab.capacity, lab.lab_type, lab.description, lab.is_active]);
      }
      console.log(`✅ Seeded ${defaultLabs.length} default labs.`);
    }

    // 2. Seed/Migrate Lab Inventory
    let itemIdMap = {};
    if (mongoItems.length > 0) {
      for (const item of mongoItems) {
        const id = item._id.toString();
        itemIdMap[id] = id;
        await pgClient.query(`
          INSERT INTO lab_inventory (id, item_name, item_code, category, quantity, available_quantity, lab_id, condition, low_stock_threshold, description, purchase_date, purchase_cost, vendor, is_issuable, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET
            item_name = EXCLUDED.item_name,
            item_code = EXCLUDED.item_code,
            category = EXCLUDED.category,
            quantity = EXCLUDED.quantity,
            available_quantity = EXCLUDED.available_quantity,
            lab_id = EXCLUDED.lab_id,
            condition = EXCLUDED.condition,
            low_stock_threshold = EXCLUDED.low_stock_threshold,
            description = EXCLUDED.description,
            purchase_date = EXCLUDED.purchase_date,
            purchase_cost = EXCLUDED.purchase_cost,
            vendor = EXCLUDED.vendor,
            is_issuable = EXCLUDED.is_issuable,
            updated_at = NOW();
        `, [
          id,
          item.itemName,
          item.itemCode || `ITEM-${id.slice(-6).toUpperCase()}`,
          item.category || 'Equipment',
          item.quantity || 0,
          item.availableQuantity !== undefined ? item.availableQuantity : item.quantity,
          item.lab ? item.lab.toString() : null,
          item.condition || 'Good',
          item.lowStockThreshold || 5,
          item.description || '',
          item.purchaseDate || new Date(),
          item.purchaseCost || 0,
          item.vendor || '',
          item.isIssuable !== false,
          item.createdAt || new Date(),
          new Date()
        ]);
      }
      console.log(`✅ Migrated ${mongoItems.length} inventory items from MongoDB.`);
    } else {
      console.log('🌱 Seeding rich inventory items into PostgreSQL...');
      const defaultItems = [
        {
          id: 'inv_gpu_workstation_01',
          item_name: 'NVIDIA RTX 4090 AI Workstation 64GB',
          item_code: 'EQ-GPU-4090',
          category: 'Computer',
          quantity: 20,
          available_quantity: 18,
          lab_id: 'lab_cse_ai_01',
          condition: 'Good',
          low_stock_threshold: 4,
          description: 'Intel i9 14th Gen, RTX 4090 24GB, 64GB DDR5, 2TB NVMe',
          purchase_cost: 285000,
          vendor: 'Dell Technologies Enterprise',
          is_issuable: false
        },
        {
          id: 'inv_jetson_nano_02',
          item_name: 'NVIDIA Jetson Orin Nano Developer Kit',
          item_code: 'KIT-JETSON-01',
          category: 'Microcontroller',
          quantity: 30,
          available_quantity: 24,
          lab_id: 'lab_cse_ai_01',
          condition: 'Good',
          low_stock_threshold: 6,
          description: 'Edge AI processing kits with camera modules and carrier boards.',
          purchase_cost: 45000,
          vendor: 'Arrow Electronics',
          is_issuable: true
        },
        {
          id: 'inv_dso_rigol_03',
          item_name: 'Rigol 100MHz 4-Channel Digital Storage Oscilloscope',
          item_code: 'EQ-DSO-1004',
          category: 'Electronics',
          quantity: 15,
          available_quantity: 12,
          lab_id: 'lab_iot_03',
          condition: 'Good',
          low_stock_threshold: 3,
          description: '100MHz bandwidth, 1GSa/s sampling rate, color TFT display.',
          purchase_cost: 38000,
          vendor: 'Rigol Technologies India',
          is_issuable: true
        },
        {
          id: 'inv_esp32_iot_04',
          item_name: 'ESP32-S3 WROOM IoT Development Module Pack',
          item_code: 'DEV-ESP32-S3',
          category: 'Microcontroller',
          quantity: 60,
          available_quantity: 52,
          lab_id: 'lab_iot_03',
          condition: 'Good',
          low_stock_threshold: 10,
          description: 'Dual-core Xtensa 32-bit LX7, 2.4 GHz Wi-Fi & Bluetooth 5 (LE).',
          purchase_cost: 1200,
          vendor: 'RoboCraze Components',
          is_issuable: true
        },
        {
          id: 'inv_robotic_arm_05',
          item_name: '6-DOF Programmable Robotic Manipulator Arm',
          item_code: 'ROB-6DOF-ARM',
          category: 'Equipment',
          quantity: 8,
          available_quantity: 6,
          lab_id: 'lab_robotics_02',
          condition: 'Good',
          low_stock_threshold: 2,
          description: 'Heavy duty metal gear servos, vacuum gripper, ROS2 drivers.',
          purchase_cost: 95000,
          vendor: 'Hiwonder Robotics',
          is_issuable: true
        },
        {
          id: 'inv_spectrometer_06',
          item_name: 'UV-Visible Double Beam Spectrophotometer',
          item_code: 'OPT-UV-SPEC',
          category: 'Equipment',
          quantity: 5,
          available_quantity: 3,
          lab_id: 'lab_chem_05',
          condition: 'Good',
          low_stock_threshold: 2,
          description: '190-1100 nm wavelength range with quartz cuvettes.',
          purchase_cost: 165000,
          vendor: 'Shimadzu Analytical India',
          is_issuable: false
        },
        {
          id: 'inv_he_ne_laser_07',
          item_name: 'He-Ne Optical Laser Interference Kit (632.8nm)',
          item_code: 'PHY-LASER-632',
          category: 'Equipment',
          quantity: 12,
          available_quantity: 10,
          lab_id: 'lab_physics_04',
          condition: 'Good',
          low_stock_threshold: 3,
          description: 'Optical bench, diffraction gratings, photodiode detectors.',
          purchase_cost: 54000,
          vendor: 'Holmarc Opto-Mechatronics',
          is_issuable: true
        }
      ];

      for (const it of defaultItems) {
        itemIdMap[it.id] = it.id;
        await pgClient.query(`
          INSERT INTO lab_inventory (id, item_name, item_code, category, quantity, available_quantity, lab_id, condition, low_stock_threshold, description, purchase_cost, vendor, is_issuable)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO NOTHING;
        `, [it.id, it.item_name, it.item_code, it.category, it.quantity, it.available_quantity, it.lab_id, it.condition, it.low_stock_threshold, it.description, it.purchase_cost, it.vendor, it.is_issuable]);
      }
      console.log(`✅ Seeded ${defaultItems.length} default inventory items.`);
    }

    // 3. Seed/Migrate Lab Issues
    if (mongoIssues.length > 0) {
      for (const issue of mongoIssues) {
        const id = issue._id.toString();
        await pgClient.query(`
          INSERT INTO lab_issues (id, transaction_id, item_id, lab_id, issued_to, issued_to_model, issued_to_name, issued_to_id, quantity_issued, issue_date, expected_return_date, return_date, status, remarks, issued_by, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            return_date = EXCLUDED.return_date,
            remarks = EXCLUDED.remarks,
            updated_at = NOW();
        `, [
          id,
          issue.transactionId || `TRX-${id.slice(-8)}`,
          issue.item ? issue.item.toString() : null,
          issue.lab ? issue.lab.toString() : null,
          issue.issuedTo ? issue.issuedTo.toString() : 'UNKNOWN',
          issue.issuedToModel || 'Student',
          issue.issuedToName || 'Student',
          issue.issuedToId || 'N/A',
          issue.quantityIssued || 1,
          issue.issueDate || new Date(),
          issue.expectedReturnDate || new Date(Date.now() + 7*24*60*60*1000),
          issue.returnDate || null,
          issue.status || 'Issued',
          issue.remarks || '',
          issue.issuedBy ? issue.issuedBy.toString() : null,
          issue.createdAt || new Date(),
          new Date()
        ]);
      }
      console.log(`✅ Migrated ${mongoIssues.length} lab issues from MongoDB.`);
    } else {
      console.log('🌱 Seeding initial circulation / issue records into PostgreSQL...');
      // Get a few student IDs from PostgreSQL students table
      const studentRes = await pgClient.query(`SELECT id, first_name, last_name, student_id FROM students LIMIT 5;`);
      const students = studentRes.rows;

      if (students.length > 0) {
        const defaultIssues = [
          {
            id: 'issue_001',
            transaction_id: 'TRX-LAB-8921',
            item_id: 'inv_jetson_nano_02',
            lab_id: 'lab_cse_ai_01',
            issued_to: students[0].id,
            issued_to_model: 'Student',
            issued_to_name: `${students[0].first_name} ${students[0].last_name}`.trim(),
            issued_to_id: students[0].student_id || students[0].id,
            quantity_issued: 1,
            issue_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            expected_return_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            status: 'Issued',
            remarks: 'Final year capstone object detection project module'
          },
          {
            id: 'issue_002',
            transaction_id: 'TRX-LAB-8922',
            item_id: 'inv_dso_rigol_03',
            lab_id: 'lab_iot_03',
            issued_to: students[1] ? students[1].id : students[0].id,
            issued_to_model: 'Student',
            issued_to_name: students[1] ? `${students[1].first_name} ${students[1].last_name}`.trim() : 'Aditya Sharma',
            issued_to_id: students[1]?.student_id || '2024CSE012',
            quantity_issued: 1,
            issue_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            expected_return_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: 'Overdue',
            remarks: 'RF modulation lab practical verification'
          },
          {
            id: 'issue_003',
            transaction_id: 'TRX-LAB-8923',
            item_id: 'inv_esp32_iot_04',
            lab_id: 'lab_iot_03',
            issued_to: students[2] ? students[2].id : students[0].id,
            issued_to_model: 'Student',
            issued_to_name: students[2] ? `${students[2].first_name} ${students[2].last_name}`.trim() : 'Pooja Verma',
            issued_to_id: students[2]?.student_id || '2024ECE005',
            quantity_issued: 2,
            issue_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            expected_return_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            return_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            status: 'Returned',
            remarks: 'Returned in good working condition'
          }
        ];

        for (const iss of defaultIssues) {
          await pgClient.query(`
            INSERT INTO lab_issues (id, transaction_id, item_id, lab_id, issued_to, issued_to_model, issued_to_name, issued_to_id, quantity_issued, issue_date, expected_return_date, return_date, status, remarks)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (id) DO NOTHING;
          `, [iss.id, iss.transaction_id, iss.item_id, iss.lab_id, iss.issued_to, iss.issued_to_model, iss.issued_to_name, iss.issued_to_id, iss.quantity_issued, iss.issue_date, iss.expected_return_date, iss.return_date || null, iss.status, iss.remarks]);
        }
        console.log(`✅ Seeded ${defaultIssues.length} sample issue records.`);
      }
    }

    // 4. Seed/Migrate Subject Lab Mappings
    if (mongoMappings.length > 0) {
      for (const map of mongoMappings) {
        const id = map._id.toString();
        await pgClient.query(`
          INSERT INTO subject_lab_mappings (id, subject, course, branch, semester, lab_id, faculty_id, academic_year, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            subject = EXCLUDED.subject,
            course = EXCLUDED.course,
            branch = EXCLUDED.branch,
            semester = EXCLUDED.semester,
            lab_id = EXCLUDED.lab_id,
            faculty_id = EXCLUDED.faculty_id,
            academic_year = EXCLUDED.academic_year,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();
        `, [
          id,
          map.subject || 'Engineering Lab',
          map.course || 'B.Tech',
          map.branch || 'CSE',
          map.semester || 'Semester 4',
          map.lab ? map.lab.toString() : null,
          map.faculty ? map.faculty.toString() : null,
          map.academicYear || '2024-2025',
          map.isActive !== false,
          map.createdAt || new Date(),
          new Date()
        ]);
      }
      console.log(`✅ Migrated ${mongoMappings.length} subject lab mappings from MongoDB.`);
    } else {
      console.log('🌱 Seeding initial Subject Lab Mappings into PostgreSQL...');
      const defaultMappings = [
        {
          id: 'map_cse_ai_01',
          subject: 'Deep Learning & Neural Networks Practical',
          course: 'B.Tech Computer Science & Engineering',
          branch: 'School of Engineering (SOE)',
          semester: 'Semester 6',
          lab_id: 'lab_cse_ai_01',
          academic_year: '2024-2025',
          is_active: true
        },
        {
          id: 'map_iot_ec_02',
          subject: 'Embedded Systems & Microcontroller Lab',
          course: 'B.Tech Electronics & Communication',
          branch: 'School of Engineering (SOE)',
          semester: 'Semester 5',
          lab_id: 'lab_iot_03',
          academic_year: '2024-2025',
          is_active: true
        },
        {
          id: 'map_rob_me_03',
          subject: 'Kinematics & Robot Dynamics Lab',
          course: 'B.Tech Mechanical & Mechatronics',
          branch: 'School of Engineering (SOE)',
          semester: 'Semester 6',
          lab_id: 'lab_robotics_02',
          academic_year: '2024-2025',
          is_active: true
        },
        {
          id: 'map_chem_bsc_04',
          subject: 'Analytical Chemistry Lab',
          course: 'B.Sc Chemistry',
          branch: 'School of Sciences',
          semester: 'Semester 2',
          lab_id: 'lab_chem_05',
          academic_year: '2024-2025',
          is_active: true
        }
      ];

      for (const m of defaultMappings) {
        await pgClient.query(`
          INSERT INTO subject_lab_mappings (id, subject, course, branch, semester, lab_id, academic_year, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING;
        `, [m.id, m.subject, m.course, m.branch, m.semester, m.lab_id, m.academic_year, m.is_active]);
      }
      console.log(`✅ Seeded ${defaultMappings.length} subject lab mappings.`);
    }

    console.log('\n✨ ALL LAB DATA SUCCESSFULLY MIGRATED AND SEEDED IN POSTGRESQL! ✨');
  } catch (err) {
    console.error('❌ Migration Error:', err);
  } finally {
    pgClient.release();
    await mongoose.disconnect();
    await pool.end();
  }
}

run();
