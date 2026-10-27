import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Movie } from '../src/models/movie.model.js';
import { Theatre } from '../src/models/theatre.model.js';
import { Screen } from '../src/models/screen.model.js';
import { Show } from '../src/models/show.model.js';
import { Booking } from '../src/models/booking.model.js';
import { User } from '../src/models/user.model.js';
import { generateToken } from '../src/services/token.service.js';

describe('Admin Authorization & Dashboard Management Suite', () => {
  let adminUser;
  let adminToken;
  let normalUser;
  let userToken;
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
    await Booking.deleteMany({});
    await Show.deleteMany({});
    await Screen.deleteMany({});
    await Theatre.deleteMany({});
    await Movie.deleteMany({});
    await User.deleteMany({});

    adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@cinema.com',
      password: 'AdminPassword123!',
      role: 'admin',
    });
    adminToken = generateToken({ id: adminUser._id, role: 'admin' });

    normalUser = await User.create({
      name: 'Regular Customer',
      email: 'customer@cinema.com',
      password: 'CustomerPassword123!',
      role: 'user',
    });
    userToken = generateToken({ id: normalUser._id, role: 'user' });

    testMovie = await Movie.create({
      title: 'Dune: Part Two',
      description: 'Paul Atreides unites with Chani.',
      duration: 166,
      genres: ['Sci-Fi', 'Action'],
      language: 'English',
      releaseDate: new Date('2024-03-01'),
      rating: 'PG-13',
    });

    testTheatre = await Theatre.create({
      name: 'Downtown Cinema',
      city: 'Chicago',
      address: '100 State St',
    });

    testScreen = await Screen.create({
      theatre: testTheatre._id,
      screenNumber: 1,
      name: 'Screen 1',
      screenType: 'IMAX',
      seatingCapacity: 20,
    });

    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    testShow = await Show.create({
      movie: testMovie._id,
      theatre: testTheatre._id,
      screen: testScreen._id,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 3 * 3600 * 1000),
      pricing: [{ tier: 'standard', price: 15 }],
      seats: [{ seatNumber: 'A1', tier: 'standard', price: 15, status: 'booked' }],
      status: 'scheduled',
    });

    await Booking.create({
      bookingReference: 'IMV-TEST-001',
      user: normalUser._id,
      show: testShow._id,
      seats: [{ seatNumber: 'A1', tier: 'standard', price: 15 }],
      totalAmount: 15,
      bookingStatus: 'confirmed',
      paymentStatus: 'unpaid',
    });
  });

  test('GET /api/admin/overview rejects unauthenticated or customer requests', async () => {
    // 1. Unauthenticated
    const resUnauth = await request(app).get('/api/admin/overview');
    assert.equal(resUnauth.status, 401);

    // 2. Regular user (forbidden)
    const resForbidden = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${userToken}`);
    assert.equal(resForbidden.status, 403);
    assert.equal(resForbidden.body.success, false);
  });

  test('GET /api/admin/overview returns live accurate metrics for authorized admin', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.metrics.movies.total, 1);
    assert.equal(res.body.data.metrics.movies.active, 1);
    assert.equal(res.body.data.metrics.theatres.total, 1);
    assert.equal(res.body.data.metrics.screens.total, 1);
    assert.equal(res.body.data.metrics.shows.total, 1);
    assert.equal(res.body.data.metrics.bookings.total, 1);
    assert.equal(res.body.data.metrics.revenue, 15);
    assert.equal(res.body.data.recentBookings.length, 1);
    assert.equal(res.body.data.recentBookings[0].bookingReference, 'IMV-TEST-001');
    assert.equal(res.body.data.recentBookings[0].user.email, 'customer@cinema.com');
  });

  test('GET /api/admin/bookings returns all customer bookings across platform for admin', async () => {
    // Forbidden for customer
    const resForbidden = await request(app)
      .get('/api/admin/bookings')
      .set('Authorization', `Bearer ${userToken}`);
    assert.equal(resForbidden.status, 403);

    // Authorized for admin
    const resAdmin = await request(app)
      .get('/api/admin/bookings')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(resAdmin.status, 200);
    assert.equal(resAdmin.body.data.length, 1);
    assert.equal(resAdmin.body.data[0].bookingReference, 'IMV-TEST-001');
    assert.equal(resAdmin.body.pagination.total, 1);
  });

  test('Admin Movie Operations: Create, edit, and deactivate movies', async () => {
    // 1. Create movie
    const createRes = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Interstellar',
        description: 'Wormhole explorers.',
        duration: 169,
        genres: ['Sci-Fi', 'Adventure'],
        language: 'English',
        releaseDate: '2014-11-07',
        rating: 'PG-13',
      });
    assert.equal(createRes.status, 201);
    const movieId = createRes.body.data._id;

    // 2. Edit movie
    const editRes = await request(app)
      .put(`/api/movies/${movieId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Interstellar (Remastered)' });
    assert.equal(editRes.status, 200);
    assert.equal(editRes.body.data.title, 'Interstellar (Remastered)');

    // 3. Deactivate movie
    const deleteRes = await request(app)
      .delete(`/api/movies/${movieId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(deleteRes.status, 200);
    assert.equal(deleteRes.body.data.isActive, false);

    // 4. Non-admin blocked from creating
    const nonAdminRes = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Blocked Movie' });
    assert.equal(nonAdminRes.status, 403);
  });

  test('Admin Theatre & Screen Operations: Enforces compound unique constraints', async () => {
    // 1. Create theatre
    const theatreRes = await request(app)
      .post('/api/theatres')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Cinema Majestic',
        city: 'Seattle',
        address: '500 Pike St',
      });
    assert.equal(theatreRes.status, 201);
    const theatreId = theatreRes.body.data._id;

    // 2. Add Screen 1
    const screenRes = await request(app)
      .post(`/api/theatres/${theatreId}/screens`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        screenNumber: 1,
        name: 'Screen 1 - Laser',
        screenType: 'IMAX',
        seatingCapacity: 40,
      });
    assert.equal(screenRes.status, 201);

    // 3. Duplicate Screen 1 rejected with 409
    const dupRes = await request(app)
      .post(`/api/theatres/${theatreId}/screens`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        screenNumber: 1,
        seatingCapacity: 50,
      });
    assert.equal(dupRes.status, 409);
  });

  test('Admin Showtime Operations: Schedule show and detect schedule overlap', async () => {
    const baseTime = new Date(Date.now() + 48 * 3600 * 1000);
    const start1 = new Date(baseTime.getTime() + 10 * 3600 * 1000);
    const end1 = new Date(baseTime.getTime() + 13 * 3600 * 1000);

    // 1. Admin creates first show (10:00 - 13:00)
    const show1Res = await request(app)
      .post('/api/shows')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        movie: testMovie._id.toString(),
        theatre: testTheatre._id.toString(),
        screen: testScreen._id.toString(),
        startTime: start1.toISOString(),
        endTime: end1.toISOString(),
        pricing: [{ tier: 'standard', price: 12 }],
      });
    assert.equal(show1Res.status, 201);

    // 2. Overlapping show (11:00 - 14:00) on same screen rejected with 409
    const overlapStart = new Date(baseTime.getTime() + 11 * 3600 * 1000);
    const overlapEnd = new Date(baseTime.getTime() + 14 * 3600 * 1000);

    const conflictRes = await request(app)
      .post('/api/shows')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        movie: testMovie._id.toString(),
        theatre: testTheatre._id.toString(),
        screen: testScreen._id.toString(),
        startTime: overlapStart.toISOString(),
        endTime: overlapEnd.toISOString(),
        pricing: [{ tier: 'standard', price: 12 }],
      });
    assert.equal(conflictRes.status, 409);
    assert.ok(conflictRes.body.message.includes('Schedule conflict'));
  });
});