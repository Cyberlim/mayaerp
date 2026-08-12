import express from 'express';
import { getStudentFeeStatus, submitPayment, getFeeTransactions } from '../controllers/feeController.js';

const router = express.Router();

router.get('/student/:studentId', getStudentFeeStatus);
router.post('/pay', submitPayment);
router.get('/all', getFeeTransactions);

export default router;
