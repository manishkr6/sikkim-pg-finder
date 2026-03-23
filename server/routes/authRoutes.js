import { Router } from 'express';
import { body } from 'express-validator';
import {
  signup,
  login,
  verifyOtp,
  resendOtp,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post(
  '/signup',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  signup
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.post(
  '/verify-otp',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('purpose').isIn(['signup', 'login']).withMessage('Invalid OTP purpose'),
  ],
  verifyOtp
);

router.post(
  '/resend-otp',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('purpose').isIn(['signup', 'login']).withMessage('Invalid OTP purpose'),
  ],
  resendOtp
);

router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

export default router;
