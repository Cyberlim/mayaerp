/**
 * Maya ERP — Extreme Database Wipe
 * =====================================
 * Deletes ALL collections and data, EXCEPT:
 *   ✅ Users collection (but only keeps users with role === 'Admin')
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
// Load the env variables from the backend directory
dotenv.config({ path: 'C:\\Users\\Lalit\\OneDrive\\Desktop\\maya web or backend\\mayacollage\\backend\\.env' });

import { User } from './models/userModels.js';

import mongoose_pkg from 'mongoose';
const { connection } = mongoose_pkg;

const run = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error("MONGO_URI is missing from environment variables");
        }
        await mongoose.connect(uri);
        console.log('📡 Connected to MongoDB\n');

        const collections = await connection.db.listCollections().toArray();
        console.log('📋 Current collections in database:');
        
        let deletedCount = 0;

        for (const col of collections) {
            const name = col.name;

            if (name === 'users') {
                // Wipe all non-admins from the users collection
                const result = await User.deleteMany({ role: { $ne: 'Admin' } });
                console.log(`  🗑️  CLEANED   [users]  (${result.deletedCount} non-admin users removed)`);
                
                const remaining = await User.countDocuments();
                console.log(`  ✅ PRESERVED [users]  (${remaining} Admin users remaining)`);
                continue;
            }

            // Completely drop the other collections
            await connection.db.dropCollection(name);
            console.log(`  🔥 DROPPED   [${name}] collection completely.`);
            deletedCount++;
        }

        console.log(`\n✅ Database Wipe Complete! ${deletedCount} collections dropped.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during wipe:', error);
        process.exit(1);
    }
};

run();
