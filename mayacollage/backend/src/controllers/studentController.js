import { Student } from '../models/studentModel.js';
import { Application } from '../models/applicationModel.js';
import Branch from '../models/branchModel.js';
import Course from '../models/courseModel.js';

// ── BATCH SEMESTER UPDATE ──
export const batchUpdateSemester = async (req, res) => {
    try {
        const { sessionYear, selectedProgram, selectedBranch, newSemester } = req.body;

        if (!newSemester || isNaN(Number(newSemester))) {
            return res.status(400).json({ message: 'newSemester is required and must be a number' });
        }

        // Build filter — at minimum one of these must be provided
        const filter = {};
        if (sessionYear)       filter.sessionYear       = sessionYear;
        if (selectedProgram)   filter.selectedProgram   = selectedProgram;
        if (selectedBranch)    filter.selectedBranch    = selectedBranch;

        if (Object.keys(filter).length === 0) {
            return res.status(400).json({ message: 'At least one filter (sessionYear, selectedProgram, or selectedBranch) is required' });
        }

        // Count matching students before update
        const count = await Student.countDocuments(filter);
        if (count === 0) {
            return res.status(404).json({ message: 'No students found matching the given criteria' });
        }

        // Perform bulk update
        const result = await Student.updateMany(
            filter,
            { $set: { selectedSemester: Number(newSemester) } }
        );

        res.status(200).json({
            message: `Semester updated to ${newSemester} for ${result.modifiedCount} students`,
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount,
            newSemester: Number(newSemester),
        });
    } catch (error) {
        console.error('batchUpdateSemester error:', error);
        res.status(500).json({ message: 'Error updating semester', error: error.message });
    }
};

export const createStudent = async (req, res) => {
    try {
        const studentData = req.body;

        // Auto-generate Admission Number: [Year][CourseFirstWord][BranchFirstLetter][SerialNo]
        // e.g., 2024BTECHE001 (2024 + BTECH + E + 001)
        if (studentData.selectedProgram && studentData.selectedBranch && studentData.sessionYear) {
            const course = await Course.findById(studentData.selectedProgram);
            const branch = await Branch.findById(studentData.selectedBranch);
            
            if (course && branch) {
                const yearPrefix = studentData.sessionYear.split('-')[0]; // e.g., 2024
                
                // First letter of course
                let courseFirstLetter = (course.name || course.code || 'S').trim().charAt(0).toUpperCase();
                
                // First letter of branch
                let branchFirstLetter = (branch.name || 'B').trim().charAt(0).toUpperCase();

                const prefix = `${yearPrefix}${courseFirstLetter}${branchFirstLetter}`;

                // Count how many students exist for this BRANCH + YEAR to get serial
                const existingCount = await Student.countDocuments({
                    selectedBranch: studentData.selectedBranch,
                    sessionYear: studentData.sessionYear,
                });
                let serial = existingCount + 1;
                let admissionNo = `${prefix}${serial.toString().padStart(3, '0')}`;

                // Guarantee uniqueness
                while (await Student.findOne({ $or: [{ admissionNumber: admissionNo }, { studentId: admissionNo }] })) {
                    serial++;
                    admissionNo = `${prefix}${serial.toString().padStart(3, '0')}`;
                }

                studentData.admissionNumber = admissionNo;
                studentData.studentId = admissionNo;
            }
        }

        // Ensure password (default to DOB if missing)
        if (!studentData.password || studentData.password.toString().trim() === "") {
            studentData.password = studentData.dob;
        }

        // Merge Cloudinary URLs from middleware ONLY if files were actually uploaded
        if (req.documentUrls) {
            if (req.documentUrls.applicantPhoto) {
                studentData.applicantPhoto = req.documentUrls.applicantPhoto;
            }
            
            if (!studentData.documents) studentData.documents = {};
            
            if (req.documentUrls.marksheet10) studentData.documents.marksheet10 = req.documentUrls.marksheet10;
            if (req.documentUrls.marksheet12) studentData.documents.marksheet12 = req.documentUrls.marksheet12;
            if (req.documentUrls.transferCertificate) studentData.documents.transferCertificate = req.documentUrls.transferCertificate;
            if (req.documentUrls.aadharCard) studentData.documents.aadharCard = req.documentUrls.aadharCard;
            if (req.documentUrls.entranceScoreCard) studentData.documents.entranceScoreCard = req.documentUrls.entranceScoreCard;
        }

        const student = new Student(studentData);
        await student.save();

        // If this student was generated from an application, update the application status
        if (studentData.applicationId) {
            await Application.findByIdAndUpdate(studentData.applicationId, { status: 'Accepted' });
        }

        // Increment branch occupancy if selectedBranch exists
        if (studentData.selectedBranch) {
            try {
                await Branch.findByIdAndUpdate(studentData.selectedBranch, { $inc: { occupancy: 1 } });
            } catch (err) {
                console.error("Failed to update branch occupancy", err);
            }
        }

        res.status(201).json(student);
    } catch (error) {
        console.error("Error creating student:", error);
        res.status(500).json({ 
            message: error.message || 'Error creating student', 
            stack: error.stack 
        });
    }
};

