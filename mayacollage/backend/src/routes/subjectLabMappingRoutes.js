import express from 'express';
import { getAllMappings, createMapping, updateMapping, deleteMapping } from '../controllers/subjectLabMappingController.js';

const router = express.Router();

router.get('/', getAllMappings);
router.post('/', createMapping);
router.put('/:id', updateMapping);
router.delete('/:id', deleteMapping);

export default router;
