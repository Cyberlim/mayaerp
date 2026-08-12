import express from 'express';
import { 
    getBuses, 
    createBus, 
    assignStudentToBus, 
    unassignStudentFromBus, 
    updateBus, 
    deleteBus,
    getStudentBus,
    payTransportFee
} from '../controllers/transportController.js';

const router = express.Router();

router.get('/buses', getBuses);
router.post('/bus', createBus);
router.post('/assign-student', assignStudentToBus);
router.post('/unassign-student', unassignStudentFromBus);
router.put('/bus/:id', updateBus);
router.delete('/bus/:id', deleteBus);

// Student APIs
router.get('/student-bus/:studentId', getStudentBus);
router.post('/pay-fee', payTransportFee);

export default router;
