import express from 'express';
import { getLabReports } from '../controllers/labReportsController.js';

const router = express.Router();

router.get('/', getLabReports);

export default router;
