import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    firstName: { type: String, default: 'Maya' },
    lastName: { type: String, default: 'User' },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        required: true, 
        enum: ['Admin', 'Staff', 'Faculty', 'Accountant', 'Librarian', 'Library', 'HOD', 'Principal', 'Office', 'Lab'] 
    },
    status: { type: String, default: 'Active' },
}, { discriminatorKey: 'role', strict: false });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
