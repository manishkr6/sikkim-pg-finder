import { Router } from 'express';
import { getPGReviews, addReview, deleteReview } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/:pgId', getPGReviews);
router.post('/:pgId', protect, addReview);
router.delete('/:reviewId', protect, deleteReview);

export default router;
