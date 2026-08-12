import express from 'express';
import { addFaculty, getCourseFaculty, deleteFaculty, getAllFacultyUsers } from '../controllers/facultyController.js';

const router = express.Router();

router.post('/', addFaculty);
router.get('/all', getAllFacultyUsers);   // for dropdowns — must be before /:courseId
router.get('/:courseId', getCourseFaculty);
router.delete('/:id', deleteFaculty);

export default router;
