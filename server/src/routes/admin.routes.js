import { Router } from 'express';
import { getAdminOverview, getAdminBookings } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// All admin endpoints require authentication and 'admin' role
router.use(authenticate, authorize('admin'));

router.get('/overview', getAdminOverview);
router.get('/bookings', getAdminBookings);

export default router;