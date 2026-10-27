import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import movieRoutes from './movie.routes.js';
import theatreRoutes from './theatre.routes.js';
import showRoutes from './show.routes.js';
import bookingRoutes from './booking.routes.js';
import adminRoutes from './admin.routes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/movies', movieRoutes);
apiRouter.use('/theatres', theatreRoutes);
apiRouter.use('/shows', showRoutes);
apiRouter.use('/bookings', bookingRoutes);
apiRouter.use('/admin', adminRoutes);

export default apiRouter;