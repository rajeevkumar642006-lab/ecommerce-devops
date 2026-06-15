/**
 * app.js
 *
 * Creates and configures the Express application.
 * Kept separate from server.js so the app instance can be imported
 * by integration tests without binding to a port.
 *
 * Middleware order matters:
 *   1. Security / CORS
 *   2. Body parsers
 *   3. Request logging
 *   4. Rate limiting
 *   5. Routes
 *   6. 404 handler
 *   7. Global error handler  ← must be last
 */

// Patch async route handlers to forward errors to Express error middleware
// (must be required before any route is registered)
require('express-async-errors');

const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const { NODE_ENV, CLIENT_ORIGIN } = require('./config/env');
const { apiLimiter }              = require('./middleware/rateLimitMiddleware');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorMiddleware');
const logger = require('./utils/logger');

// ── Route modules ─────────────────────────────────────────────────────────────
const authRoutes    = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes    = require('./routes/cartRoutes');
const orderRoutes   = require('./routes/orderRoutes');
const userRoutes    = require('./routes/userRoutes');

// ── App instance ──────────────────────────────────────────────────────────────
const app = express();

// Trust reverse proxy (Nginx) headers for accurate rate limiting and IP detection
app.set('trust proxy', 1);

// ── 1. CORS ───────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ── 2. Body parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));          // parse JSON bodies
app.use(express.urlencoded({ extended: true }));   // parse form bodies

// ── 3. HTTP request logging ───────────────────────────────────────────────────
// Use 'combined' in production for full Apache-style logs; 'dev' locally
const morganFormat = NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: { write: (msg) => logger.http(msg.trim()) },
    // Skip logging health-check pings to reduce noise
    skip: (req) => req.url === '/api/health',
  })
);

// ── 4. Global rate limiter ────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── 5. Health check (no auth, no rate limit) ──────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

// ── 6. Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/users',    userRoutes);

// ── 7. 404 handler ────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── 8. Global error handler ───────────────────────────────────────────────────
app.use(globalErrorHandler);

module.exports = app;
