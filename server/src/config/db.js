import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(customUri = null) {
  // In test environment, default to isolated test database unless explicitly overridden
  const defaultUri = env.NODE_ENV === 'test' ? env.MONGODB_TEST_URI : env.MONGODB_URI;
  const uri = customUri || defaultUri;

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    if (env.NODE_ENV !== 'test') {
      console.log(`[Database] MongoDB connected successfully to "${conn.connection.name}"`);
    }
    return conn;
  } catch (err) {
    if (env.NODE_ENV !== 'test') {
      console.error(`[Database] Connection error: ${err.message}`);
    }
    throw err;
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    if (env.NODE_ENV !== 'test') {
      console.log('[Database] MongoDB disconnected cleanly');
    }
  }
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

export default { connectDB, disconnectDB, isDatabaseConnected };