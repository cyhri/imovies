import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
} from '../controllers/booking.controller.js';
import { validateCreateBooking } from '../validators/booking.validator.js';
import { validateObjectId } from '../validators/movie.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All booking operations require an authenticated user
router.post('/', authenticate, validateCreateBooking, createBooking);
router.get('/my-bookings', authenticate, getMyBookings);
router.get('/:id', authenticate, validateObjectId('id'), getBookingById);
router.patch('/:id/cancel', authenticate, validateObjectId('id'), cancelBooking);

export default router;