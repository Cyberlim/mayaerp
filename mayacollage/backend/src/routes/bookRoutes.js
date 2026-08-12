import express from 'express';
import { createBook, getAllBooks, updateBook, deleteBook, getBooksByShelf } from '../controllers/bookController.js';

const router = express.Router();

router.post('/', createBook);
router.get('/', getAllBooks);
router.get('/shelf/:shelfName', getBooksByShelf);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

export default router;
