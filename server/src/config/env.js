import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export function validateEnv(customEnv = process.env) {
  const errors = [];

  const NODE_ENV = customEnv.NODE_ENV || 'development';
  if (!['development', 'production', 'test'].includes(NODE_ENV)) {
    errors.push(`Invalid NODE_ENV "${NODE_ENV}". Must be one of: development, production, test.`);
  }

  const rawPort = customEnv.PORT || '5000';
  const PORT = parseInt(rawPort, 10);
  if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
    errors.push(`Invalid PORT "${rawPort}". Must be a valid TCP port (1-65535).`);
  }

  const MONGODB_URI = customEnv.MONGODB_URI || 'mongodb://127.0.0.1:27017/imovies';
  if (!/^mongodb(\+srv)?:\/\//.test(MONGODB_URI)) {
    errors.push(`Invalid MONGODB_URI "${MONGODB_URI}". Must start with mongodb:// or mongodb+srv://`);
  }

  const MONGODB_TEST_URI = customEnv.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/imovies_test';
  if (!/^mongodb(\+srv)?:\/\//.test(MONGODB_TEST_URI)) {
    errors.push(`Invalid MONGODB_TEST_URI "${MONGODB_TEST_URI}". Must start with mongodb:// or mongodb+srv://`);
  }

  const CORS_ORIGIN = customEnv.CORS_ORIGIN || 'http://localhost:5173';

  const JWT_SECRET = customEnv.JWT_SECRET || 'imovies_development_super_secret_jwt_key_2026_secure';
  if (!JWT_SECRET || (NODE_ENV === 'production' && JWT_SECRET.length < 32)) {
    errors.push('JWT_SECRET must be at least 32 characters long in production.');
  }

  const JWT_EXPIRES_IN = customEnv.JWT_EXPIRES_IN || '7d';

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n - ${errors.join('\n - ')}`);
  }

  return Object.freeze({
    NODE_ENV,
    PORT,
    MONGODB_URI,
    MONGODB_TEST_URI,
    CORS_ORIGIN,
    JWT_SECRET,
    JWT_EXPIRES_IN,
  });
}

export const env = validateEnv();
export default env;