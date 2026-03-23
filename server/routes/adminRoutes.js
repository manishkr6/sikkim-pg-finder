import { Router } from 'express';
import {
  getStats, getAllPGs, approvePG, rejectPG, forceDeletePG,
  getAllUsers, approveOwner, toggleBlockUser,
  getReports, updateReport,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();

// All admin routes are protected + admin only
router.use(protect, authorize('admin'));

router.get('/stats', getStats);

router.get('/pgs', getAllPGs);
router.put('/pgs/:id/approve', approvePG);
router.put('/pgs/:id/reject', rejectPG);
router.delete('/pgs/:id', forceDeletePG);

router.get('/users', getAllUsers);
router.put('/users/:id/approve-owner', approveOwner);
router.put('/users/:id/block', toggleBlockUser);

router.get('/reports', getReports);
router.put('/reports/:id', updateReport);

export default router;
