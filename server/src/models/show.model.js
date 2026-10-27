import mongoose from 'mongoose';

const showSeatSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    tier: {
      type: String,
      enum: ['standard', 'premium', 'vip'],
      default: 'standard',
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Seat price cannot be negative'],
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'booked'],
      default: 'available',
    },
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reservedAt: {
      type: Date,
      default: null,
    },
    holdExpiresAt: {
      type: Date,
      default: null,
    },
    holdToken: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
  },
  { _id: false }
);

const pricingTierSchema = new mongoose.Schema(
  {
    tier: {
      type: String,
      enum: ['standard', 'premium', 'vip'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: false }
);

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie reference is required'],
      index: true,
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Theatre reference is required'],
      index: true,
    },
    screen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Screen',
      required: [true, 'Screen reference is required'],
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Show start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, 'Show end time is required'],
      validate: {
        validator: function (v) {
          return !this.startTime || v > this.startTime;
        },
        message: 'End time must be after start time',
      },
    },
    pricing: {
      type: [pricingTierSchema],
      required: [true, 'Pricing is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one pricing tier is required',
      },
    },
    seats: {
      type: [showSeatSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'completed'],
      default: 'scheduled',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

showSchema.index({ theatre: 1, startTime: 1 });
showSchema.index({ movie: 1, startTime: 1 });
showSchema.index({ screen: 1, startTime: 1 });
showSchema.index({ 'seats.holdExpiresAt': 1 });

export const Show = mongoose.model('Show', showSchema);
export default Show;