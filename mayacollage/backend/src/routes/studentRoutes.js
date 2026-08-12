import express from 'express';
import { upload, processApplicationDocuments } from '../middleware/uploadMiddleware.js';
import {
    createStudent,
    getAllStudents,
    getStudentById,
    getStudentByStudentId,
    updateStudent,
    deleteStudent,
    getLibraryMembers,
    updateStudentDocuments,
    batchUpdateSemester,
    uploadStudentDocuments
} from '../controllers/studentController.js';

const router = express.Router();

const studentDocsUpload = upload.fields([
    { name: 'aadharCard', maxCount: 1 },
    { name: 'marksheet10', maxCount: 1 },
    { name: 'marksheet12', maxCount: 1 },
    { name: 'casteCertificate', maxCount: 1 }
]);

router.post('/', createStudent);
router.get('/', getAllStudents);
router.get('/library/members', getLibraryMembers);
router.patch('/batch/semester', batchUpdateSemester);   // ← Batch semester update (before /:id)
router.get('/:id', getStudentById);
router.get('/roll/:studentId', getStudentByStudentId);
router.put('/:id', updateStudent);
router.patch('/:id/documents', updateStudentDocuments);
router.post('/:id/upload-documents', studentDocsUpload, processApplicationDocuments, uploadStudentDocuments);
router.delete('/:id', deleteStudent);

export default router;
