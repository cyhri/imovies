import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    genres: {
      type: [String],
      required: [true, 'At least one genre is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'A movie must have at least one genre',
      },
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
      maxlength: [50, 'Language cannot exceed 50 characters'],
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
    },
    posterUrl: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      type: String,
      enum: {
        values: ['G', 'PG', 'PG-13', 'R', 'NC-17', 'U', 'UA', 'A'],
        message: '{VALUE} is not a valid age rating',
      },
      default: 'PG-13',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

movieSchema.index({ title: 1, isActive: 1 });
movieSchema.index({ releaseDate: 1 });

export const Movie = mongoose.model('Movie', movieSchema);
export default Movie;