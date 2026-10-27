import { Movie } from '../models/movie.model.js';

export async function getMovies(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { q, search, genre, language, rating, sortBy = 'releaseDate', order = 'desc', all } = req.query;

    const filter = {};

    // By default, only return active movies unless explicitly requesting all
    if (all !== 'true') {
      filter.isActive = true;
    }

    const searchQuery = (q || search || '').trim();
    if (searchQuery) {
      filter.title = { $regex: searchQuery, $options: 'i' };
    }

    if (genre && genre.trim()) {
      filter.genres = { $regex: new RegExp(`^${genre.trim()}$`, 'i') };
    }

    if (language && language.trim()) {
      filter.language = { $regex: new RegExp(`^${language.trim()}$`, 'i') };
    }

    if (rating && rating.trim()) {
      filter.rating = rating.trim();
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const allowedSortFields = ['releaseDate', 'title', 'duration', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'releaseDate';
    const sort = { [sortField]: sortOrder };

    const [movies, total] = await Promise.all([
      Movie.find(filter).sort(sort).skip(skip).limit(limit),
      Movie.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: movies,
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

export async function getMovieById(req, res, next) {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    // Normal users cannot access inactive movies
    if (!movie.isActive && req.user?.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: movie,
    });
  } catch (err) {
    next(err);
  }
}

export async function createMovie(req, res, next) {
  try {
    const movie = await Movie.create(req.body);

    return res.status(201).json({
      success: true,
      message: 'Movie created successfully',
      data: movie,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateMovie(req, res, next) {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Movie updated successfully',
      data: movie,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteMovie(req, res, next) {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Movie deactivated successfully',
      data: movie,
    });
  } catch (err) {
    next(err);
  }
}