import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

import bcrypt from 'bcryptjs';
import { Admin, OfficeStaff, Staff, Librarian, LabAdmin } from './models/userModels.js';

dotenv.config();

const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

import { User } from './models/userModels.js';

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/maya_erp');
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await Admin.deleteMany({});
        await OfficeStaff.deleteMany({});
        await Staff.deleteMany({});
        await Librarian.deleteMany({});
        await LabAdmin.deleteMany({});

        const plainPassword = 'Password@123';

        // Seed Admin
        await Admin.create({
            name: 'System Administrator',
            email: 'admin@mayaerp.com',
            password: plainPassword,
            role: 'Admin',
            department: 'Central Management'
        });

        // Seed Office
        await OfficeStaff.create({
            name: 'Office Head',
            email: 'office@mayaerp.com',
            password: plainPassword,
            role: 'Office',
            department: 'Administration'
        });

        // Seed Staff/Teachers
        await Staff.create({
            name: 'Senior Teacher',
            email: 'staff@mayaerp.com',
            password: plainPassword,
            role: 'Staff',
            department: 'Academic'
        });

        // Seed Faculty (for Lab assignment & mappings)
        await User.create([
            {
                name: 'Dr. Alan Turing',
                email: 'alan@mayaerp.com',
                password: plainPassword,
                role: 'Faculty',
                department: 'Computer Science'
            },
            {
                name: 'Prof. Marie Curie',
                email: 'marie@mayaerp.com',
                password: plainPassword,
                role: 'Faculty',
                department: 'Chemistry'
            },
            {
                name: 'Dr. Nikola Tesla',
                email: 'nikola@mayaerp.com',
                password: plainPassword,
                role: 'Faculty',
                department: 'Physics'
            }
        ]);

        // Seed Library
        await Librarian.create({
            name: 'Chief Librarian',
            email: 'library@mayaerp.com',
            password: plainPassword,
            role: 'Library',
            department: 'Books & Resources'
        });

        // Seed Lab
        await LabAdmin.create({
            name: 'Lab Coordinator',
            email: 'lab@mayaerp.com',
            password: plainPassword,
            role: 'Lab',
            department: 'Laboratories'
        });

        console.log(`
    ✅ Database Seeded Successfully!
    
    CREDENTIALS (All use the same password for testing):
    ---------------------------------------------------
    Password: ${plainPassword}
    
    1. Admin:   admin@mayaerp.com
    2. Office:  office@mayaerp.com
    3. Staff:   staff@mayaerp.com
    4. Library: library@mayaerp.com
    5. Lab:     lab@mayaerp.com
    ---------------------------------------------------
    `);

        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
