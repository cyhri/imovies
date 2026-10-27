import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Show } from '../src/models/show.model.js';
import { Movie } from '../src/models/movie.model.js';
import { Theatre } from '../src/models/theatre.model.js';
import { Screen } from '../src/models/screen.model.js';
import { User } from '../src/models/user.model.js';
import { generateToken } from '../src/services/token.service.js';

describe('Showtimes & Schedule Management Suite', () => {
  let adminToken;
  let testMovie;
  let testTheatre;
  let testScreen;

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
    await Show.deleteMany({});
    await Screen.deleteMany({});
    await Theatre.deleteMany({});
    await Movie.deleteMany({});
    await User.deleteMany({});

    const admin = await User.create({
      name: 'Show Scheduler',
      email: 'scheduler@imovies.com',
      password: 'AdminPassword123!',
      role: 'admin',
    });
    adminToken = generateToken({ id: admin._id, role: 'admin' });

    testMovie = await Movie.create({
      title: 'Dune: Part Two',
      description: 'Paul Atreides unites with the Fremen.',
      duration: 166,
      genres: ['Sci-Fi', 'Action'],
      language: 'English',
      releaseDate: new Date('2024-03-01'),
      rating: 'PG-13',
    });

    testTheatre = await Theatre.create({
      name: 'Cinema Central',
      city: 'San Francisco',
      address: '100 Market St',
    });

    testScreen = await Screen.create({
      theatre: testTheatre._id,
      screenNumber: 1,
      name: 'Screen 1',
      screenType: 'IMAX',
      seatingCapacity: 20,
      seatLayout: [
        { row: 'A', number: 1, tier: 'vip' },
        { row: 'A', number: 2, tier: 'vip' },
        { row: 'B', number: 1, tier: 'standard' },
        { row: 'B', number: 2, tier: 'standard' },
      ],
    });
  });

  test('POST /api/shows creates show and generates seats with tier pricing', async () => {
    const startTime = new Date(Date.now() + 24 * 3600 * 1000); // Tomorrow
    const endTime = new Date(startTime.getTime() + 3 * 3600 * 1000);

    const payload = {
      movie: testMovie._id.toString(),
      theatre: testTheatre._id.toString(),
      screen: testScreen._id.toString(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      pricing: [
        { tier: 'standard', price: 15 },
        { tier: 'vip', price: 25 },
      ],
    };

    const res = await request(app)
      .post('/api/shows')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'scheduled');

    // Verify seats array generated from screen layout with correct prices
    assert.equal(res.body.data.seats.length, 4);
    const vipSeat = res.body.data.seats.find((s) => s.seatNumber === 'A1');
    assert.ok(vipSeat);
    assert.equal(vipSeat.tier, 'vip');
    assert.equal(vipSeat.price, 25);
    assert.equal(vipSeat.status, 'available');

    const standardSeat = res.body.data.seats.find((s) => s.seatNumber === 'B1');
    assert.ok(standardSeat);
    assert.equal(standardSeat.tier, 'standard');
    assert.equal(standardSeat.price, 15);
  });

  test('POST /api/shows prevents overlapping showtimes on the same screen', async () => {
    const baseTime = new Date(Date.now() + 48 * 3600 * 1000); // 2 days from now
    const show1Start = new Date(baseTime.getTime() + 14 * 3600 * 1000); // 14:00
    const show1End = new Date(baseTime.getTime() + 17 * 3600 * 1000); // 17:00

    // Create first show: 14:00 - 17:00
    const firstRes = await request(app)
      .post('/api/shows')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        movie: testMovie._id.toString(),
        theatre: testTheatre._id.toString(),
        screen: testScreen._id.toString(),
        startTime: show1Start.toISOString(),
        endTime: show1End.toISOString(),
        pricing: [{ tier: 'standard', price: 12 }],
      });
    assert.equal(firstRes.status, 201);

    // Conflict 1: Overlapping time window (15:00 - 18:00) on the same screen
    const overlapStart = new Date(baseTime.getTime() + 15 * 3600 * 1000);
    const overlapEnd = new Date(baseTime.getTime() + 18 * 3600 * 1000);

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
    assert.equal(conflictRes.body.success, false);
    assert.ok(conflictRes.body.message.includes('Schedule conflict'));

    // Non-conflicting: Later that evening (18:00 - 21:00) on the same screen
    const validStart = new Date(baseTime.getTime() + 18 * 3600 * 1000);
    const validEnd = new Date(baseTime.getTime() + 21 * 3600 * 1000);

    const nonConflictRes = await request(app)
      .post('/api/shows')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        movie: testMovie._id.toString(),
        theatre: testTheatre._id.toString(),
        screen: testScreen._id.toString(),
        startTime: validStart.toISOString(),
        endTime: validEnd.toISOString(),
        pricing: [{ tier: 'standard', price: 12 }],
      });

    assert.equal(nonConflictRes.status, 201);
  });

  test('GET /api/shows filters by movie, theatre, and date', async () => {
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    const show = await Show.create({
      movie: testMovie._id,
      theatre: testTheatre._id,
      screen: testScreen._id,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 2 * 3600 * 1000),
      pricing: [{ tier: 'standard', price: 10 }],
      seats: [{ seatNumber: 'A1', tier: 'standard', price: 10, status: 'available' }],
      status: 'scheduled',
    });

    // 1. Filter by movie
    const resMovie = await request(app).get(`/api/shows?movie=${testMovie._id}`);
    assert.equal(resMovie.status, 200);
    assert.equal(resMovie.body.data.length, 1);
    assert.equal(resMovie.body.data[0].movie.title, 'Dune: Part Two');

    // 2. Filter by theatre
    const resTheatre = await request(app).get(`/api/shows?theatre=${testTheatre._id}`);
    assert.equal(resTheatre.status, 200);
    assert.equal(resTheatre.body.data.length, 1);
    assert.equal(resTheatre.body.data[0].theatre.name, 'Cinema Central');

    // 3. Detail by ID
    const resDetail = await request(app).get(`/api/shows/${show._id}`);
    assert.equal(resDetail.status, 200);
    assert.equal(resDetail.body.data._id.toString(), show._id.toString());
    assert.equal(resDetail.body.data.seats.length, 1);
  });

  test('PATCH /api/shows/:id/cancel cancels a show', async () => {
    const show = await Show.create({
      movie: testMovie._id,
      theatre: testTheatre._id,
      screen: testScreen._id,
      startTime: new Date(Date.now() + 3600 * 1000),
      endTime: new Date(Date.now() + 4 * 3600 * 1000),
      pricing: [{ tier: 'standard', price: 10 }],
      status: 'scheduled',
    });

    const res = await request(app)
      .patch(`/api/shows/${show._id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'cancelled');

    // Shows query default filters only scheduled
    const listRes = await request(app).get('/api/shows');
    assert.equal(listRes.body.data.length, 0);
  });
});