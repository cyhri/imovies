import mongoose from 'mongoose';

export function validateCreateBooking(req, res, next) {
  const { showId, seatNumbers } = req.body || {};
  const errors = [];

  if (!showId || !mongoose.Types.ObjectId.isValid(showId)) {
    errors.push('showId is required and must be a valid ObjectId');
  }

  if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    errors.push('seatNumbers must be a non-empty array of seat identifiers');
  } else {
    const invalidSeat = seatNumbers.some((s) => typeof s !== 'string' || s.trim().length === 0);
    if (invalidSeat) {
      errors.push('All seatNumbers must be non-empty strings (e.g. "A1")');
    }

    // Check for duplicate seat selections in the request
    const uniqueSeats = new Set(seatNumbers.map((s) => s.trim().toUpperCase()));
    if (uniqueSeats.size !== seatNumbers.length) {
      errors.push('Duplicate seat numbers detected in the selection');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
}