import express from 'express';
import { login, register, getMe, studentLogin } from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/student-login', studentLogin);
router.post('/register', register);

// Placeholder for protected route
router.get('/me', getMe);

export default router;
