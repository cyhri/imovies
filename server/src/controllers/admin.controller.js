import { Movie } from '../models/movie.model.js';
import { Theatre } from '../models/theatre.model.js';
import { Screen } from '../models/screen.model.js';
import { Show } from '../models/show.model.js';
import { Booking } from '../models/booking.model.js';

export async function getAdminOverview(req, res, next) {
  try {
    const [
      totalMovies,
      activeMovies,
      totalTheatres,
      activeTheatres,
      totalScreens,
      totalShows,
      scheduledShows,
      cancelledShows,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      revenueAggregate,
      recentBookings,
    ] = await Promise.all([
      Movie.countDocuments(),
      Movie.countDocuments({ isActive: true }),
      Theatre.countDocuments(),
      Theatre.countDocuments({ isActive: true }),
      Screen.countDocuments(),
      Show.countDocuments(),
      Show.countDocuments({ status: 'scheduled' }),
      Show.countDocuments({ status: 'cancelled' }),
      Booking.countDocuments(),
      Booking.countDocuments({ bookingStatus: 'confirmed' }),
      Booking.countDocuments({ bookingStatus: 'cancelled' }),
      Booking.aggregate([
        { $match: { bookingStatus: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Booking.find()
        .populate('user', 'name email')
        .populate({
          path: 'show',
          select: 'startTime movie theatre screen',
          populate: [
            { path: 'movie', select: 'title posterUrl duration' },
            { path: 'theatre', select: 'name city' },
            { path: 'screen', select: 'screenNumber name' },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const totalRevenue = revenueAggregate[0]?.total || 0;

    return res.status(200).json({
      success: true,
      data: {
        metrics: {
          movies: { total: totalMovies, active: activeMovies, inactive: totalMovies - activeMovies },
          theatres: { total: totalTheatres, active: activeTheatres },
          screens: { total: totalScreens },
          shows: { total: totalShows, scheduled: scheduledShows, cancelled: cancelledShows },
          bookings: { total: totalBookings, confirmed: confirmedBookings, cancelled: cancelledBookings },
          revenue: totalRevenue,
        },
        recentBookings,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminBookings(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { status, search } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.bookingStatus = status;
    }

    if (search && search.trim()) {
      filter.bookingReference = { $regex: search.trim(), $options: 'i' };
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('user', 'name email')
        .populate({
          path: 'show',
          populate: [
            { path: 'movie', select: 'title posterUrl duration rating' },
            { path: 'theatre', select: 'name city' },
            { path: 'screen', select: 'screenNumber name screenType' },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}