import SubjectLabMapping from '../models/subjectLabMappingModel.js';

// @desc Get all subject-lab mappings
export const getAllMappings = async (req, res) => {
    try {
        const { course, branch, semester } = req.query;
        const filter = {};
        if (course) filter.course = course;
        if (branch) filter.branch = branch;
        if (semester) filter.semester = semester;

        const mappings = await SubjectLabMapping.find(filter)
            .populate('lab', 'labName roomNumber labType')
            .populate('faculty', 'firstName lastName email department');
        res.json(mappings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc Create a new mapping
export const createMapping = async (req, res) => {
    try {
        const { subject, course, branch, semester, lab, faculty, academicYear } = req.body;
        const mapping = await SubjectLabMapping.create({ subject, course, branch, semester, lab, faculty, academicYear });
        const populated = await mapping.populate([
            { path: 'lab', select: 'labName roomNumber' },
            { path: 'faculty', select: 'firstName lastName email' }
        ]);
        res.status(201).json({ message: 'Mapping created successfully', mapping: populated });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc Update a mapping
export const updateMapping = async (req, res) => {
    try {
        const mapping = await SubjectLabMapping.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('lab', 'labName roomNumber')
            .populate('faculty', 'firstName lastName email');
        if (!mapping) return res.status(404).json({ message: 'Mapping not found' });
        res.json({ message: 'Mapping updated', mapping });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc Delete a mapping
export const deleteMapping = async (req, res) => {
    try {
        const mapping = await SubjectLabMapping.findByIdAndDelete(req.params.id);
        if (!mapping) return res.status(404).json({ message: 'Mapping not found' });
        res.json({ message: 'Mapping deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
