import express from 'express';
import { signup, verifyOTP, login, logout, getMe, resendOTP } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
