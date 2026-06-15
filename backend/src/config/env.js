/**
 * env.js
 *
 * Loads .env into process.env via dotenv and validates that every
 * required variable is present before the app starts.  Centralising
 * this here means the rest of the codebase can import named constants
 * instead of scattering process.env lookups everywhere.
 */

const dotenv = require('dotenv');

// Load .env file (no-op in production if variables are injected by the
// container / CI environment)
dotenv.config();

// ── Required variables ────────────────────────────────────────────────────────
const REQUIRED = ['MONGO_URI', 'JWT_SECRET'];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`[env] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5001,

  MONGO_URI: process.env.MONGO_URI,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 min
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,

  // CORS
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};
