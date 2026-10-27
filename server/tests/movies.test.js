import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Movie } from '../src/models/movie.model.js';
import { User } from '../src/models/user.model.js';
import { generateToken } from '../src/services/token.service.js';

describe('Movie Catalog API Suite', () => {
  let adminToken;
  let userToken;
  let adminUser;
  let normalUser;

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
    await Movie.deleteMany({});
    await User.deleteMany({});

    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@imovies.com',
      password: 'AdminPassword123!',
      role: 'admin',
    });
    adminToken = generateToken({ id: adminUser._id, role: 'admin' });

    normalUser = await User.create({
      name: 'Regular Customer',
      email: 'customer@imovies.com',
      password: 'CustomerPassword123!',
      role: 'user',
    });
    userToken = generateToken({ id: normalUser._id, role: 'user' });
  });

  test('GET /api/movies returns empty array when no movies exist', async () => {
    const res = await request(app).get('/api/movies');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.deepEqual(res.body.data, []);
    assert.equal(res.body.pagination.total, 0);
  });

  test('POST /api/movies creates a new movie with admin authentication', async () => {
    const payload = {
      title: 'Inception',
      description: 'A thief who steals corporate secrets through dream-sharing technology.',
      duration: 148,
      genres: ['Sci-Fi', 'Action'],
      language: 'English',
      releaseDate: '2010-07-16',
      rating: 'PG-13',
      posterUrl: 'https://example.com/inception.jpg',
    };

    const res = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.title, 'Inception');
    assert.equal(res.body.data.duration, 148);
    assert.equal(res.body.data.isActive, true);
  });

  test('POST /api/movies rejects unauthenticated or non-admin requests', async () => {
    const payload = {
      title: 'Unauthorized Movie',
      description: 'Should not be created',
      duration: 120,
      genres: ['Action'],
      language: 'English',
      releaseDate: '2026-01-01',
    };

    // Unauthenticated
    const resUnauth = await request(app).post('/api/movies').send(payload);
    assert.equal(resUnauth.status, 401);

    // Regular user (forbidden)
    const resForbidden = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);
    assert.equal(resForbidden.status, 403);
  });

  test('POST /api/movies validates required payload properties', async () => {
    const invalidPayload = {
      title: '', // Empty
      duration: -10, // Invalid duration
      genres: [], // Empty array
    };

    const res = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidPayload);

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.errors.length >= 3);
  });

  test('GET /api/movies supports search, genre filter, and pagination', async () => {
    await Movie.create([
      {
        title: 'Interstellar',
        description: 'Explorers travel through a wormhole in space.',
        duration: 169,
        genres: ['Sci-Fi', 'Adventure'],
        language: 'English',
        releaseDate: new Date('2014-11-07'),
        rating: 'PG-13',
      },
      {
        title: 'The Dark Knight',
        description: 'Batman raises the stakes in his war on crime.',
        duration: 152,
        genres: ['Action', 'Crime'],
        language: 'English',
        releaseDate: new Date('2008-07-18'),
        rating: 'PG-13',
      },
      {
        title: 'Spirited Away',
        description: 'A young girl wanders into a world ruled by spirits.',
        duration: 125,
        genres: ['Animation', 'Adventure'],
        language: 'Japanese',
        releaseDate: new Date('2001-07-20'),
        rating: 'PG',
      },
    ]);

    // 1. Search by title
    const searchRes = await request(app).get('/api/movies?q=dark');
    assert.equal(searchRes.status, 200);
    assert.equal(searchRes.body.data.length, 1);
    assert.equal(searchRes.body.data[0].title, 'The Dark Knight');

    // 2. Filter by genre
    const genreRes = await request(app).get('/api/movies?genre=Sci-Fi');
    assert.equal(genreRes.status, 200);
    assert.equal(genreRes.body.data.length, 1);
    assert.equal(genreRes.body.data[0].title, 'Interstellar');

    // 3. Filter by rating
    const ratingRes = await request(app).get('/api/movies?rating=PG');
    assert.equal(ratingRes.status, 200);
    assert.equal(ratingRes.body.data.length, 1);
    assert.equal(ratingRes.body.data[0].title, 'Spirited Away');

    // 4. Pagination
    const pageRes = await request(app).get('/api/movies?limit=2&page=1');
    assert.equal(pageRes.status, 200);
    assert.equal(pageRes.body.data.length, 2);
    assert.equal(pageRes.body.pagination.total, 3);
    assert.equal(pageRes.body.pagination.totalPages, 2);
  });

  test('GET /api/movies/:id retrieves movie details and handles invalid IDs', async () => {
    const movie = await Movie.create({
      title: 'Oppenheimer',
      description: 'The story of J. Robert Oppenheimer.',
      duration: 180,
      genres: ['Biography', 'Drama', 'History'],
      language: 'English',
      releaseDate: new Date('2023-07-21'),
      rating: 'R',
    });

    // Valid ID
    const res = await request(app).get(`/api/movies/${movie._id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.title, 'Oppenheimer');

    // Invalid ObjectId format
    const badIdRes = await request(app).get('/api/movies/not-a-valid-id');
    assert.equal(badIdRes.status, 400);

    // Non-existent valid ObjectId
    const fakeId = new mongoose.Types.ObjectId();
    const notFoundRes = await request(app).get(`/api/movies/${fakeId}`);
    assert.equal(notFoundRes.status, 404);
  });

  test('PUT /api/movies/:id and DELETE /api/movies/:id manage movie lifecycle', async () => {
    const movie = await Movie.create({
      title: 'Initial Title',
      description: 'Test description',
      duration: 100,
      genres: ['Comedy'],
      language: 'English',
      releaseDate: new Date('2025-01-01'),
    });

    // Admin updates movie
    const updateRes = await request(app)
      .put(`/api/movies/${movie._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Updated Movie Title', duration: 110 });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.title, 'Updated Movie Title');
    assert.equal(updateRes.body.data.duration, 110);

    // Admin deactivates movie
    const deleteRes = await request(app)
      .delete(`/api/movies/${movie._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(deleteRes.status, 200);
    assert.equal(deleteRes.body.data.isActive, false);

    // Public list excludes inactive movie
    const listRes = await request(app).get('/api/movies');
    assert.equal(listRes.body.data.length, 0);
  });
});