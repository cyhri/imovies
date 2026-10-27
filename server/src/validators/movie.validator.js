import mongoose from 'mongoose';

const VALID_RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'U', 'UA', 'A'];

export function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName}: not a valid identifier`,
      });
    }
    next();
  };
}

export function validateCreateMovie(req, res, next) {
  const { title, description, duration, genres, language, releaseDate, posterUrl, rating, isActive } = req.body || {};
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Movie title is required and cannot be empty');
  } else if (title.trim().length > 200) {
    errors.push('Movie title cannot exceed 200 characters');
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('Description is required and cannot be empty');
  } else if (description.trim().length > 2000) {
    errors.push('Description cannot exceed 2000 characters');
  }

  if (duration === undefined || duration === null || typeof duration !== 'number' || isNaN(duration) || duration < 1) {
    errors.push('Duration in minutes is required and must be at least 1');
  }

  if (!Array.isArray(genres) || genres.length === 0) {
    errors.push('At least one genre is required');
  } else {
    const invalidGenre = genres.some((g) => typeof g !== 'string' || g.trim().length === 0);
    if (invalidGenre) {
      errors.push('All genres must be non-empty strings');
    }
  }

  if (!language || typeof language !== 'string' || language.trim().length === 0) {
    errors.push('Language is required');
  } else if (language.trim().length > 50) {
    errors.push('Language cannot exceed 50 characters');
  }

  if (!releaseDate) {
    errors.push('Release date is required');
  } else if (isNaN(Date.parse(releaseDate))) {
    errors.push('Release date must be a valid date');
  }

  if (posterUrl !== undefined && typeof posterUrl !== 'string') {
    errors.push('Poster URL must be a string');
  }

  if (rating !== undefined && !VALID_RATINGS.includes(rating)) {
    errors.push(`Rating must be one of: ${VALID_RATINGS.join(', ')}`);
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

export function validateUpdateMovie(req, res, next) {
  const { title, description, duration, genres, language, releaseDate, posterUrl, rating, isActive } = req.body || {};
  const errors = [];

  const providedKeys = Object.keys(req.body || {});
  if (providedKeys.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No update fields provided',
    });
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push('Movie title cannot be empty');
    } else if (title.trim().length > 200) {
      errors.push('Movie title cannot exceed 200 characters');
    }
  }

  if (description !== undefined) {
    if (typeof description !== 'string' || description.trim().length === 0) {
      errors.push('Description cannot be empty');
    } else if (description.trim().length > 2000) {
      errors.push('Description cannot exceed 2000 characters');
    }
  }

  if (duration !== undefined) {
    if (typeof duration !== 'number' || isNaN(duration) || duration < 1) {
      errors.push('Duration must be a positive number of minutes');
    }
  }

  if (genres !== undefined) {
    if (!Array.isArray(genres) || genres.length === 0) {
      errors.push('Genres must be a non-empty array of strings');
    } else if (genres.some((g) => typeof g !== 'string' || g.trim().length === 0)) {
      errors.push('All genres must be non-empty strings');
    }
  }

  if (language !== undefined) {
    if (typeof language !== 'string' || language.trim().length === 0) {
      errors.push('Language cannot be empty');
    } else if (language.trim().length > 50) {
      errors.push('Language cannot exceed 50 characters');
    }
  }

  if (releaseDate !== undefined && isNaN(Date.parse(releaseDate))) {
    errors.push('Release date must be a valid date');
  }

  if (posterUrl !== undefined && typeof posterUrl !== 'string') {
    errors.push('Poster URL must be a string');
  }

  if (rating !== undefined && !VALID_RATINGS.includes(rating)) {
    errors.push(`Rating must be one of: ${VALID_RATINGS.join(', ')}`);
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