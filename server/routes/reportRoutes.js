import { Router } from 'express';
import { reportPG } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/:pgId', protect, reportPG);

export default router;
