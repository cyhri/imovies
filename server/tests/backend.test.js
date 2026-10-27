import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { validateEnv } from '../src/config/env.js';

describe('1. Environment Configuration Validation', () => {
  test('should validate valid environment configuration', () => {
    const valid = validateEnv({
      PORT: '5001',
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/imovies_test',
      CORS_ORIGIN: 'http://localhost:5173',
    });
    assert.equal(valid.PORT, 5001);
    assert.equal(valid.NODE_ENV, 'test');
    assert.equal(valid.MONGODB_URI, 'mongodb://127.0.0.1:27017/imovies_test');
  });

  test('should throw an error for invalid PORT', () => {
    assert.throws(
      () => {
        validateEnv({
          PORT: 'not-a-port',
          NODE_ENV: 'test',
          MONGODB_URI: 'mongodb://127.0.0.1:27017/imovies',
        });
      },
      /Invalid PORT/
    );
  });

  test('should throw an error for invalid MONGODB_URI', () => {
    assert.throws(
      () => {
        validateEnv({
          PORT: '5000',
          NODE_ENV: 'test',
          MONGODB_URI: 'http://invalid-prefix:27017/imovies',
        });
      },
      /Invalid MONGODB_URI/
    );
  });

  test('should throw an error for invalid NODE_ENV', () => {
    assert.throws(
      () => {
        validateEnv({
          PORT: '5000',
          NODE_ENV: 'invalid_env',
          MONGODB_URI: 'mongodb://127.0.0.1:27017/imovies',
        });
      },
      /Invalid NODE_ENV/
    );
  });
});

describe('2. Error and 404 Routing', () => {
  test('GET /api/non-existent-route should return 404 with JSON response', async () => {
    const res = await request(app).get('/api/non-existent-route');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Cannot GET \/api\/non-existent-route/);
  });

  test('GET /unhandled-route should return 404 with JSON format', async () => {
    const res = await request(app).get('/some-root-missing-page');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});

describe('3. Database Connectivity and Health Endpoint', () => {
  before(async () => {
    // Ensure connected to local dev database before health check
    await connectDB(process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/imovies_test');
  });

  after(async () => {
    await disconnectDB();
  });

  test('GET /api/health returns 200 and connected status when MongoDB is connected', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.database.status, 'connected');
    assert.ok(res.body.database.name.startsWith('imovies'));
    assert.ok(typeof res.body.uptime === 'number');
    assert.ok(res.body.timestamp);
    // Ensure no sensitive URI/credentials are exposed
    assert.equal(res.body.database.uri, undefined);
    assert.equal(res.body.database.password, undefined);
  });

  test('GET /api/health returns 503 degraded status when MongoDB is disconnected', async () => {
    // Temporarily disconnect to test degraded health behavior
    await disconnectDB();

    const res = await request(app).get('/api/health');
    assert.equal(res.status, 503);
    assert.equal(res.body.status, 'degraded');
    assert.equal(res.body.database.status, 'disconnected');

    // Reconnect for subsequent tests
    await connectDB(process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/imovies_test');
  });
});