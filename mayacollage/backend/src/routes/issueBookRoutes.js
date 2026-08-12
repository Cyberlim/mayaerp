import express from 'express';
import { issueBook, verifyIssue, getIssuedBooks, returnBook, getLibraryStats, getIssuedBooksByStudent, getReturnedBooksByStudent, seedOverdue, payFine } from '../controllers/issueBookController.js';

const router = express.Router();

router.post('/issue', issueBook);
router.post('/verify', verifyIssue);
router.get('/circulation', getIssuedBooks);
router.get('/student/:studentId', getIssuedBooksByStudent);
router.get('/returned/:studentId', getReturnedBooksByStudent);
router.get('/seed-overdue', seedOverdue);
router.put('/return/:id', returnBook);
router.put('/pay-fine/:id', payFine);
router.get('/stats', getLibraryStats);

export default router;
