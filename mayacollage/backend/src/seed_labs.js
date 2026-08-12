import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

import { User } from './models/userModels.js';
import LabFacility from './models/labModel.js';

dotenv.config();

const labsData = [
    {
        labName: 'Computer Science Lab 1',
        roomNumber: 'CS-101',
        capacity: 40,
        labType: 'Computer',
        description: 'Primary computer lab for undergraduate studies.'
    },
    {
        labName: 'Advanced Robotics Lab',
        roomNumber: 'RB-205',
        capacity: 25,
        labType: 'Robotics',
        description: 'Specialized lab for robotics and automation projects.'
    },
    {
        labName: 'General Chemistry Lab',
        roomNumber: 'CH-302',
        capacity: 30,
        labType: 'Chemistry',
        description: 'Standard chemistry laboratory for first-year students.'
    },
    {
        labName: 'Quantum Physics Research Lab',
        roomNumber: 'PH-410',
        capacity: 15,
        labType: 'Physics',
        description: 'Research facility for quantum mechanics experiments.'
    },
    {
        labName: 'Mechanical Engineering Workshop',
        roomNumber: 'EN-105',
        capacity: 50,
        labType: 'Engineering',
        description: 'Main workshop for mechanical engineering students.'
    },
    {
        labName: 'Digital Media Studio',
        roomNumber: 'MS-501',
        capacity: 20,
        labType: 'Media',
        description: 'Creative studio for digital content creation and media studies.'
    }
];

const seedLabs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/maya_erp');
        console.log('Connected to MongoDB for lab seeding...');

        // Find the Lab Coordinator or a default Faculty
        const labIncharge = await User.findOne({ role: 'Lab' }) || await User.findOne({ role: 'Faculty' });

        if (!labIncharge) {
            console.error('No suitable Lab Incharge user found. Please run seed.js first.');
            process.exit(1);
        }

        console.log(`Using ${labIncharge.name} (${labIncharge.email}) as Lab Incharge.`);

        // Clear existing labs
        await LabFacility.deleteMany({});

        // Add incharge ID to each lab
        const labsToSeed = labsData.map(lab => ({
            ...lab,
            labIncharge: labIncharge._id
        }));

        await LabFacility.insertMany(labsToSeed);

        console.log(`
    ✅ ${labsToSeed.length} Labs Seeded Successfully!
    
    Collection: LabFacility
    Default Incharge: ${labIncharge.email}
    `);

        process.exit();
    } catch (error) {
        console.error('Error seeding labs:', error);
        process.exit(1);
    }
};

seedLabs();
