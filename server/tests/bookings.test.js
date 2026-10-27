import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Booking } from '../src/models/booking.model.js';
import { Show } from '../src/models/show.model.js';
import { Movie } from '../src/models/movie.model.js';
import { Theatre } from '../src/models/theatre.model.js';
import { Screen } from '../src/models/screen.model.js';
import { User } from '../src/models/user.model.js';
import { Notification } from '../src/models/notification.model.js';
import { generateToken } from '../src/services/token.service.js';

describe('Secure Booking & Concurrency Suite', () => {
  let user1;
  let user1Token;
  let user2;
  let user2Token;
  let admin;
  let adminToken;
  let testMovie;
  let testTheatre;
  let testScreen;
  let testShow;

  before(async () => {
    await connectDB(process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/imovies_test');
  });

  after(async () => {
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === 'imovies_test') {
      await mongoose.connection.dropDatabase();
    }
    await disconnectDB();
  });

  beforeEach(async () => {
    await Notification.deleteMany({});
    await Booking.deleteMany({});
    await Show.deleteMany({});
    await Screen.deleteMany({});
    await Theatre.deleteMany({});
    await Movie.deleteMany({});
    await User.deleteMany({});

    user1 = await User.create({
      name: 'Alice User',
      email: 'alice@example.com',
      password: 'Password123!',
      role: 'user',
    });
    user1Token = generateToken({ id: user1._id, role: 'user' });

    user2 = await User.create({
      name: 'Bob User',
      email: 'bob@example.com',
      password: 'Password123!',
      role: 'user',
    });
    user2Token = generateToken({ id: user2._id, role: 'user' });

    admin = await User.create({
      name: 'Admin Manager',
      email: 'admin@imovies.com',
      password: 'AdminPassword123!',
      role: 'admin',
    });
    adminToken = generateToken({ id: admin._id, role: 'admin' });

    testMovie = await Movie.create({
      title: 'Gladiator II',
      description: 'Years after witnessing the death of Maximus.',
      duration: 148,
      genres: ['Action', 'Drama'],
      language: 'English',
      releaseDate: new Date('2024-11-22'),
      rating: 'R',
    });

    testTheatre = await Theatre.create({
      name: 'Starlight Multiplex',
      city: 'Boston',
      address: '200 Boylston St',
    });

    testScreen = await Screen.create({
      theatre: testTheatre._id,
      screenNumber: 1,
      name: 'Dolby Hall',
      screenType: 'Dolby Cinema',
      seatingCapacity: 4,
      seatLayout: [
        { row: 'A', number: 1, tier: 'vip' },
        { row: 'A', number: 2, tier: 'vip' },
        { row: 'B', number: 1, tier: 'standard' },
        { row: 'B', number: 2, tier: 'standard' },
      ],
    });

    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    testShow = await Show.create({
      movie: testMovie._id,
      theatre: testTheatre._id,
      screen: testScreen._id,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 3 * 3600 * 1000),
      pricing: [
        { tier: 'vip', price: 25 },
        { tier: 'standard', price: 15 },
      ],
      seats: [
        { seatNumber: 'A1', tier: 'vip', price: 25, status: 'available' },
        { seatNumber: 'A2', tier: 'vip', price: 25, status: 'available' },
        { seatNumber: 'B1', tier: 'standard', price: 15, status: 'available' },
        { seatNumber: 'B2', tier: 'standard', price: 15, status: 'available' },
      ],
      status: 'scheduled',
    });
  });

  test('POST /api/bookings rejects unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({
        showId: testShow._id.toString(),
        seatNumbers: ['A1'],
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('POST /api/bookings validates input payload and rejects duplicates', async () => {
    // 1. Missing seatNumbers
    const resEmpty = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ showId: testShow._id.toString(), seatNumbers: [] });
    assert.equal(resEmpty.status, 400);

    // 2. Duplicate seats in payload
    const resDup = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ showId: testShow._id.toString(), seatNumbers: ['A1', 'A1'] });
    assert.equal(resDup.status, 400);

    // 3. Non-existent seat in layout
    const resBadSeat = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ showId: testShow._id.toString(), seatNumbers: ['Z99'] });
    assert.equal(resBadSeat.status, 400);
  });

  test('POST /api/bookings successfully books seats and calculates authoritative price', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        showId: testShow._id.toString(),
        seatNumbers: ['A1', 'B1'], // A1 is $25 (vip), B1 is $15 (standard)
        // Client attempts to send fake price total
        totalAmount: 1.0,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.toString(), user1._id.toString());
    assert.equal(res.body.data.seats.length, 2);
    // Server must ignore client 1.0 and calculate 25 + 15 = 40
    assert.equal(res.body.data.totalAmount, 40);
    assert.equal(res.body.data.bookingStatus, 'confirmed');
    assert.equal(res.body.data.paymentStatus, 'unpaid');
    assert.ok(res.body.data.bookingReference.startsWith('IMV-'));

    // Verify show document now marks A1 and B1 as booked
    const updatedShow = await Show.findById(testShow._id);
    const seatA1 = updatedShow.seats.find((s) => s.seatNumber === 'A1');
    const seatB1 = updatedShow.seats.find((s) => s.seatNumber === 'B1');
    const seatA2 = updatedShow.seats.find((s) => s.seatNumber === 'A2');

    assert.equal(seatA1.status, 'booked');
    assert.equal(seatA1.reservedBy.toString(), user1._id.toString());
    assert.equal(seatB1.status, 'booked');
    assert.equal(seatA2.status, 'available');
  });

  test('POST /api/bookings rejects booking already-booked seats with 409 Conflict', async () => {
    // User 1 books A1
    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ showId: testShow._id.toString(), seatNumbers: ['A1'] });

    // User 2 attempts to book A1
    const resConflict = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ showId: testShow._id.toString(), seatNumbers: ['A1', 'A2'] });

    assert.equal(resConflict.status, 409);
    assert.equal(resConflict.body.success, false);

    // Verify A2 remains available
    const show = await Show.findById(testShow._id);
    const seatA2 = show.seats.find((s) => s.seatNumber === 'A2');
    assert.equal(seatA2.status, 'available');
  });

  test('Double Booking Prevention: Concurrent requests for the same seat result in exactly one success', async () => {
    // Both User 1 and User 2 send simultaneous requests for seat A1
    const req1 = request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ showId: testShow._id.toString(), seatNumbers: ['A1'] });

    const req2 = request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ showId: testShow._id.toString(), seatNumbers: ['A1'] });

    const [res1, res2] = await Promise.all([req1, req2]);

    const statuses = [res1.status, res2.status].sort();
    // Exactly one must be 201 Created and the other must be 409 Conflict
    assert.deepEqual(statuses, [201, 409], 'One request must succeed with 201 and the other fail with 409');

    // Only one booking exists in DB
    const bookingCount = await Booking.countDocuments({ show: testShow._id });
    assert.equal(bookingCount, 1);
  });

  test('GET /api/bookings/my-bookings returns only the authenticated user bookings', async () => {
    // User 1 makes 2 bookings
    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ showId: testShow._id.toString(), seatNumbers: ['A1'] });

    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ showId: testShow._id.toString(), seatNumbers: ['A2'] });

    // User 2 makes 1 booking
    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ showId: testShow._id.toString(), seatNumbers: ['B1'] });

    // User 1 requests their history
    const res1 = await request(app)
      .get('/api/bookings/my-bookings')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.equal(res1.status, 200);
    assert.equal(res1.body.data.length, 2);
    assert.equal(res1.body.data[0].show.movie.title, 'Gladiator II');

    // User 2 requests their history
    const res2 = await request(app)
      .get('/api/bookings/my-bookings')
      .set('Authorization', `Bearer ${user2Token}`);

    assert.equal(res2.status, 200);
    assert.equal(res2.body.data.length, 1);
  });

  test('GET /api/bookings/:id prevents unauthorized access to another user booking', async () => {
    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ showId: testShow._id.toString(), seatNumbers: ['A1'] });

    const bookingId = bookingRes.body.data._id;

    // User 1 (owner) can view
    const ownerRes = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    assert.equal(ownerRes.status, 200);

    // User 2 (not owner) is forbidden
    const forbiddenRes = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    assert.equal(forbiddenRes.status, 403);

    // Admin can view
    const adminRes = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(adminRes.status, 200);
  });

  test('PATCH /api/bookings/:id/cancel cancels booking and releases seats', async () => {
    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ showId: testShow._id.toString(), seatNumbers: ['A1', 'A2'] });

    const bookingId = bookingRes.body.data._id;

    // Cancel booking
    const cancelRes = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${user1Token}`);

    assert.equal(cancelRes.status, 200);
    assert.equal(cancelRes.body.data.bookingStatus, 'cancelled');

    // Verify seats in Show are released back to available
    const show = await Show.findById(testShow._id);
    const seatA1 = show.seats.find((s) => s.seatNumber === 'A1');
    const seatA2 = show.seats.find((s) => s.seatNumber === 'A2');
    assert.equal(seatA1.status, 'available');
    assert.equal(seatA1.reservedBy, null);
    assert.equal(seatA2.status, 'available');
    assert.equal(seatA2.reservedBy, null);

    // Attempting to cancel an already-cancelled booking is rejected
    const repeatCancel = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${user1Token}`);
    assert.equal(repeatCancel.status, 400);
    assert.equal(repeatCancel.body.success, false);
  });
});