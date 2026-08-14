import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/userModels.js';
import { Student } from '../models/studentModel.js';
import Branch from '../models/branchModel.js';
import Course from '../models/courseModel.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
                profilePhoto: user.profilePhoto,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const studentLogin = async (req, res) => {
    const { loginId, password } = req.body;
    console.log('Student Login attempt:', { loginId });

    try {
        // Find student by email, studentId, or admissionNumber (case-insensitive)
        const student = await Student.findOne({
            $or: [
                { email: loginId },
                { studentId: { $regex: new RegExp(`^${loginId}$`, 'i') } },
                { admissionNumber: { $regex: new RegExp(`^${loginId}$`, 'i') } }
            ]
        });

        if (!student) {
            console.log('Student not found for:', loginId);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate password candidates to handle inconsistent DOB formats
        const passwordCandidates = [password];
        
        const cleanPassword = password.trim();
        if (cleanPassword !== password) {
            passwordCandidates.push(cleanPassword);
        }
        
        if (/^\d{8}$/.test(cleanPassword)) {
            // DDMMYYYY
            const dd = cleanPassword.substring(0, 2);
            const mm = cleanPassword.substring(2, 4);
            const yyyy = cleanPassword.substring(4, 8);
            passwordCandidates.push(`${dd}/${mm}/${yyyy}`);
            passwordCandidates.push(`${dd}-${mm}-${yyyy}`);
            
            // YYYYMMDD
            const y4 = cleanPassword.substring(0, 4);
            const m2 = cleanPassword.substring(4, 6);
            const d2 = cleanPassword.substring(6, 8);
            passwordCandidates.push(`${y4}-${m2}-${d2}`);
            passwordCandidates.push(`${d2}/${m2}/${y4}`);
        }
        
        if (cleanPassword.includes('/')) {
            passwordCandidates.push(cleanPassword.replace(/\//g, ''));
            passwordCandidates.push(cleanPassword.replace(/\//g, '-'));
        }
        
        if (cleanPassword.includes('-')) {
            passwordCandidates.push(cleanPassword.replace(/-/g, ''));
            passwordCandidates.push(cleanPassword.replace(/-/g, '/'));
        }
        
        const uniqueCandidates = [...new Set(passwordCandidates)];
        console.log('Password candidates to check:', uniqueCandidates);
        
        let isMatch = false;
        for (const candidate of uniqueCandidates) {
            if (await bcrypt.compare(candidate, student.password)) {
                isMatch = true;
                break;
            }
        }
        console.log('Password match status:', isMatch);

        if (isMatch) {
            const { password, ...studentData } = student.toObject();
            
            // Try to lookup branch and course names if they are IDs
            let branchName = student.selectedBranch;
            let courseName = student.selectedProgram;

            try {
                if (mongoose.Types.ObjectId.isValid(student.selectedBranch)) {
                    const branch = await Branch.findById(student.selectedBranch);
                    if (branch) branchName = branch.name;
                }
                
                if (mongoose.Types.ObjectId.isValid(student.selectedProgram)) {
                    const course = await Course.findById(student.selectedProgram);
                    if (course) courseName = course.name;
                }
            } catch (err) {
                console.error("Lookup failed:", err);
            }

            res.json({
                ...studentData,
                selectedBranch: studentData.selectedBranch, // Keep original ID
                selectedProgram: studentData.selectedProgram, // Keep original ID
                selectedBranchName: branchName,
                selectedProgramName: courseName,
                branchName: branchName, // Fallback
                courseName: courseName, // Fallback
                role: 'student',
                token: generateToken(student._id),
                profilePhoto: studentData.applicantPhoto
            });
        } else {
            console.log('Password mismatch for:', loginId);
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const register = async (req, res) => {
    // Registration moved to userController
    res.status(501).json({ message: 'Registration is handled via User Management' });
};

export const getMe = async (req, res) => {
    // Auth middleware should populate req.user, but for now just returning authorized
    res.json({ message: 'Authorized' });
};
