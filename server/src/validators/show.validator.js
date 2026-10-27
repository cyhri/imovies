import mongoose from 'mongoose';

const VALID_TIERS = ['standard', 'premium', 'vip'];
const VALID_STATUSES = ['scheduled', 'cancelled', 'completed'];

export function validateCreateShow(req, res, next) {
  const { movie, theatre, screen, startTime, endTime, pricing, status } = req.body || {};
  const errors = [];

  if (!movie || !mongoose.Types.ObjectId.isValid(movie)) {
    errors.push('Movie ID is required and must be a valid ObjectId');
  }

  if (!theatre || !mongoose.Types.ObjectId.isValid(theatre)) {
    errors.push('Theatre ID is required and must be a valid ObjectId');
  }

  if (!screen || !mongoose.Types.ObjectId.isValid(screen)) {
    errors.push('Screen ID is required and must be a valid ObjectId');
  }

  if (!startTime || isNaN(Date.parse(startTime))) {
    errors.push('Show startTime is required and must be a valid date');
  }

  if (!endTime || isNaN(Date.parse(endTime))) {
    errors.push('Show endTime is required and must be a valid date');
  }

  if (startTime && endTime && !isNaN(Date.parse(startTime)) && !isNaN(Date.parse(endTime))) {
    if (new Date(endTime) <= new Date(startTime)) {
      errors.push('Show endTime must be chronologically after startTime');
    }
  }

  if (!Array.isArray(pricing) || pricing.length === 0) {
    errors.push('At least one pricing tier is required');
  } else {
    for (let i = 0; i < pricing.length; i++) {
      const p = pricing[i];
      if (!p || !p.tier || !VALID_TIERS.includes(p.tier)) {
        errors.push(`Pricing at index ${i} must have a tier in: ${VALID_TIERS.join(', ')}`);
        break;
      }
      if (p.price === undefined || typeof p.price !== 'number' || p.price < 0) {
        errors.push(`Pricing for tier "${p.tier}" must be a non-negative number`);
        break;
      }
    }
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
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

export function validateUpdateShow(req, res, next) {
  const { movie, theatre, screen, startTime, endTime, pricing, status } = req.body || {};
  const errors = [];

  const providedKeys = Object.keys(req.body || {});
  if (providedKeys.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No update fields provided',
    });
  }

  if (movie !== undefined && !mongoose.Types.ObjectId.isValid(movie)) {
    errors.push('Movie ID must be a valid ObjectId');
  }

  if (theatre !== undefined && !mongoose.Types.ObjectId.isValid(theatre)) {
    errors.push('Theatre ID must be a valid ObjectId');
  }

  if (screen !== undefined && !mongoose.Types.ObjectId.isValid(screen)) {
    errors.push('Screen ID must be a valid ObjectId');
  }

  if (startTime !== undefined && isNaN(Date.parse(startTime))) {
    errors.push('startTime must be a valid date');
  }

  if (endTime !== undefined && isNaN(Date.parse(endTime))) {
    errors.push('endTime must be a valid date');
  }

  if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
    errors.push('Show endTime must be after startTime');
  }

  if (pricing !== undefined) {
    if (!Array.isArray(pricing) || pricing.length === 0) {
      errors.push('pricing must be a non-empty array of tier/price objects');
    } else {
      for (const p of pricing) {
        if (!p || !p.tier || !VALID_TIERS.includes(p.tier) || typeof p.price !== 'number' || p.price < 0) {
          errors.push('Invalid pricing structure');
          break;
        }
      }
    }
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
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