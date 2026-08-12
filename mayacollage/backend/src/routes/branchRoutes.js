import express from 'express';
import {
    createBranch,
    getAllBranches,
    getBranchById,
    updateBranch,
    deleteBranch
} from '../controllers/branchController.js';

const router = express.Router();

router.post('/', createBranch);
router.get('/', getAllBranches);
router.get('/:id', getBranchById);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);

export default router;
