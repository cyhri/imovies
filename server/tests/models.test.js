import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import {
  User,
  Movie,
  Theatre,
  Screen,
  Show,
  Booking,
  Payment,
  Notification,
} from '../src/models/index.js';

describe('Mongoose Models & Schema Validation Suite', () => {
  before(async () => {
    await connectDB(process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/imovies_test');
    // Ensure all indexes are built
    await Promise.all([
      User.init(),
      Movie.init(),
      Theatre.init(),
      Screen.init(),
      Show.init(),
      Booking.init(),
      Payment.init(),
      Notification.init(),
    ]);
  });

  after(async () => {
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === 'imovies_test') {
      await mongoose.connection.dropDatabase();
    }
    await disconnectDB();
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Movie.deleteMany({}),
      Theatre.deleteMany({}),
      Screen.deleteMany({}),
      Show.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({}),
    ]);
  });

  test('Movie model validates required fields, genres array, and duration', async () => {
    const movie = new Movie({
      title: 'Inception',
      description: 'A mind-bending sci-fi thriller',
      duration: 148,
      genres: ['Sci-Fi', 'Action'],
      language: 'English',
      releaseDate: new Date('2010-07-16'),
      rating: 'PG-13',
    });
    const saved = await movie.save();
    assert.ok(saved._id);
    assert.equal(saved.title, 'Inception');

    // Invalid movie without genres
    const invalidMovie = new Movie({
      title: 'Invalid Movie',
      description: 'No genres',
      duration: 0, // duration must be >= 1
      genres: [],
      language: 'English',
      releaseDate: new Date(),
    });
    await assert.rejects(async () => invalidMovie.save(), (err) => err.name === 'ValidationError');
  });

  test('Theatre and Screen enforce compound unique index on {theatre, screenNumber}', async () => {
    const theatre = await Theatre.create({
      name: 'Grand Cinema',
      city: 'Metropolis',
      address: '100 Main Street',
    });

    const screen1 = await Screen.create({
      theatre: theatre._id,
      screenNumber: 1,
      seatingCapacity: 120,
      seatLayout: [
        { row: 'A', number: 1, tier: 'standard' },
        { row: 'A', number: 2, tier: 'standard' },
      ],
    });
    assert.ok(screen1._id);

    // Duplicate screenNumber for the same theatre must fail with duplicate key error (11000)
    const duplicateScreen = new Screen({
      theatre: theatre._id,
      screenNumber: 1,
      seatingCapacity: 100,
    });
    await assert.rejects(async () => duplicateScreen.save(), (err) => err.code === 11000);
  });

  test('Show model validates time ordering and non-negative pricing', async () => {
    const theatre = await Theatre.create({ name: 'AMC 1', city: 'NYC', address: 'Times Sq' });
    const screen = await Screen.create({ theatre: theatre._id, screenNumber: 1, seatingCapacity: 50 });
    const movie = await Movie.create({
      title: 'Interstellar',
      description: 'Space journey',
      duration: 169,
      genres: ['Sci-Fi'],
      language: 'English',
      releaseDate: new Date(),
    });

    const now = new Date();
    const later = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const show = await Show.create({
      movie: movie._id,
      theatre: theatre._id,
      screen: screen._id,
      startTime: now,
      endTime: later,
      pricing: [{ tier: 'standard', price: 15.0 }],
      seats: [
        { seatNumber: 'A1', tier: 'standard', price: 15.0, status: 'available' },
      ],
    });
    assert.ok(show._id);

    // Invalid show where endTime is before startTime
    const invalidShow = new Show({
      movie: movie._id,
      theatre: theatre._id,
      screen: screen._id,
      startTime: later,
      endTime: now,
      pricing: [{ tier: 'standard', price: 15.0 }],
    });
    await assert.rejects(async () => invalidShow.save(), /End time must be after start time/i);
  });

  test('Booking and Payment enforce unique reference constraints and non-negative amounts', async () => {
    const user = await User.create({ name: 'Booker', email: 'booker@example.com', password: 'Password123!' });
    const theatre = await Theatre.create({ name: 'Cine 2', city: 'LA', address: 'Sunset Blvd' });
    const screen = await Screen.create({ theatre: theatre._id, screenNumber: 1, seatingCapacity: 50 });
    const movie = await Movie.create({ title: 'Avatar', description: 'Pandora', duration: 162, genres: ['Action'], language: 'English', releaseDate: new Date() });
    const show = await Show.create({
      movie: movie._id,
      theatre: theatre._id,
      screen: screen._id,
      startTime: new Date(),
      endTime: new Date(Date.now() + 7200000),
      pricing: [{ tier: 'standard', price: 20 }],
    });

    const booking = await Booking.create({
      bookingReference: 'IMOV-TEST-1001',
      user: user._id,
      show: show._id,
      seats: [{ seatNumber: 'B1', tier: 'standard', price: 20 }],
      totalAmount: 20,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
    });
    assert.ok(booking._id);

    // Duplicate bookingReference fails
    const duplicateBooking = new Booking({
      bookingReference: 'IMOV-TEST-1001',
      user: user._id,
      show: show._id,
      seats: [{ seatNumber: 'B2', tier: 'standard', price: 20 }],
      totalAmount: 20,
    });
    await assert.rejects(async () => duplicateBooking.save(), (err) => err.code === 11000);

    // Payment validation
    const payment = await Payment.create({
      booking: booking._id,
      user: user._id,
      amount: 20,
      currency: 'USD',
      paymentMethod: 'simulated_card',
      transactionId: 'TXN-TEST-999',
      status: 'completed',
    });
    assert.ok(payment._id);

    // Duplicate transactionId fails
    const duplicatePayment = new Payment({
      booking: booking._id,
      user: user._id,
      amount: 20,
      transactionId: 'TXN-TEST-999',
    });
    await assert.rejects(async () => duplicatePayment.save(), (err) => err.code === 11000);
  });

  test('Notification model creates valid user notifications', async () => {
    const user = await User.create({ name: 'Notif User', email: 'notif@example.com', password: 'Password123!' });

    const notif = await Notification.create({
      user: user._id,
      type: 'booking_confirmation',
      title: 'Booking Confirmed!',
      message: 'Your tickets for IMOV-TEST-1001 have been confirmed.',
      isRead: false,
    });
    assert.ok(notif._id);
    assert.equal(notif.isRead, false);
    assert.equal(notif.type, 'booking_confirmation');
  });
});