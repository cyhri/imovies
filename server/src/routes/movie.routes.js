import { Router } from 'express';
import {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} from '../controllers/movie.controller.js';
import {
  validateObjectId,
  validateCreateMovie,
  validateUpdateMovie,
} from '../validators/movie.validator.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', getMovies);
router.get('/:id', validateObjectId('id'), getMovieById);

// Admin-protected routes
router.post('/', authenticate, authorize('admin'), validateCreateMovie, createMovie);
router.put('/:id', authenticate, authorize('admin'), validateObjectId('id'), validateUpdateMovie, updateMovie);
router.delete('/:id', authenticate, authorize('admin'), validateObjectId('id'), deleteMovie);

export default router;