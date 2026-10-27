import { Router } from 'express';
import {
  getShows,
  getShowById,
  createShow,
  updateShow,
  cancelShow,
} from '../controllers/show.controller.js';
import {
  validateCreateShow,
  validateUpdateShow,
} from '../validators/show.validator.js';
import { validateObjectId } from '../validators/movie.validator.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', getShows);
router.get('/:id', validateObjectId('id'), getShowById);

// Admin-protected routes
router.post('/', authenticate, authorize('admin'), validateCreateShow, createShow);
router.put('/:id', authenticate, authorize('admin'), validateObjectId('id'), validateUpdateShow, updateShow);
router.patch('/:id/cancel', authenticate, authorize('admin'), validateObjectId('id'), cancelShow);
router.delete('/:id', authenticate, authorize('admin'), validateObjectId('id'), cancelShow);

export default router;