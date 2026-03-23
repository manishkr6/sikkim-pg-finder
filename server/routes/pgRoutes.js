import { Router } from 'express';
import { getApprovedPGs, getPGById } from '../controllers/pgController.js';

const router = Router();

router.get('/', getApprovedPGs);
router.get('/:id', getPGById);

export default router;
