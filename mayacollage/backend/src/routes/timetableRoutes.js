import express from 'express';
import { saveTimetable, getTimetable } from '../controllers/timetableController.js';

const router = express.Router();

router.post('/', saveTimetable);
router.get('/', getTimetable);

export default router;
