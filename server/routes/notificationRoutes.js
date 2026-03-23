import { Router } from 'express';
import { getNotifications, markAllRead, markOneRead, getUnreadCount } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/mark-read', markAllRead);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markOneRead);

export default router;
