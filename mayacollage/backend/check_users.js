import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mayaerp';

async function check() {
    await mongoose.connect(MONGO_URI);
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
}

check();
