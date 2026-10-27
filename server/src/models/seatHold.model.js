import mongoose from 'mongoose';

const heldSeatItemSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    tier: {
      type: String,
      enum: ['standard', 'premium', 'vip'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Seat price cannot be negative'],
    },
  },
  { _id: false }
);

const seatHoldSchema = new mongoose.Schema(
  {
    holdToken: {
      type: String,
      required: [true, 'Hold token is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: [true, 'Show reference is required'],
      index: true,
    },
    seats: {
      type: [heldSeatItemSchema],
      required: [true, 'At least one seat must be held'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'A hold must contain at least one seat',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'released', 'expired', 'completed'],
      default: 'active',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration timestamp is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

seatHoldSchema.index({ show: 1, status: 1 });
seatHoldSchema.index({ user: 1, status: 1 });
seatHoldSchema.index({ expiresAt: 1, status: 1 });

export const SeatHold = mongoose.model('SeatHold', seatHoldSchema);
export default SeatHold;