import express from 'express';
import { createNotice, getNotices, updateNotice, deleteNotice, incrementNoticeViews } from '../controllers/noticeController.js';

const router = express.Router();

router.post('/create', createNotice);
router.get('/all', getNotices);
router.put('/update/:id', updateNotice);
router.delete('/delete/:id', deleteNotice);
router.put('/view/:id', incrementNoticeViews);

export default router;
