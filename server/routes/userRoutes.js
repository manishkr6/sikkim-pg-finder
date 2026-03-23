import { Router } from 'express';
import { toggleSavePG, getSavedPGs, requestOwner, updateProfile, changePassword } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadOwnerDocs } from '../middleware/uploadMiddleware.js';

const router = Router();

router.post('/save/:pgId', protect, toggleSavePG);
router.get('/saved', protect, getSavedPGs);
router.post('/request-owner', protect, uploadOwnerDocs, requestOwner);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;
