import { Show } from '../models/show.model.js';
import { Movie } from '../models/movie.model.js';
import { Theatre } from '../models/theatre.model.js';
import { Screen } from '../models/screen.model.js';

export async function getShows(req, res, next) {
  try {
    const { movie, theatre, screen, city, date, status = 'scheduled', includePast } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (movie) {
      filter.movie = movie;
    }

    if (theatre) {
      filter.theatre = theatre;
    }

    if (screen) {
      filter.screen = screen;
    }

    // Filter by city
    if (city && city.trim()) {
      const theatresInCity = await Theatre.find({
        city: { $regex: new RegExp(`^${city.trim()}$`, 'i') },
      }).select('_id');
      const theatreIds = theatresInCity.map((t) => t._id);
      if (filter.theatre) {
        // If theatre filter already specified, ensure it belongs to city
        if (!theatreIds.some((id) => id.toString() === filter.theatre.toString())) {
          return res.status(200).json({ success: true, data: [] });
        }
      } else {
        filter.theatre = { $in: theatreIds };
      }
    }

    // Filter by specific calendar date (YYYY-MM-DD)
    if (date && date.trim()) {
      const selectedDate = new Date(date);
      if (!isNaN(selectedDate.getTime())) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        filter.startTime = {
          $gte: startOfDay,
          $lte: endOfDay,
        };
      }
    } else if (includePast !== 'true') {
      // By default for show listings, only show upcoming shows
      filter.startTime = { $gte: new Date() };
    }

    const shows = await Show.find(filter)
      .populate('movie', 'title duration genres language rating posterUrl')
      .populate('theatre', 'name city address')
      .populate('screen', 'screenNumber name screenType seatingCapacity')
      .sort({ startTime: 1 });

    // Format output with available seat summary for performance
    const formattedShows = shows.map((show) => {
      const showObj = show.toObject();
      const availableSeats = (showObj.seats || []).filter((s) => s.status === 'available').length;
      const totalSeats = (showObj.seats || []).length;
      return {
        ...showObj,
        seatsAvailableCount: availableSeats,
        totalSeatsCount: totalSeats,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedShows,
    });
  } catch (err) {
    next(err);
  }
}

export async function getShowById(req, res, next) {
  try {
    const show = await Show.findById(req.params.id)
      .populate('movie', 'title description duration genres language rating posterUrl releaseDate')
      .populate('theatre', 'name city address phone')
      .populate('screen', 'screenNumber name screenType seatingCapacity seatLayout');

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: show,
    });
  } catch (err) {
    next(err);
  }
}

export async function createShow(req, res, next) {
  try {
    const { movie: movieId, theatre: theatreId, screen: screenId, startTime, endTime, pricing } = req.body;

    // 1. Verify existence of movie, theatre, and screen
    const [movie, theatre, screen] = await Promise.all([
      Movie.findById(movieId),
      Theatre.findById(theatreId),
      Screen.findById(screenId),
    ]);

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Referenced movie does not exist' });
    }
    if (!theatre) {
      return res.status(404).json({ success: false, message: 'Referenced theatre does not exist' });
    }
    if (!screen) {
      return res.status(404).json({ success: false, message: 'Referenced screen does not exist' });
    }

    // Verify screen belongs to the specified theatre
    if (screen.theatre.toString() !== theatre._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'The selected screen does not belong to the selected theatre',
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'Show endTime must be chronologically after startTime',
      });
    }

    // 2. Strict schedule overlap check on the same screen
    // Overlap occurs if existing show has startTime < newEndTime && endTime > newStartTime
    const overlappingShow = await Show.findOne({
      screen: screenId,
      status: { $ne: 'cancelled' },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (overlappingShow) {
      return res.status(409).json({
        success: false,
        message: 'Schedule conflict: An active show is already scheduled on this screen during the requested time window',
        conflictShowId: overlappingShow._id,
        conflictRange: {
          startTime: overlappingShow.startTime,
          endTime: overlappingShow.endTime,
        },
      });
    }

    // 3. Generate seats array from screen layout and pricing tiers
    const priceMap = {};
    for (const p of pricing) {
      priceMap[p.tier] = p.price;
    }
    const defaultPrice = pricing[0]?.price || 10;

    let showSeats = [];
    if (screen.seatLayout && screen.seatLayout.length > 0) {
      showSeats = screen.seatLayout.map((s) => ({
        seatNumber: `${s.row}${s.number}`,
        tier: s.tier || 'standard',
        price: priceMap[s.tier] !== undefined ? priceMap[s.tier] : defaultPrice,
        status: 'available',
      }));
    } else {
      const capacity = screen.seatingCapacity || 50;
      const seatsPerRow = 10;
      const rowsNeeded = Math.ceil(capacity / seatsPerRow);
      const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let count = 0;
      for (let r = 0; r < rowsNeeded && count < capacity; r++) {
        const row = rowLetters[r] || `R${r + 1}`;
        for (let n = 1; n <= seatsPerRow && count < capacity; n++) {
          const tier = r < 2 ? 'vip' : r < 5 ? 'premium' : 'standard';
          showSeats.push({
            seatNumber: `${row}${n}`,
            tier,
            price: priceMap[tier] !== undefined ? priceMap[tier] : defaultPrice,
            status: 'available',
          });
          count++;
        }
      }
    }

    const show = await Show.create({
      movie: movieId,
      theatre: theatreId,
      screen: screenId,
      startTime: start,
      endTime: end,
      pricing,
      seats: showSeats,
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

export async function updateShow(req, res, next) {
  try {
    const show = await Show.findById(req.params.id);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    const newStart = req.body.startTime ? new Date(req.body.startTime) : show.startTime;
    const newEnd = req.body.endTime ? new Date(req.body.endTime) : show.endTime;
    const targetScreen = req.body.screen || show.screen;

    if (newEnd <= newStart) {
      return res.status(400).json({
        success: false,
        message: 'Show endTime must be chronologically after startTime',
      });
    }

    // Check overlap excluding this show
    if (req.body.startTime || req.body.endTime || req.body.screen) {
      const overlappingShow = await Show.findOne({
        _id: { $ne: req.params.id },
        screen: targetScreen,
        status: { $ne: 'cancelled' },
        startTime: { $lt: newEnd },
        endTime: { $gt: newStart },
      });

      if (overlappingShow) {
        return res.status(409).json({
          success: false,
          message: 'Schedule conflict: An active show is already scheduled on this screen during the requested time window',
          conflictShowId: overlappingShow._id,
        });
      }
    }

    const updatedShow = await Show.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Show updated successfully',
      data: updatedShow,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelShow(req, res, next) {
  try {
    const show = await Show.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Show cancelled successfully',
      data: show,
    });
  } catch (err) {
    next(err);
  }
}