export const getAllStudents = async (req, res) => {
    try {
        const students = await Student.find()
            .populate('selectedBranch', 'name')
            .populate('selectedProgram', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
};

export const getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('selectedBranch', 'name')
            .populate('selectedProgram', 'name');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student', error: error.message });
    }
};

export const getStudentByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;
        // Case-insensitive search using regex
        const student = await Student.findOne({ 
            studentId: { $regex: new RegExp(`^${studentId}$`, 'i') } 
        });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student', error: error.message });
    }
};

export const updateStudent = async (req, res) => {
    try {
        const updateData = req.body;
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Add Cloudinary URLs if any
        if (req.documentUrls) {
            if (req.documentUrls.applicantPhoto) updateData.applicantPhoto = req.documentUrls.applicantPhoto;
            
            if (!updateData.documents) updateData.documents = {};
            
            if (req.documentUrls.marksheet10) updateData.documents.marksheet10 = req.documentUrls.marksheet10;
            if (req.documentUrls.marksheet12) updateData.documents.marksheet12 = req.documentUrls.marksheet12;
            if (req.documentUrls.transferCertificate) updateData.documents.transferCertificate = req.documentUrls.transferCertificate;
            if (req.documentUrls.aadharCard) updateData.documents.aadharCard = req.documentUrls.aadharCard;
            if (req.documentUrls.entranceScoreCard) updateData.documents.entranceScoreCard = req.documentUrls.entranceScoreCard;
        }

        // If DOB or Branch changed, potentially refresh ID and occupancy
        const oldBranchId = student.selectedBranch;
        const newBranchId = updateData.selectedBranch;
        
        // Handle Occupancy Change
        if (newBranchId && oldBranchId && newBranchId.toString() !== oldBranchId.toString()) {
            try {
                await Branch.findByIdAndUpdate(oldBranchId, { $inc: { occupancy: -1 } });
                await Branch.findByIdAndUpdate(newBranchId, { $inc: { occupancy: 1 } });
            } catch (err) {
                console.error("Failed to update branch occupancy", err);
            }
        }

        if ((updateData.dob && updateData.dob !== student.dob) || 
            (newBranchId && newBranchId.toString() !== oldBranchId?.toString())) {
            
            const branchId = updateData.selectedBranch || student.selectedBranch;
            const branch = await Branch.findById(branchId);
            const sessionYear = updateData.sessionYear || student.sessionYear;
            const dob = updateData.dob || student.dob;

            if (branch && sessionYear && dob) {
                const yearPrefix = sessionYear.split('-')[0];
                let branchCode = branch.branchCode || branch.name;
                branchCode = branchCode.replace(/[^A-Za-z]/g, '').toUpperCase();
                if (!branchCode) branchCode = "STU";

                const dobParts = dob.split('/');
                const dayPart = dobParts.length > 0 ? dobParts[0].padStart(2, '0') : '00';
                
                let baseId = `${yearPrefix}${branchCode}${dayPart}`;
                let finalId = baseId;
                let counter = 1;
                
                // Ensure uniqueness (don't flag our own ID)
                while (await Student.findOne({ 
                    _id: { $ne: req.params.id }, 
                    $or: [{ admissionNumber: finalId }, { studentId: finalId }] 
                })) {
                    finalId = `${baseId}${counter.toString().padStart(2, '0')}`;
                    counter++;
                }

                updateData.admissionNumber = finalId;
                updateData.studentId = finalId;
            }
        }

        // IMPORTANT: Only update password if explicitly provided as a NEW plaintext value.
        // If the sent password is:
        //   - empty/missing → keep existing hash, don't touch
        //   - already a bcrypt hash (starts with $2) → it came from the DB prefill, ignore it
        //   - a plain DOB string that equals current DOB → likely an accidental override from the form default, ignore
        if (updateData.password !== undefined) {
            const pwd = updateData.password ? updateData.password.toString().trim() : '';
            if (!pwd || pwd.startsWith('$2') || pwd === (updateData.dob || student.dob)) {
                // Either empty, already hashed, or just the DOB fallback — do NOT overwrite existing password
                delete updateData.password;
            }
            // Otherwise it's a new explicit password — keep it (model pre-save hook will hash it)
        }

        // Apply updates (excluding immutable fields)
        delete updateData._id;
        delete updateData.id;

        student.set(updateData);
        await student.save();

        res.status(200).json(student);
    } catch (error) {
        console.error("Update Student Error:", error);
        res.status(500).json({ message: 'Error updating student', error: error.message });
    }
};

