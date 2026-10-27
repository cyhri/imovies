import { Show } from '../models/show.model.js';
import { Screen } from '../models/screen.model.js';
import { Movie } from '../models/movie.model.js';
import { Theatre } from '../models/theatre.model.js';

export async function getShows(req, res, next) {
  try {
    const { movie, theatre, screen, city, date, includePast } = req.query;
    const filter = {};

    if (movie) filter.movie = movie;
    if (theatre) filter.theatre = theatre;
    if (screen) filter.screen = screen;

    if (includePast !== 'true') {
      filter.startTime = { $gte: new Date() };
      filter.status = 'scheduled';
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    let query = Show.find(filter)
      .populate('movie', 'title posterUrl duration rating genres language')
      .populate('theatre', 'name city address')
      .populate('screen', 'screenNumber name screenType seatingCapacity')
      .sort({ startTime: 1 });

    if (city) {
      const theatresInCity = await Theatre.find({
        city: { $regex: new RegExp(`^${city}$`, 'i') },
      }).select('_id');
      const theatreIds = theatresInCity.map((t) => t._id);
      filter.theatre = { $in: theatreIds };
      query = Show.find(filter)
        .populate('movie', 'title posterUrl duration rating genres language')
        .populate('theatre', 'name city address')
        .populate('screen', 'screenNumber name screenType seatingCapacity')
        .sort({ startTime: 1 });
    }

    const shows = await query.exec();
    const now = new Date();

    const showsWithSummary = shows.map((show) => {
      const seats = show.seats || [];
      const totalSeats = seats.length;
      const availableSeats = seats.filter((s) => {
        if (s.status === 'available') return true;
        if (s.status === 'reserved' && s.holdExpiresAt && new Date(s.holdExpiresAt) <= now) return true;
        return false;
      }).length;
      const bookedSeats = seats.filter((s) => s.status === 'booked').length;
      const reservedSeats = totalSeats - availableSeats - bookedSeats;

      const obj = show.toObject();
      delete obj.seats;
      return {
        ...obj,
        seatSummary: {
          total: totalSeats,
          available: availableSeats,
          booked: bookedSeats,
          reserved: reservedSeats,
        },
      };
    });

    return res.status(200).json({
      success: true,
      data: showsWithSummary,
    });
  } catch (err) {
    next(err);
  }
}

export async function getShowById(req, res, next) {
  try {
    const show = await Show.findById(req.params.id)
      .populate('movie', 'title description posterUrl duration rating genres language releaseDate')
      .populate('theatre', 'name city address phone')
      .populate('screen', 'screenNumber name screenType seatingCapacity seatLayout');

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    const now = new Date();
    const currentUserId = req.user?._id?.toString();

    // Apply lazy expiration: treat expired reserved seats as available
    const processedSeats = (show.seats || []).map((s) => {
      const seatObj = s.toObject ? s.toObject() : { ...s };
      if (seatObj.status === 'reserved' && seatObj.holdExpiresAt && new Date(seatObj.holdExpiresAt) <= now) {
        seatObj.status = 'available';
        seatObj.reservedBy = null;
        seatObj.holdToken = null;
        seatObj.holdExpiresAt = null;
      }
      if (currentUserId && seatObj.reservedBy) {
        seatObj.isHeldByMe = seatObj.reservedBy.toString() === currentUserId;
      }
      return seatObj;
    });

    const showObj = show.toObject();
    showObj.seats = processedSeats;

    return res.status(200).json({
      success: true,
      data: showObj,
    });
  } catch (err) {
    next(err);
  }
}

export async function createShow(req, res, next) {
  try {
    const { movie, theatre, screen, startTime, endTime, pricing } = req.body;

    if (!movie || !theatre || !screen || !startTime || !endTime || !pricing) {
      return res.status(400).json({
        success: false,
        message: 'movie, theatre, screen, startTime, endTime, and pricing are required',
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'startTime and endTime must be valid ISO date strings',
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'endTime must be strictly after startTime',
      });
    }

    const [movieDoc, theatreDoc, screenDoc] = await Promise.all([
      Movie.findById(movie),
      Theatre.findById(theatre),
      Screen.findOne({ _id: screen, theatre }),
    ]);

    if (!movieDoc) {
      return res.status(404).json({ success: false, message: 'Referenced Movie not found' });
    }
    if (!theatreDoc) {
      return res.status(404).json({ success: false, message: 'Referenced Theatre not found' });
    }
    if (!screenDoc) {
      return res.status(404).json({
        success: false,
        message: 'Referenced Screen not found or does not belong to the specified Theatre',
      });
    }

    // Schedule collision check
    const overlappingShow = await Show.findOne({
      screen,
      status: { $ne: 'cancelled' },
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } },
      ],
    });

    if (overlappingShow) {
      return res.status(409).json({
        success: false,
        message: 'Schedule conflict: Screen is already booked for another show during this time slot',
        conflictingShowId: overlappingShow._id,
      });
    }

    // Generate seats from screen layout and pricing
    const pricingMap = new Map((pricing || []).map((p) => [p.tier, p.price]));
    const defaultStandardPrice = pricingMap.get('standard') ?? 10;

    let generatedSeats = [];
    if (screenDoc.seatLayout && screenDoc.seatLayout.length > 0) {
      generatedSeats = screenDoc.seatLayout.map((layoutSeat) => ({
        seatNumber: layoutSeat.seatNumber || `${layoutSeat.row}${layoutSeat.number}`,
        tier: layoutSeat.tier || 'standard',
        price: pricingMap.get(layoutSeat.tier) ?? defaultStandardPrice,
        status: 'available',
        reservedBy: null,
        reservedAt: null,
        holdExpiresAt: null,
        holdToken: null,
      }));
    } else {
      const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      const seatsPerRow = 10;
      const capacity = screenDoc.seatingCapacity || 50;
      let count = 0;

      for (let r = 0; r < rows.length && count < capacity; r++) {
        for (let s = 1; s <= seatsPerRow && count < capacity; s++) {
          const seatNumber = `${rows[r]}${s}`;
          let tier = 'standard';
          if (r < 2) tier = 'vip';
          else if (r < 4) tier = 'premium';

          generatedSeats.push({
            seatNumber,
            tier,
            price: pricingMap.get(tier) ?? defaultStandardPrice,
            status: 'available',
            reservedBy: null,
            reservedAt: null,
            holdExpiresAt: null,
            holdToken: null,
          });
          count++;
        }
      }
    }

    const show = await Show.create({
      movie,
      theatre,
      screen,
      startTime: start,
      endTime: end,
      pricing,
      seats: generatedSeats,
      status: 'scheduled',
    });

    return res.status(201).json({
      success: true,
      message: 'Show created successfully',
      data: show,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelShow(req, res, next) {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }

    show.status = 'cancelled';
    await show.save();

    return res.status(200).json({
      success: true,
      message: 'Show cancelled successfully',
      data: show,
    });
  } catch (err) {
    next(err);
  }
}