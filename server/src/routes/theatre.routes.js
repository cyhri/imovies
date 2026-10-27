import { Router } from 'express';
import {
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
  getScreensByTheatre,
  createScreen,
  getScreenById,
  updateScreen,
  deleteScreen,
} from '../controllers/theatre.controller.js';
import {
  validateCreateTheatre,
  validateUpdateTheatre,
  validateCreateScreen,
  validateUpdateScreen,
} from '../validators/theatre.validator.js';
import { validateObjectId } from '../validators/movie.validator.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// --- Theatre routes ---
router.get('/', getTheatres);
router.get('/:id', validateObjectId('id'), getTheatreById);
router.post('/', authenticate, authorize('admin'), validateCreateTheatre, createTheatre);
router.put('/:id', authenticate, authorize('admin'), validateObjectId('id'), validateUpdateTheatre, updateTheatre);
router.delete('/:id', authenticate, authorize('admin'), validateObjectId('id'), deleteTheatre);

// --- Screen routes under Theatre ---
router.get('/:theatreId/screens', validateObjectId('theatreId'), getScreensByTheatre);
router.post(
  '/:theatreId/screens',
  authenticate,
  authorize('admin'),
  validateObjectId('theatreId'),
  validateCreateScreen,
  createScreen
);

// --- Screen direct access routes ---
router.get('/screens/:id', validateObjectId('id'), getScreenById);
router.put(
  '/screens/:id',
  authenticate,
  authorize('admin'),
  validateObjectId('id'),
  validateUpdateScreen,
  updateScreen
);
router.delete(
  '/screens/:id',
  authenticate,
  authorize('admin'),
  validateObjectId('id'),
  deleteScreen
);

export default router;