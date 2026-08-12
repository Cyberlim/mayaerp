import express from 'express';
import { 
    submitAttendanceBulk, 
    getAttendanceByDateAndFilters, 
    getAttendanceStats,
    getStudentsForAttendance,
    getStudentAttendanceSummary
} from '../controllers/attendanceController.js';

const router = express.Router();

router.post('/bulk', submitAttendanceBulk);
router.get('/filter', getAttendanceByDateAndFilters);
router.get('/stats', getAttendanceStats);
router.get('/students', getStudentsForAttendance);
router.get('/student-summary', getStudentAttendanceSummary);

export default router;
