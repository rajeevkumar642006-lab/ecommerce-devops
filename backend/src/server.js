/**
 * server.js
 *
 * Entry point for the Node.js process.
 * Responsibilities:
 *   1. Connect to MongoDB
 *   2. Start the HTTP server
 *   3. Handle unhandled rejections / uncaught exceptions gracefully
 *      so the process exits cleanly and the container restarts.
 *
 * This file intentionally contains NO business logic — that lives in
 * app.js, routes, controllers, and services.
 */

const app        = require('./app');
const connectDB  = require('./config/db');
const { PORT }   = require('./config/env');
const logger     = require('./utils/logger');

// ── Graceful shutdown helper ──────────────────────────────────────────────────
const shutdown = (server, signal) => {
  logger.warn(`${signal} received — shutting down gracefully`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force exit if server hasn't closed within 10 s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
};

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const start = async () => {
  // 1. Connect to MongoDB first; connectDB() exits the process on failure
  await connectDB();

  // 2. Start HTTP server
  const server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });

  // 3. Handle OS termination signals (Docker stop, Kubernetes pod eviction, etc.)
  process.on('SIGTERM', () => shutdown(server, 'SIGTERM'));
  process.on('SIGINT',  () => shutdown(server, 'SIGINT'));

  // 4. Catch unhandled promise rejections (e.g. a forgotten await)
  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`);
    shutdown(server, 'unhandledRejection');
  });

  // 5. Catch synchronous exceptions that escaped all try/catch blocks
  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
    shutdown(server, 'uncaughtException');
  });
};

start();
