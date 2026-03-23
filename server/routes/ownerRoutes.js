import { Router } from 'express';
import { body } from 'express-validator';
import { getOwnerPGs, createPG, updatePG, deletePG } from '../controllers/ownerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { uploadPGImages } from '../middleware/uploadMiddleware.js';

const router = Router();

const pgValidation = [
  body('title').trim().isLength({ min: 10, max: 100 }).withMessage('Title must be 10–100 characters'),
  body('description').trim().isLength({ min: 50 }).withMessage('Description must be at least 50 characters'),
  body('price').isNumeric().custom((v) => v >= 500).withMessage('Price must be at least ₹500'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('area').trim().notEmpty().withMessage('Area is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('roomType').isIn(['Single', 'Double', 'Triple']).withMessage('Invalid room type'),
  body('genderPreference').isIn(['Boys', 'Girls', 'Co-ed']).withMessage('Invalid gender preference'),
  body('contactNumber')
    .matches(/^[+]?[6-9]\d{9}$/)
    .withMessage('Enter a valid Indian phone number'),
];

router.get('/', protect, authorize('owner', 'admin'), getOwnerPGs);
router.post('/', protect, authorize('owner'), uploadPGImages, pgValidation, createPG);
router.put('/:id', protect, authorize('owner', 'admin'), uploadPGImages, updatePG);
router.delete('/:id', protect, authorize('owner', 'admin'), deletePG);

export default router;
