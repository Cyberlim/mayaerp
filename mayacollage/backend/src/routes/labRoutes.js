import express from 'express';
import { getAllLabs, getLabById, createLab, updateLab, deleteLab } from '../controllers/labController.js';

const router = express.Router();

router.get('/', getAllLabs);
router.get('/:id', getLabById);
router.post('/', createLab);
router.put('/:id', updateLab);
router.delete('/:id', deleteLab);

export default router;
