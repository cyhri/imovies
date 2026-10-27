import mongoose from 'mongoose';

const VALID_SCREEN_TYPES = ['2D', '3D', 'IMAX', '4DX', 'Dolby Cinema'];
const VALID_SEAT_TIERS = ['standard', 'premium', 'vip'];

export function validateCreateTheatre(req, res, next) {
  const { name, city, address, phone, isActive } = req.body || {};
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Theatre name is required and must be at least 2 characters long');
  } else if (name.trim().length > 150) {
    errors.push('Theatre name cannot exceed 150 characters');
  }

  if (!city || typeof city !== 'string' || city.trim().length === 0) {
    errors.push('City is required');
  }

  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    errors.push('Address is required');
  } else if (address.trim().length > 500) {
    errors.push('Address cannot exceed 500 characters');
  }

  if (phone !== undefined && typeof phone !== 'string') {
    errors.push('Phone must be a string');
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push('isActive must be a boolean');
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

export function validateUpdateTheatre(req, res, next) {
  const { name, city, address, phone, isActive } = req.body || {};
  const errors = [];

  const providedKeys = Object.keys(req.body || {});
  if (providedKeys.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No update fields provided',
    });
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Theatre name must be at least 2 characters long');
    } else if (name.trim().length > 150) {
      errors.push('Theatre name cannot exceed 150 characters');
    }
  }

  if (city !== undefined && (typeof city !== 'string' || city.trim().length === 0)) {
    errors.push('City cannot be empty');
  }

  if (address !== undefined) {
    if (typeof address !== 'string' || address.trim().length === 0) {
      errors.push('Address cannot be empty');
    } else if (address.trim().length > 500) {
      errors.push('Address cannot exceed 500 characters');
    }
  }

  if (phone !== undefined && typeof phone !== 'string') {
    errors.push('Phone must be a string');
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push('isActive must be a boolean');
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

export function validateCreateScreen(req, res, next) {
  const { screenNumber, name, screenType, seatingCapacity, seatLayout } = req.body || {};
  const errors = [];

  if (screenNumber === undefined || screenNumber === null || typeof screenNumber !== 'number' || screenNumber < 1) {
    errors.push('Screen number is required and must be a positive integer');
  }

  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    errors.push('Screen name must be a non-empty string');
  }

  if (screenType !== undefined && !VALID_SCREEN_TYPES.includes(screenType)) {
    errors.push(`Screen type must be one of: ${VALID_SCREEN_TYPES.join(', ')}`);
  }

  if (seatingCapacity === undefined || seatingCapacity === null || typeof seatingCapacity !== 'number' || seatingCapacity < 1) {
    errors.push('Seating capacity is required and must be at least 1');
  }

  if (seatLayout !== undefined) {
    if (!Array.isArray(seatLayout)) {
      errors.push('seatLayout must be an array of seat objects');
    } else {
      for (let i = 0; i < seatLayout.length; i++) {
        const seat = seatLayout[i];
        if (!seat || !seat.row || typeof seat.row !== 'string' || !seat.number || typeof seat.number !== 'number') {
          errors.push(`Seat at index ${i} must have a valid row (string) and number (integer)`);
          break;
        }
        if (seat.tier && !VALID_SEAT_TIERS.includes(seat.tier)) {
          errors.push(`Seat tier must be one of: ${VALID_SEAT_TIERS.join(', ')}`);
          break;
        }
      }
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

export function validateUpdateScreen(req, res, next) {
  const { screenNumber, name, screenType, seatingCapacity, seatLayout } = req.body || {};
  const errors = [];

  const providedKeys = Object.keys(req.body || {});
  if (providedKeys.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No update fields provided',
    });
  }

  if (screenNumber !== undefined && (typeof screenNumber !== 'number' || screenNumber < 1)) {
    errors.push('Screen number must be a positive integer');
  }

  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    errors.push('Screen name cannot be empty');
  }

  if (screenType !== undefined && !VALID_SCREEN_TYPES.includes(screenType)) {
    errors.push(`Screen type must be one of: ${VALID_SCREEN_TYPES.join(', ')}`);
  }

  if (seatingCapacity !== undefined && (typeof seatingCapacity !== 'number' || seatingCapacity < 1)) {
    errors.push('Seating capacity must be at least 1');
  }

  if (seatLayout !== undefined && !Array.isArray(seatLayout)) {
    errors.push('seatLayout must be an array');
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