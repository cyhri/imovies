import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Theatre } from '../src/models/theatre.model.js';
import { Screen } from '../src/models/screen.model.js';
import { User } from '../src/models/user.model.js';
import { generateToken } from '../src/services/token.service.js';

describe('Theatre & Screen Discovery and Management Suite', () => {
  let adminToken;
  let userToken;

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
    await Screen.deleteMany({});
    await Theatre.deleteMany({});
    await User.deleteMany({});

    const admin = await User.create({
      name: 'Cinema Manager',
      email: 'manager@cinema.com',
      password: 'AdminPassword123!',
      role: 'admin',
    });
    adminToken = generateToken({ id: admin._id, role: 'admin' });

    const customer = await User.create({
      name: 'Test Customer',
      email: 'customer@cinema.com',
      password: 'CustomerPassword123!',
      role: 'user',
    });
    userToken = generateToken({ id: customer._id, role: 'user' });
  });

  test('POST /api/theatres creates a theatre with admin authorization', async () => {
    const payload = {
      name: 'Grand IMAX Downtown',
      city: 'New York',
      address: '100 Broadway, New York, NY 10005',
      phone: '+1-212-555-0199',
    };

    const res = await request(app)
      .post('/api/theatres')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.name, 'Grand IMAX Downtown');
    assert.equal(res.body.data.city, 'New York');
  });

  test('GET /api/theatres lists theatres and filters by city', async () => {
    await Theatre.create([
      { name: 'AMC Lincoln Square', city: 'New York', address: '1998 Broadway' },
      { name: 'Regal LA Live', city: 'Los Angeles', address: '1000 W Olympic Blvd' },
    ]);

    // All active theatres
    const allRes = await request(app).get('/api/theatres');
    assert.equal(allRes.status, 200);
    assert.equal(allRes.body.data.length, 2);

    // Filter by city
    const cityRes = await request(app).get('/api/theatres?city=New York');
    assert.equal(cityRes.status, 200);
    assert.equal(cityRes.body.data.length, 1);
    assert.equal(cityRes.body.data[0].name, 'AMC Lincoln Square');
  });

  test('POST /api/theatres/:theatreId/screens adds a screen with capacity and seatLayout', async () => {
    const theatre = await Theatre.create({
      name: 'Cineplex Metropolis',
      city: 'Chicago',
      address: '500 N Michigan Ave',
    });

    const screenPayload = {
      screenNumber: 1,
      name: 'IMAX Laser Hall',
      screenType: 'IMAX',
      seatingCapacity: 40,
    };

    const res = await request(app)
      .post(`/api/theatres/${theatre._id}/screens`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(screenPayload);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.screenNumber, 1);
    assert.equal(res.body.data.screenType, 'IMAX');
    assert.ok(res.body.data.seatLayout.length > 0);
  });

  test('POST /api/theatres/:theatreId/screens enforces compound uniqueness on {theatre, screenNumber}', async () => {
    const theatre = await Theatre.create({
      name: 'Unique Cinema',
      city: 'Seattle',
      address: '10 Pike St',
    });

    // Create Screen 1
    const firstRes = await request(app)
      .post(`/api/theatres/${theatre._id}/screens`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ screenNumber: 1, seatingCapacity: 50 });
    assert.equal(firstRes.status, 201);

    // Attempt to create duplicate Screen 1 on same theatre
    const duplicateRes = await request(app)
      .post(`/api/theatres/${theatre._id}/screens`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ screenNumber: 1, seatingCapacity: 60 });

    assert.equal(duplicateRes.status, 409);
    assert.equal(duplicateRes.body.success, false);
  });

  test('GET /api/theatres/:theatreId/screens lists all screens for a specific theatre', async () => {
    const theatreA = await Theatre.create({ name: 'Theatre A', city: 'Austin', address: '1 Congress' });
    const theatreB = await Theatre.create({ name: 'Theatre B', city: 'Austin', address: '2 Congress' });

    await Screen.create([
      { theatre: theatreA._id, screenNumber: 1, seatingCapacity: 30 },
      { theatre: theatreA._id, screenNumber: 2, seatingCapacity: 40 },
      { theatre: theatreB._id, screenNumber: 1, seatingCapacity: 50 },
    ]);

    const res = await request(app).get(`/api/theatres/${theatreA._id}/screens`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 2);
    assert.equal(res.body.data[0].screenNumber, 1);
    assert.equal(res.body.data[1].screenNumber, 2);
  });
});