import Faculty from '../models/facultyModel.js';
import { User } from '../models/userModels.js';

export const addFaculty = async (req, res) => {
    try {
        console.log('Adding Faculty:', req.body);
        const faculty = new Faculty(req.body);
        await faculty.save();
        res.status(201).json(faculty);
    } catch (error) {
        console.error('Add Faculty Error:', error);
        res.status(400).json({ 
            message: error.message, 
            errors: error.errors 
        });
    }
};

export const getCourseFaculty = async (req, res) => {
    try {
        const faculty = await Faculty.find({ courseId: req.params.courseId }).populate('userId', 'firstName lastName email profilePhoto role department');
        res.status(200).json(faculty);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteFaculty = async (req, res) => {
    try {
        await Faculty.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Faculty removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get ALL faculty/staff users for dropdowns (used by Lab Management)
export const getAllFacultyUsers = async (req, res) => {
    try {
        const faculty = await User.find(
            { role: { $in: ['Faculty', 'Staff', 'HOD', 'Principal', 'Lab'] }, status: 'Active' },
            'firstName lastName email department role employeeId profilePhoto'
        ).sort({ firstName: 1 });
        res.json(faculty);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
