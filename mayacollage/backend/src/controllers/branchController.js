import Branch from '../models/branchModel.js';

const ICONS = ['architecture_rounded', 'biotech_rounded', 'business_center_rounded', 'computer_rounded', 'gavel_rounded', 'medical_services_rounded', 'palette_rounded', 'science_rounded'];
const COLORS = ['#4F46E5', '#EA580C', '#0D9488', '#E11D48', '#2563EB', '#65A30D', '#9333EA', '#0891B2'];

export const createBranch = async (req, res) => {
    try {
        const randomIcon = ICONS[Math.floor(Math.random() * ICONS.length)];
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

        const branch = new Branch({
            ...req.body,
            iconName: randomIcon,
            colorHex: randomColor
        });
        await branch.save();
        res.status(201).json(branch);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getAllBranches = async (req, res) => {
    try {
        const branches = await Branch.find().sort({ createdAt: -1 });
        res.status(200).json(branches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getBranchById = async (req, res) => {
    try {
        const branch = await Branch.findById(req.params.id);
        if (!branch) return res.status(404).json({ message: 'Branch not found' });
        res.status(200).json(branch);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateBranch = async (req, res) => {
    try {
        const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!branch) return res.status(404).json({ message: 'Branch not found' });
        res.status(200).json(branch);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteBranch = async (req, res) => {
    try {
        const branch = await Branch.findByIdAndDelete(req.params.id);
        if (!branch) return res.status(404).json({ message: 'Branch not found' });
        res.status(200).json({ message: 'Branch deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
