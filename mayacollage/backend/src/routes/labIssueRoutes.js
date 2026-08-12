import express from 'express';
import { getAllIssues, issueItem, returnItem, flagOverdueItems } from '../controllers/labIssueController.js';

const router = express.Router();

router.get('/', getAllIssues);
router.post('/', issueItem);
router.put('/:id/return', returnItem);
router.post('/flag-overdue', flagOverdueItems);

export default router;
