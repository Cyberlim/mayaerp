import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("MONGO_URI is missing from .env");
    process.exit(1);
}

async function migrate() {
    console.log("Connecting to MongoDB...");
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB!");

        const users_collection = mongoose.connection.db.collection('users');
        const users = await users_collection.find({}).toArray();

        console.log(`Found ${users.length} users. Migrating...`);

        for (const user of users) {
             // If they don't have firstName/lastName but have name
             if (user.name && (!user.firstName || !user.lastName)) {
                const parts = user.name.split(' ');
                const firstName = parts[0];
                const lastName = parts.length > 1 ? parts.slice(1).join(' ') : (user.lastName || 'User');
                
                await users_collection.updateOne(
                    { _id: user._id },
                    { $set: { firstName, lastName } }
                );
                console.log(`Updated user: ${user.name} -> ${firstName} ${lastName}`);
             }
        }

        console.log("Migration complete!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
