import mongoose from 'mongoose';
import Lab from '../src/models/labModel.js';
import { User } from '../src/models/userModels.js';
import dotenv from 'dotenv';

dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        
        const labs = await Lab.find();
        console.log(`Found ${labs.length} labs`);
        
        for (const lab of labs) {
            console.log(`Lab: ${lab.labName}, Incharge: ${lab.labIncharge}`);
            try {
                await lab.populate('labIncharge');
                console.log(`  Populated: ${lab.labIncharge ? lab.labIncharge.email : 'null'}`);
            } catch (popError) {
                console.error(`  Populate Error for lab ${lab._id}:`, popError.message);
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Test Error:', error);
        process.exit(1);
    }
};

test();
