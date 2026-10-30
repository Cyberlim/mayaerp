import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    firstName: { type: String, default: 'Maya' },
    lastName: { type: String, default: 'User' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        required: true, 
        enum: ['Admin', 'Super Admin', 'Staff', 'Faculty', 'Accountant', 'Librarian', 'Library', 'HOD', 'Principal', 'Office', 'Lab', 'Lab Assistant', 'Student'] 
    },
    status: { type: String, default: 'Active' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    dob: { type: String, default: '' },
    gender: { type: String, default: '' },
    employeeId: { type: String, default: '' },
    profilePhoto: { type: String, default: '' },
    department: { type: String, default: '' },
    designation: { type: String, default: '' }
}, { timestamps: true, discriminatorKey: 'role', strict: false });

export const User = mongoose.models.User || mongoose.model('User', userSchema);

