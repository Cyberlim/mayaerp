import express from 'express';
const router = express.Router();
import { getShelves, createShelf, updateShelf, deleteShelf } from '../controllers/shelfController.js';

router.get('/', getShelves);
router.post('/', createShelf);
router.put('/:id', updateShelf);
router.delete('/:id', deleteShelf);

export default router;
