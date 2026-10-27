import { Theatre } from '../models/theatre.model.js';
import { Screen } from '../models/screen.model.js';

// --- THEATRES ---

export async function getTheatres(req, res, next) {
  try {
    const { city, search, q, all } = req.query;
    const filter = {};

    if (all !== 'true') {
      filter.isActive = true;
    }

    if (city && city.trim()) {
      filter.city = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
    }

    const searchQuery = (search || q || '').trim();
    if (searchQuery) {
      filter.name = { $regex: searchQuery, $options: 'i' };
    }

    const theatres = await Theatre.find(filter).sort({ city: 1, name: 1 });

    return res.status(200).json({
      success: true,
      data: theatres,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTheatreById(req, res, next) {
  try {
    const theatre = await Theatre.findById(req.params.id);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found',
      });
    }

    if (!theatre.isActive && req.user?.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: theatre,
    });
  } catch (err) {
    next(err);
  }
}

export async function createTheatre(req, res, next) {
  try {
    const theatre = await Theatre.create(req.body);

    return res.status(201).json({
      success: true,
      message: 'Theatre created successfully',
      data: theatre,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTheatre(req, res, next) {
  try {
    const theatre = await Theatre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Theatre updated successfully',
      data: theatre,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteTheatre(req, res, next) {
  try {
    const theatre = await Theatre.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Theatre deactivated successfully',
      data: theatre,
    });
  } catch (err) {
    next(err);
  }
}

// --- SCREENS ---

export async function getScreensByTheatre(req, res, next) {
  try {
    const { theatreId } = req.params;
    const theatre = await Theatre.findById(theatreId);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found',
      });
    }

    const screens = await Screen.find({ theatre: theatreId }).sort({ screenNumber: 1 });

    return res.status(200).json({
      success: true,
      data: screens,
    });
  } catch (err) {
    next(err);
  }
}

export async function createScreen(req, res, next) {
  try {
    const { theatreId } = req.params;
    const theatre = await Theatre.findById(theatreId);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found',
      });
    }

    const { screenNumber, name, screenType, seatingCapacity, seatLayout } = req.body;

    // Check for existing screen with same screenNumber in this theatre
    const existingScreen = await Screen.findOne({ theatre: theatreId, screenNumber });
    if (existingScreen) {
      return res.status(409).json({
        success: false,
        message: `Screen number ${screenNumber} already exists in this theatre`,
      });
    }

    // Auto-generate seatLayout if not provided
    let finalSeatLayout = seatLayout;
    if (!finalSeatLayout || finalSeatLayout.length === 0) {
      finalSeatLayout = [];
      const capacity = seatingCapacity || 50;
      const seatsPerRow = 10;
      const rowsNeeded = Math.ceil(capacity / seatsPerRow);
      const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

      let count = 0;
      for (let r = 0; r < rowsNeeded && count < capacity; r++) {
        const row = rowLetters[r] || `R${r + 1}`;
        for (let n = 1; n <= seatsPerRow && count < capacity; n++) {
          const tier = r < 2 ? 'vip' : r < 5 ? 'premium' : 'standard';
          finalSeatLayout.push({ row, number: n, tier });
          count++;
        }
      }
    }

    const screen = await Screen.create({
      theatre: theatreId,
      screenNumber,
      name: name || `Screen ${screenNumber}`,
      screenType: screenType || '2D',
      seatingCapacity,
      seatLayout: finalSeatLayout,
    });

    return res.status(201).json({
      success: true,
      message: 'Screen created successfully',
      data: screen,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Screen with this number already exists for this theatre',
      });
    }
    next(err);
  }
}

export async function getScreenById(req, res, next) {
  try {
    const screen = await Screen.findById(req.params.id).populate('theatre', 'name city address');

    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: screen,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateScreen(req, res, next) {
  try {
    const screen = await Screen.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Screen updated successfully',
      data: screen,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Screen number conflict within this theatre',
      });
    }
    next(err);
  }
}

export async function deleteScreen(req, res, next) {
  try {
    const screen = await Screen.findByIdAndDelete(req.params.id);

    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Screen deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}