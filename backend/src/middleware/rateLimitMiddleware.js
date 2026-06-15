/**
 * rateLimitMiddleware.js
 *
 * Two rate limiters:
 *
 *  apiLimiter   – applied globally to all /api routes.
 *                 Prevents general abuse (100 req / 15 min by default,
 *                 configurable via env).
 *
 *  authLimiter  – stricter limit on auth endpoints (login / register)
 *                 to slow down brute-force attacks (20 req / 15 min).
 */

const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } = require('../config/env');
const { sendError } = require('../utils/apiResponse');

// Shared handler so the response matches our API envelope
const rateLimitHandler = (_req, res) => {
  sendError(res, 429, 'Too many requests, please try again later.');
};

const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

module.exports = { apiLimiter, authLimiter };
