import Lab from '../models/labModel.js';
import { User } from '../models/userModels.js';

// @desc Get all labs (with faculty populated)
export const getAllLabs = async (req, res) => {
    try {
        const labs = await Lab.find().populate('labIncharge', 'firstName lastName email role department');
        res.json(labs);
    } catch (error) {
        console.error('Error in getAllLabs:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc Get single lab
export const getLabById = async (req, res) => {
    try {
        const lab = await Lab.findById(req.params.id).populate('labIncharge', 'firstName lastName email role department');
        if (!lab) return res.status(404).json({ message: 'Lab not found' });
        res.json(lab);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc Create a new lab
export const createLab = async (req, res) => {
    try {
        const { labName, roomNumber, capacity, labType, labIncharge, description } = req.body;

        // Validate incharge faculty exists
        const faculty = await User.findById(labIncharge);
        if (!faculty) return res.status(400).json({ message: 'Selected faculty not found' });

        const lab = await Lab.create({ labName, roomNumber, capacity, labType, labIncharge, description });
        const populated = await lab.populate('labIncharge', 'firstName lastName email');
        res.status(201).json({ message: 'Lab created successfully', lab: populated });
    } catch (error) {
        console.error('Error in createLab:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc Update a lab
export const updateLab = async (req, res) => {
    try {
        const lab = await Lab.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('labIncharge', 'firstName lastName email');
        if (!lab) return res.status(404).json({ message: 'Lab not found' });
        res.json({ message: 'Lab updated successfully', lab });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc Delete a lab
export const deleteLab = async (req, res) => {
    try {
        const lab = await Lab.findByIdAndDelete(req.params.id);
        if (!lab) return res.status(404).json({ message: 'Lab not found' });
        res.json({ message: 'Lab deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
