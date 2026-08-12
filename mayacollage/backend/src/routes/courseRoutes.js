import express from 'express';
import {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse
} from '../controllers/courseController.js';

const router = express.Router();

router.post('/', createCourse);
// Allows filtering by branchId via query param ?branchId=...
router.get('/', getAllCourses); 
router.get('/:id', getCourseById);
router.put('/:id', updateCourse);
router.delete('/:id', deleteCourse);

export default router;
