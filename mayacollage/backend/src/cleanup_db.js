/**
 * Maya ERP — Database Cleanup Script
 * =====================================
 * Deletes ALL data from the database EXCEPT:
 *   ✅ Students       (real student data - B.Pharm 2023-27)
 *   ✅ Courses        (B.Pharm course definition)
 *   ✅ Branches       (Pharmacy branch — referenced by courses)
 *   ✅ Users/Admin    (Admin, Office, Staff logins — needed to access ERP)
 *
 * DELETED (dummy/seed/unwanted data):
 *   ❌ Attendance records
 *   ❌ Books
 *   ❌ Bus/Transport routes
 *   ❌ Fee Transactions
 *   ❌ Applications
 *   ❌ Inquiries
 *   ❌ Inventory Items
 *   ❌ Issued Books
 *   ❌ Lab Issues
 *   ❌ Labs
 *   ❌ Leaves
 *   ❌ Library Settings
 *   ❌ Notices
 *   ❌ Shelves
 *   ❌ Faculty (assignment records)
 *   ❌ Subject-Lab Mappings
 *   ❌ Subjects
 *   ❌ Timetables
 *
 * Run: node src/cleanup_db.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: 'C:\\Users\\Lalit\\Downloads\\mayaerp\\mayaerp\\admin\\.env' });

// ── Import ALL models ─────────────────────────────────────────────────────────
import { Student } from './models/studentModel.js';
import Course from './models/courseModel.js';
import Branch from './models/branchModel.js';
import { User } from './models/userModels.js';

// Models to DELETE
import mongoose_pkg from 'mongoose';
const { connection } = mongoose_pkg;

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/maya_erp');
        console.log('📡 Connected to MongoDB\n');

        // ── Count before cleanup ──────────────────────────────────────────────
        const collections = await connection.db.listCollections().toArray();
        console.log('📋 Current collections in database:');
        for (const col of collections) {
            const count = await connection.db.collection(col.name).countDocuments();
            console.log(`   ${col.name}: ${count} documents`);
        }
        console.log('');

        // ── PRESERVE these collections ────────────────────────────────────────
        const KEEP = ['students', 'courses', 'branches', 'users'];

        // ── DELETE all other collections ──────────────────────────────────────
        const results = [];

        for (const col of collections) {
            const name = col.name;

            if (KEEP.includes(name)) {
                const count = await connection.db.collection(name).countDocuments();
                console.log(`  ✅ KEEPING   [${name}]  (${count} documents)`);
                results.push({ name, action: 'KEPT', count });
                continue;
            }

            // Delete all documents in this collection
            const result = await connection.db.collection(name).deleteMany({});
            console.log(`  🗑️  DELETED   [${name}]  (${result.deletedCount} documents removed)`);
            results.push({ name, action: 'DELETED', count: result.deletedCount });
        }

        // ── Verify kept data ──────────────────────────────────────────────────
        const studentCount = await Student.countDocuments();
        const courseCount  = await Course.countDocuments();
        const branchCount  = await Branch.countDocuments();
        const userCount    = await User.countDocuments();

        // ── Summary ───────────────────────────────────────────────────────────
        const deleted = results.filter(r => r.action === 'DELETED');
        const totalDeletedDocs = deleted.reduce((sum, r) => sum + r.count, 0);

        console.log(`
╔══════════════════════════════════════════════════════════╗
║            Maya ERP Database Cleanup Complete!           ║
╠══════════════════════════════════════════════════════════╣
║  PRESERVED DATA:                                         ║
║   👨‍🎓 Students         : ${String(studentCount).padEnd(31)} ║
║   📚 Courses           : ${String(courseCount).padEnd(31)} ║
║   🏫 Branches          : ${String(branchCount).padEnd(31)} ║
║   👤 Admin/Staff Users : ${String(userCount).padEnd(31)} ║
╠══════════════════════════════════════════════════════════╣
║  DELETED:                                                ║
║   🗑️  Collections Cleared : ${String(deleted.length).padEnd(28)} ║
║   🗑️  Total Docs Removed  : ${String(totalDeletedDocs).padEnd(28)} ║
╠══════════════════════════════════════════════════════════╣
║  Collections deleted:                                    ║
${deleted.map(d => `║   • ${d.name.padEnd(52)} ║`).join('\n')}
╚══════════════════════════════════════════════════════════╝
        `);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

run();
