import express from 'express';
import { 
    createApplication, 
    getApplications, 
    getApplicationById,
    updateApplication,
    deleteApplication
} from '../controllers/applicationController.js';
import { upload, processApplicationDocuments } from '../middleware/uploadMiddleware.js';

const router = express.Router();

const cpUpload = upload.fields([
    { name: 'applicantPhoto', maxCount: 1 },
    { name: 'marksheet10', maxCount: 1 },
    { name: 'marksheet12', maxCount: 1 },
    { name: 'transferCertificate', maxCount: 1 },
    { name: 'aadharCard', maxCount: 1 },
    { name: 'entranceScoreCard', maxCount: 1 }
]);

router.post('/', cpUpload, processApplicationDocuments, createApplication);
router.get('/', getApplications);
router.get('/:id', getApplicationById);
router.put('/:id', cpUpload, processApplicationDocuments, updateApplication);
router.delete('/:id', deleteApplication);

export default router;
