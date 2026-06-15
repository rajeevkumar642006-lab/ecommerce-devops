/**
 * logger.js
 *
 * Centralised Winston logger.
 * - In development: colourised, human-readable output to the console.
 * - In production : structured JSON to stdout so log aggregators
 *   (CloudWatch, Datadog, ELK) can parse it without extra config.
 *
 * Usage anywhere in the app:
 *   const logger = require('../utils/logger');
 *   logger.info('Server started');
 *   logger.error('Something broke', { err });
 */

const { createLogger, format, transports } = require('winston');
const { NODE_ENV } = require('../config/env');

const { combine, timestamp, printf, colorize, errors, json } = format;

// ── Development format ────────────────────────────────────────────────────────
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) => {
    return stack
      ? `${ts} [${level}]: ${message}\n${stack}`
      : `${ts} [${level}]: ${message}`;
  })
);

// ── Production format (JSON) ──────────────────────────────────────────────────
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = createLogger({
  level: NODE_ENV === 'production' ? 'warn' : 'debug',
  format: NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    new transports.Console(),
  ],
  // Don't crash the process on unhandled logger errors
  exitOnError: false,
});

module.exports = logger;