export const deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        // Decrement branch occupancy
        if (student.selectedBranch) {
            try {
                await Branch.findByIdAndUpdate(student.selectedBranch, { $inc: { occupancy: -1 } });
            } catch (err) {
                console.error("Failed to decrement branch occupancy", err);
            }
        }

        res.status(200).json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting student', error: error.message });
    }
};

// ── UPDATE DOCUMENTS (called from student panel) ──
export const updateStudentDocuments = async (req, res) => {
    try {
        const { id } = req.params;
        const { documents } = req.body;

        if (!documents || typeof documents !== 'object') {
            return res.status(400).json({ message: 'documents object is required' });
        }

        // Build a $set map, allowing null or empty strings for deletion
        const docSet = {};
        for (const [key, url] of Object.entries(documents)) {
            docSet[`documents.${key}`] = url;
        }

        const student = await Student.findByIdAndUpdate(
            id,
            { $set: { ...docSet, documentsLastUpdated: new Date() } },
            { new: true }
        ).populate('selectedBranch', 'name').populate('selectedProgram', 'name');

        if (!student) return res.status(404).json({ message: 'Student not found' });

        const io = req.app.get('io');
        if (io) {
            io.emit('student_documents_updated', { studentId: id, documents: student.documents, lastUpdated: student.documentsLastUpdated });
        }

        res.status(200).json({ message: 'Documents updated successfully', student });
    } catch (error) {
        console.error('updateStudentDocuments error:', error);
        res.status(500).json({ message: 'Error updating documents', error: error.message });
    }
};

export const uploadStudentDocuments = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.documentUrls || Object.keys(req.documentUrls).length === 0) {
            return res.status(400).json({ message: 'No documents uploaded' });
        }

        const docSet = {};
        for (const [key, url] of Object.entries(req.documentUrls)) {
            if (url) docSet[`documents.${key}`] = url;
        }

        const student = await Student.findByIdAndUpdate(
            id,
            { $set: { ...docSet, documentsLastUpdated: new Date() } },
            { new: true }
        ).populate('selectedBranch', 'name').populate('selectedProgram', 'name');

        if (!student) return res.status(404).json({ message: 'Student not found' });

        const io = req.app.get('io');
        if (io) {
            io.emit('student_documents_updated', { studentId: id, documents: student.documents, lastUpdated: student.documentsLastUpdated });
        }

        res.status(200).json({ message: 'Documents uploaded successfully', student });
    } catch (error) {
        console.error('uploadStudentDocuments error:', error);
        res.status(500).json({ message: 'Error uploading documents', error: error.message });
    }
};

export const getLibraryMembers = async (req, res) => {
    try {
        const members = await Student.aggregate([
            {
                $lookup: {
                    from: 'issuebooks',
                    let: { studentId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$student', '$$studentId'] },
                                        { $eq: ['$isVerified', true] },
                                        { $in: ['$status', ['Active', 'Overdue']] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'activeIssues'
                }
            },
            {
                $lookup: {
                    from: 'branches',
                    localField: 'selectedBranch',
                    foreignField: '_id',
                    as: 'branchInfo'
                }
            },
            {
                $project: {
                    studentId: 1,
                    admissionNumber: 1,
                    firstName: 1,
                    lastName: 1,
                    sessionYear: 1,
                    branch: { $arrayElemAt: ['$branchInfo.name', 0] },
                    issues: { $size: '$activeIssues' },
                    applicantPhoto: 1,
                    photo: { $literal: 'https://i.pravatar.cc/150?img=1' }
                }
            }
        ]);
        res.status(200).json(members);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching library members', error: error.message });
    }
};
