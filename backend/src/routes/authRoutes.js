/**
 * authRoutes.js
 * Base path: /api/auth
 *
 * Public routes  (no token required):
 *   POST   /api/auth/register
 *   POST   /api/auth/login
 *   POST   /api/auth/logout
 *
 * Protected routes (valid JWT required):
 *   GET    /api/auth/me
 *   PUT    /api/auth/change-password
 */

const express = require('express');
const router  = express.Router();

const { authLimiter }                          = require('../middleware/rateLimitMiddleware');
const { protect }                              = require('../middleware/authMiddleware');
const { validateRegister,
        validateLogin,
        validateChangePassword }               = require('../validators/authValidator');
const authController                           = require('../controllers/authController');

// Apply stricter rate limit to every auth endpoint
router.use(authLimiter);

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/register',        validateRegister,       authController.register);
router.post('/login',           validateLogin,          authController.login);
router.post('/logout',                                  authController.logout);

// ── Protected ─────────────────────────────────────────────────────────────────
router.get('/me',               protect,                authController.getMe);
router.put('/change-password',  protect, validateChangePassword, authController.changePassword);

module.exports = router;
