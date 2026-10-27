import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/user.model.js';
import { generateToken } from '../src/services/token.service.js';

describe('Authentication & Authorization Suite', () => {
  before(async () => {
    // Explicitly connect to isolated test database
    await connectDB(process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/imovies_test');
  });

  after(async () => {
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === 'imovies_test') {
      await mongoose.connection.dropDatabase();
    }
    await disconnectDB();
  });

  beforeEach(async () => {
    // Clean users collection before each test to guarantee test independence
    await User.deleteMany({});
  });

  test('POST /api/auth/register successfully registers a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'User registered successfully');
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, 'jane@example.com');
    assert.equal(res.body.data.user.name, 'Jane Doe');
    assert.equal(res.body.data.user.role, 'user');
    assert.equal(res.body.data.user.password, undefined); // Password never leaked
  });

  test('POST /api/auth/register rejects duplicate email registration', async () => {
    await User.create({
      name: 'Existing User',
      email: 'existing@example.com',
      password: 'SecurePassword123!',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another User',
        email: 'existing@example.com',
        password: 'Password123!',
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /already exists/i);
  });

  test('POST /api/auth/register validates required and invalid inputs', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'A', // too short
        email: 'not-an-email',
        password: 'short', // < 8 chars
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(Array.isArray(res.body.errors));
    assert.equal(res.body.errors.length, 3);
  });

  test('POST /api/auth/register prevents self-assigning admin role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hacker',
        email: 'hacker@example.com',
        password: 'Password123!',
        role: 'admin', // Malicious attempt to elevate role
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.user.role, 'user');

    const dbUser = await User.findById(res.body.data.user.id);
    assert.equal(dbUser.role, 'user');
  });

  test('Password hashing secures user password in database', async () => {
    const plainPassword = 'MySecretPassword123!';
    const user = await User.create({
      name: 'Hash Test',
      email: 'hash@example.com',
      password: plainPassword,
    });

    const rawUser = await User.findById(user._id).select('+password');
    assert.notEqual(rawUser.password, plainPassword);
    assert.match(rawUser.password, /^\$2[aby]\$\d+\$/); // bcrypt hash format

    const isMatch = await user.comparePassword(plainPassword);
    assert.equal(isMatch, true);

    const isWrongMatch = await user.comparePassword('WrongPassword123!');
    assert.equal(isWrongMatch, false);
  });

  test('POST /api/auth/login succeeds with valid credentials', async () => {
    await User.create({
      name: 'Login User',
      email: 'login@example.com',
      password: 'ValidPassword123!',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'ValidPassword123!',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, 'login@example.com');
    assert.equal(res.body.data.user.password, undefined);
  });

  test('POST /api/auth/login rejects incorrect password', async () => {
    await User.create({
      name: 'Login User',
      email: 'wrongpass@example.com',
      password: 'CorrectPassword123!',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrongpass@example.com',
        password: 'IncorrectPassword123!',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid email or password');
  });

  test('POST /api/auth/login rejects non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nobody@example.com',
        password: 'AnyPassword123!',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid email or password');
  });

  test('GET /api/auth/me returns current user profile with valid JWT', async () => {
    const user = await User.create({
      name: 'Profile User',
      email: 'profile@example.com',
      password: 'Password123!',
    });

    const token = generateToken({ id: user._id, role: user.role });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, 'profile@example.com');
    assert.equal(res.body.data.user.name, 'Profile User');
  });

  test('GET /api/auth/me rejects missing or invalid JWT', async () => {
    const noTokenRes = await request(app).get('/api/auth/me');
    assert.equal(noTokenRes.status, 401);

    const badTokenRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid_garbage_token');
    assert.equal(badTokenRes.status, 401);
  });

  test('Admin authorization restricts access to elevated endpoints', async () => {
    // 1. Regular user access -> 403 Forbidden
    const normalUser = await User.create({
      name: 'Normal User',
      email: 'normal@example.com',
      password: 'Password123!',
      role: 'user',
    });
    const normalToken = generateToken({ id: normalUser._id, role: normalUser.role });

    const forbiddenRes = await request(app)
      .get('/api/auth/admin-only')
      .set('Authorization', `Bearer ${normalToken}`);

    assert.equal(forbiddenRes.status, 403);
    assert.match(forbiddenRes.body.message, /forbidden/i);

    // 2. Admin user access -> 200 OK
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Password123!',
    });
    // Manually set role in database for admin seed
    adminUser.role = 'admin';
    await adminUser.save();

    const adminToken = generateToken({ id: adminUser._id, role: adminUser.role });

    const adminRes = await request(app)
      .get('/api/auth/admin-only')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(adminRes.status, 200);
    assert.equal(adminRes.body.success, true);
    assert.match(adminRes.body.message, /access granted/i);
  });
});