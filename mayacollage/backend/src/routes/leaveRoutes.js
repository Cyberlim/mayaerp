import express from 'express';
import { applyLeave, getUserLeaves, getAllLeaves, updateLeaveStatus } from '../controllers/leaveController.js';

const router = express.Router();

router.post('/apply', applyLeave);
router.get('/user/:userId', getUserLeaves);
router.get('/all', getAllLeaves);
router.put('/status/:id', updateLeaveStatus);

export default router;
