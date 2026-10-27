import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { isDatabaseConnected } from '../config/db.js';

export function getHealth(req, res) {
  const connected = isDatabaseConnected();
  const statusCode = connected ? 200 : 503;

  return res.status(statusCode).json({
    status: connected ? 'ok' : 'degraded',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: {
      status: connected ? 'connected' : 'disconnected',
      name: connected ? (mongoose.connection.name || 'imovies') : null,
    },
  });
}