import { Router } from 'express';
import {
  getShows,
  getShowById,
  createShow,
  cancelShow,
} from '../controllers/show.controller.js';
import {
  createSeatHold,
  releaseSeatHold,
  getSeatHold,
} from '../controllers/hold.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', getShows);
router.get('/:id', getShowById);

// Seat holds routes (Authenticated customer)
router.post('/:id/holds', authenticate, createSeatHold);
router.get('/:id/holds/:holdToken', authenticate, getSeatHold);
router.delete('/:id/holds/:holdToken', authenticate, releaseSeatHold);

// Admin-only show operations
router.post('/', authenticate, authorize('admin'), createShow);
router.patch('/:id/cancel', authenticate, authorize('admin'), cancelShow);

export default router;