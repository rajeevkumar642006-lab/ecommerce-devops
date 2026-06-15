/**
 * errorMiddleware.js
 *
 * Two Express error-handling middlewares that must be registered LAST
 * in app.js (after all routes):
 *
 *  1. notFoundHandler  – catches requests that matched no route and
 *                        returns a 404 JSON response.
 *
 *  2. globalErrorHandler – catches every error thrown (or passed via
 *                          next(err)) anywhere in the app and returns
 *                          a consistent JSON error envelope.
 *
 * Using `express-async-errors` (required in app.js) means async route
 * handlers don't need try/catch — unhandled promise rejections are
 * automatically forwarded to globalErrorHandler.
 */

const logger = require('../utils/logger');
const { sendError } = require('../utils/apiResponse');

// ── 404 handler ───────────────────────────────────────────────────────────────
const notFoundHandler = (req, res, _next) => {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, _next) => {
  // Log the full error internally
  logger.error(`${err.message}`, { stack: err.stack, path: req.originalUrl });

  // ── Mongoose validation error ─────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, 400, 'Validation failed', errors);
  }

  // ── Mongoose duplicate key (e.g. unique email) ────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, 409, `${field} already exists`);
  }

  // ── Mongoose bad ObjectId ─────────────────────────────────────────────────
  if (err.name === 'CastError') {
    return sendError(res, 400, `Invalid value for field: ${err.path}`);
  }

  // ── JWT errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Token expired');
  }

  // ── Custom operational errors (thrown with a statusCode property) ─────────
  if (err.statusCode) {
    return sendError(res, err.statusCode, err.message);
  }

  // ── Fallback: 500 Internal Server Error ───────────────────────────────────
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  sendError(res, 500, message);
};

module.exports = { notFoundHandler, globalErrorHandler };
