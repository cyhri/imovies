import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import http from 'node:http';
import { io as ClientIO } from 'socket.io-client';

import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Show, Movie, Theatre, Screen, User, Booking, SeatHold } from '../src/models/index.js';
import { initSocket, closeSocket } from '../src/socket.js';
import { cleanupExpiredHoldsNow } from '../src/services/holdCleanup.service.js';

describe('Real-Time Seat Holds & Concurrency Suite', () => {
  let userAToken, userBToken, adminToken;
  let userAId, userBId;
  let testMovie, testTheatre, testScreen, testShow;
  let testServer, testServerPort, socketClient;

  before(async () => {
    await connectDB(env.MONGODB_TEST_URI);

    // Create HTTP server for Socket.IO testing
    testServer = http.createServer(app);
    initSocket(testServer);
    await new Promise((resolve) => {
      testServer.listen(0, () => {
        testServerPort = testServer.address().port;
        resolve();
      });
    });
  });

  after(async () => {
    if (socketClient && socketClient.connected) {
      socketClient.disconnect();
    }
    closeSocket();
    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }
    await disconnectDB();
  });

  beforeEach(async () => {
    // Clear test collections
    await Promise.all([
      User.deleteMany({}),
      Movie.deleteMany({}),
      Theatre.deleteMany({}),
      Screen.deleteMany({}),
      Show.deleteMany({}),
      Booking.deleteMany({}),
      SeatHold.deleteMany({}),
    ]);

    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Alice Customer',
      email: 'alice@example.com',
      password: 'Password123!',
    });
    userAToken = resA.body.data.token;
    userAId = resA.body.data.user.id || resA.body.data.user._id;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      name: 'Bob Competitor',
      email: 'bob@example.com',
      password: 'Password123!',
    });
    userBToken = resB.body.data.token;
    userBId = resB.body.data.user.id || resB.body.data.user._id;

    // Create Admin directly
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@imovies.com',
      password: 'AdminPassword123!',
      role: 'admin',
    });
    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@imovies.com',
      password: 'AdminPassword123!',
    });
    adminToken = adminLoginRes.body.data.token;

    // Create Movie, Theatre, Screen with capacity for rows A-J
    testMovie = await Movie.create({
      title: 'Interstellar Cinema',
      description: 'Mankind was born on Earth, it was never meant to die here.',
      duration: 169,
      genres: ['Sci-Fi', 'Adventure'],
      language: 'English',
      releaseDate: new Date('2026-11-01'),
      rating: 'PG-13',
    });

    testTheatre = await Theatre.create({
      name: 'Omni Theatre',
      city: 'Metropolis',
      address: '100 Broadway St',
    });

    testScreen = await Screen.create({
      theatre: testTheatre._id,
      screenNumber: 1,
      name: 'IMAX Laser Hall',
      screenType: 'IMAX',
      seatingCapacity: 100,
    });

    // Create Show
    const startTime = new Date(Date.now() + 86400000); // 24 hours in the future
    const endTime = new Date(Date.now() + 86400000 + 10800000); // 3 hours later

    const showRes = await request(app)
      .post('/api/shows')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        movie: testMovie._id,
        theatre: testTheatre._id,
        screen: testScreen._id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        pricing: [
          { tier: 'standard', price: 15 },
          { tier: 'premium', price: 20 },
          { tier: 'vip', price: 25 },
        ],
      });

    testShow = showRes.body.data;
  });

  // ---------------------------------------------------------------------------
  // 1. Successful Seat Hold
  // ---------------------------------------------------------------------------
  test('User can successfully place a temporary hold on available seats', async () => {
    const res = await request(app)
      .post(`/api/shows/${testShow._id}/holds`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        seatNumbers: ['A1', 'A2'],
        durationSeconds: 300,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.holdToken);
    assert.equal(res.body.data.seats.length, 2);
    assert.ok(res.body.data.expiresInSeconds > 280);

    // Verify Show document updated to 'reserved' with holdToken
    const show = await Show.findById(testShow._id);
    const seatA1 = show.seats.find((s) => s.seatNumber === 'A1');
    assert.equal(seatA1.status, 'reserved');
    assert.equal(seatA1.reservedBy.toString(), userAId.toString());
    assert.equal(seatA1.holdToken, res.body.data.holdToken);
    assert.ok(new Date(seatA1.holdExpiresAt) > new Date());

    // Verify SeatHold document created
    const hold = await SeatHold.findOne({ holdToken: res.body.data.holdToken });
    assert.ok(hold);
    assert.equal(hold.status, 'active');
    assert.equal(hold.user.toString(), userAId.toString());
  });

  // ---------------------------------------------------------------------------
  // 2. Concurrency Safety: Two Users Racing for the Same Seat
  // ---------------------------------------------------------------------------
  test('Concurrency Safety: Simultaneous attempts to hold the same seat allow exactly one winner', async () => {
    const [res1, res2] = await Promise.all([
      request(app)
        .post(`/api/shows/${testShow._id}/holds`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ seatNumbers: ['B1'] }),
      request(app)
        .post(`/api/shows/${testShow._id}/holds`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ seatNumbers: ['B1'] }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    assert.deepEqual(statuses, [201, 409], 'Exactly one request succeeds (201) and one conflicts (409)');

    // Ensure seat B1 is cleanly held by the winner
    const show = await Show.findById(testShow._id);
    const seatB1 = show.seats.find((s) => s.seatNumber === 'B1');
    assert.equal(seatB1.status, 'reserved');
    assert.ok(seatB1.reservedBy);
  });

  // ---------------------------------------------------------------------------
  // 3. Lazy Expiration & Re-Holding
  // ---------------------------------------------------------------------------
  test('Expired holds stop blocking seats even before background worker cleanup runs', async () => {
    // Hold seat C1 with a short duration of 5 seconds
    const holdRes = await request(app)
      .post(`/api/shows/${testShow._id}/holds`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        seatNumbers: ['C1'],
        durationSeconds: 5,
      });
    assert.equal(holdRes.status, 201);

    // Manually backdate hold expiration in database to simulate passage of time
    const pastDate = new Date(Date.now() - 10000); // 10 seconds in past
    await Show.updateOne(
      { _id: testShow._id, 'seats.seatNumber': 'C1' },
      { $set: { 'seats.$.holdExpiresAt': pastDate } }
    );
    await SeatHold.updateOne(
      { holdToken: holdRes.body.data.holdToken },
      { $set: { expiresAt: pastDate } }
    );

    // User B attempts to hold C1 immediately WITHOUT running background worker
    const userBHoldRes = await request(app)
      .post(`/api/shows/${testShow._id}/holds`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ seatNumbers: ['C1'] });

    assert.equal(userBHoldRes.status, 201, 'User B successfully held C1 because previous hold expired');
    assert.ok(userBHoldRes.body.data.holdToken);

    // Check show details endpoint lazy expiration
    const getShowRes = await request(app).get(`/api/shows/${testShow._id}`);
    assert.equal(getShowRes.status, 200);
    const seatC1 = getShowRes.body.data.seats.find((s) => s.seatNumber === 'C1');
    assert.equal(seatC1.status, 'reserved');
    assert.equal(seatC1.holdToken, userBHoldRes.body.data.holdToken);
  });

  // ---------------------------------------------------------------------------
  // 4. Background Expired-Hold Cleanup Worker
  // ---------------------------------------------------------------------------
  test('Background hold cleanup worker resets expired seats to available and marks hold expired', async () => {
    const holdRes = await request(app)
      .post(`/api/shows/${testShow._id}/holds`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ seatNumbers: ['D1'], durationSeconds: 5 });
    assert.equal(holdRes.status, 201);

    // Backdate expiration
    const pastDate = new Date(Date.now() - 5000);
    await Show.updateOne(
      { _id: testShow._id, 'seats.seatNumber': 'D1' },
      { $set: { 'seats.$.holdExpiresAt': pastDate } }
    );
    await SeatHold.updateOne(
      { holdToken: holdRes.body.data.holdToken },
      { $set: { expiresAt: pastDate } }
    );

    // Run cleanup
    const cleanedCount = await cleanupExpiredHoldsNow();
    assert.ok(cleanedCount >= 1);

    // Verify seat D1 is available again in Show document
    const show = await Show.findById(testShow._id);
    const seatD1 = show.seats.find((s) => s.seatNumber === 'D1');
    assert.equal(seatD1.status, 'available');
    assert.equal(seatD1.reservedBy, null);
    assert.equal(seatD1.holdToken, null);

    // Verify hold document status is 'expired'
    const hold = await SeatHold.findOne({ holdToken: holdRes.body.data.holdToken });
    assert.equal(hold.status, 'expired');
  });

  // ---------------------------------------------------------------------------
  // 5. Unauthorized Hold Release Protection
  // ---------------------------------------------------------------------------
  test('User B cannot release User A hold, but User A can release their own hold', async () => {
    const holdRes = await request(app)
      .post(`/api/shows/${testShow._id}/holds`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ seatNumbers: ['E1'] });
    assert.equal(holdRes.status, 201);
    const holdToken = holdRes.body.data.holdToken;

    // User B tries to release User A's hold -> 403 Forbidden
    const unauthRelease = await request(app)
      .delete(`/api/shows/${testShow._id}/holds/${holdToken}`)
      .set('Authorization', `Bearer ${userBToken}`);
    assert.equal(unauthRelease.status, 403);

    // User A releases their own hold -> 200 OK
    const authRelease = await request(app)
      .delete(`/api/shows/${testShow._id}/holds/${holdToken}`)
      .set('Authorization', `Bearer ${userAToken}`);
    assert.equal(authRelease.status, 200);

    // Verify seat is available again
    const show = await Show.findById(testShow._id);
    const seatE1 = show.seats.find((s) => s.seatNumber === 'E1');
    assert.equal(seatE1.status, 'available');
  });

  // ---------------------------------------------------------------------------
  // 6. Booking Confirmation with Hold
  // ---------------------------------------------------------------------------
  test('Hold owner successfully confirms booking with holdToken, other users cannot book held seats', async () => {
    const holdRes = await request(app)
      .post(`/api/shows/${testShow._id}/holds`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ seatNumbers: ['F1', 'F2'] });
    assert.equal(holdRes.status, 201);
    const holdToken = holdRes.body.data.holdToken;

    // User B attempts to book User A's held seats -> 403 Forbidden
    const bobBookingAttempt = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        showId: testShow._id,
        seatNumbers: ['F1'],
        holdToken: holdToken,
      });
    assert.equal(bobBookingAttempt.status, 403, 'User B rejected with 403 when using User A hold token');

    // User B attempts direct booking without hold token -> 409 Conflict
    const bobDirectAttempt = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        showId: testShow._id,
        seatNumbers: ['F1'],
      });
    assert.equal(bobDirectAttempt.status, 409, 'User B direct booking rejected because seat is held');

    // User A confirms booking using their hold token -> 201 Created
    const aliceBooking = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        showId: testShow._id,
        seatNumbers: ['F1', 'F2'],
        holdToken: holdToken,
      });
    assert.equal(aliceBooking.status, 201);
    assert.equal(aliceBooking.body.data.bookingStatus, 'confirmed');

    // Verify SeatHold is completed
    const holdDoc = await SeatHold.findOne({ holdToken });
    assert.equal(holdDoc.status, 'completed');

    // Verify seats are marked booked
    const show = await Show.findById(testShow._id);
    const seatF1 = show.seats.find((s) => s.seatNumber === 'F1');
    assert.equal(seatF1.status, 'booked');
  });

  // ---------------------------------------------------------------------------
  // 7. Hold Expiration During Checkout
  // ---------------------------------------------------------------------------
  test('Hold expiration during checkout prevents booking confirmation', async () => {
    const holdRes = await request(app)
      .post(`/api/shows/${testShow._id}/holds`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ seatNumbers: ['G1'], durationSeconds: 5 });
    assert.equal(holdRes.status, 201);
    const holdToken = holdRes.body.data.holdToken;

    // Backdate expiration
    const pastDate = new Date(Date.now() - 5000);
    await Show.updateOne(
      { _id: testShow._id, 'seats.seatNumber': 'G1' },
      { $set: { 'seats.$.holdExpiresAt': pastDate } }
    );
    await SeatHold.updateOne({ holdToken }, { $set: { expiresAt: pastDate } });

    // Attempt to book with expired hold -> 409 Conflict
    const expiredBooking = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        showId: testShow._id,
        seatNumbers: ['G1'],
        holdToken: holdToken,
      });

    assert.equal(expiredBooking.status, 409);
    assert.match(expiredBooking.body.message, /expired/i);
  });

  // ---------------------------------------------------------------------------
  // 8. Concurrent Booking and Cancellation
  // ---------------------------------------------------------------------------
  test('Booking cancellation cleanly releases seats and allows re-booking', async () => {
    // Create direct booking for H1
    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        showId: testShow._id,
        seatNumbers: ['H1'],
      });
    assert.equal(bookRes.status, 201);
    const bookingId = bookRes.body.data._id;

    // Cancel booking
    const cancelRes = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${userAToken}`);
    assert.equal(cancelRes.status, 200);

    // Seat H1 should now be available for User B to hold
    const holdRes = await request(app)
      .post(`/api/shows/${testShow._id}/holds`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ seatNumbers: ['H1'] });
    assert.equal(holdRes.status, 201);
  });

  // ---------------------------------------------------------------------------
  // 9. Real-Time Socket.IO Event Delivery
  // ---------------------------------------------------------------------------
  test('Real-time updates: Socket clients receive seat hold and release events', async () => {
    socketClient = ClientIO(`http://localhost:${testServerPort}`, {
      transports: ['websocket'],
      forceNew: true,
    });

    await new Promise((resolve) => socketClient.on('connect', resolve));
    assert.ok(socketClient.connected, 'Socket client connected');

    // Join show room
    socketClient.emit('join:show', testShow._id.toString());

    // Setup listener for seats:held
    const heldEventPromise = new Promise((resolve) => {
      socketClient.once('seats:held', (data) => {
        resolve(data);
      });
    });

    // Place a hold via REST API
    const holdRes = await request(app)
      .post(`/api/shows/${testShow._id}/holds`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ seatNumbers: ['I1'] });
    assert.equal(holdRes.status, 201);

    const heldEventData = await heldEventPromise;
    assert.equal(heldEventData.showId, testShow._id.toString());
    assert.deepEqual(heldEventData.seatNumbers, ['I1']);

    // Setup listener for seats:released
    const releasedEventPromise = new Promise((resolve) => {
      socketClient.once('seats:released', (data) => {
        resolve(data);
      });
    });

    // Release hold via REST API
    await request(app)
      .delete(`/api/shows/${testShow._id}/holds/${holdRes.body.data.holdToken}`)
      .set('Authorization', `Bearer ${userAToken}`);

    const releasedEventData = await releasedEventPromise;
    assert.equal(releasedEventData.showId, testShow._id.toString());
    assert.deepEqual(releasedEventData.seatNumbers, ['I1']);
  });

  // ---------------------------------------------------------------------------
  // 10. Socket Disconnection & Reconnection
  // ---------------------------------------------------------------------------
  test('Socket cleanly disconnects and reconnects', async () => {
    assert.ok(socketClient.connected);
    socketClient.disconnect();
    assert.equal(socketClient.connected, false);

    socketClient.connect();
    await new Promise((resolve) => socketClient.on('connect', resolve));
    assert.ok(socketClient.connected);
  });
});