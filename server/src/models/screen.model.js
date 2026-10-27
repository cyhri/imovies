import mongoose from 'mongoose';

const seatLayoutSchema = new mongoose.Schema(
  {
    row: {
      type: String,
      required: [true, 'Row is required (e.g. A)'],
      trim: true,
      uppercase: true,
    },
    number: {
      type: Number,
      required: [true, 'Seat number is required'],
      min: [1, 'Seat number must be at least 1'],
    },
    tier: {
      type: String,
      enum: ['standard', 'premium', 'vip'],
      default: 'standard',
    },
  },
  { _id: false }
);

const screenSchema = new mongoose.Schema(
  {
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Theatre reference is required'],
      index: true,
    },
    screenNumber: {
      type: Number,
      required: [true, 'Screen number is required'],
      min: [1, 'Screen number must be at least 1'],
    },
    name: {
      type: String,
      trim: true,
      default: function () {
        return `Screen ${this.screenNumber}`;
      },
    },
    screenType: {
      type: String,
      enum: ['2D', '3D', 'IMAX', '4DX', 'Dolby Cinema'],
      default: '2D',
    },
    seatingCapacity: {
      type: Number,
      required: [true, 'Seating capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    seatLayout: {
      type: [seatLayoutSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

screenSchema.index({ theatre: 1, screenNumber: 1 }, { unique: true });

export const Screen = mongoose.model('Screen', screenSchema);
export default Screen;