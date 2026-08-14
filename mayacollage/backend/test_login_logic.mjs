import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from './src/models/User.js';

dotenv.config({ path: '.env.local' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // 1. Create a user exactly like API does
        const email = 'test_login_staff@mayaerp.com';
        await User.deleteOne({ email });
        
        let password = 'password123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new User({
            firstName: 'Test',
            lastName: 'Login',
            email,
            password: hashedPassword,
            role: 'Staff'
        });
        await newUser.save();
        
        console.log("Created user with hash:", newUser.password);
        
        // 2. Try to log in exactly like login API does
        const user = await User.findOne({ email });
        let isMatch = await bcrypt.compare(password, user.password);
        
        console.log("Password match result:", isMatch);
        
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

run();
