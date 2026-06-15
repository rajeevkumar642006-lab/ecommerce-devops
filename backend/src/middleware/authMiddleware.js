/**
 * authMiddleware.js
 *
 * protect        – verifies the JWT and attaches req.user.
 *                  Also checks whether the password was changed after
 *                  the token was issued (invalidates stale tokens).
 *
 * optionalProtect – same as protect but does NOT reject unauthenticated
 *                   requests; useful for routes that behave differently
 *                   for guests vs logged-in users (e.g. product listing).
 *
 * Usage:
 *   router.get('/profile',  protect,         userController.getProfile);
 *   router.get('/products', optionalProtect,  productController.getProducts);
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/env');
const { unauthorized } = require('../utils/apiResponse');

// ── Helper: extract and verify token ─────────────────────────────────────────
const verifyToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, JWT_SECRET); // throws on invalid / expired
};

// ── protect ───────────────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    const decoded = verifyToken(req.headers.authorization);

    if (!decoded) {
      return unauthorized(res, 'No token provided');
    }

    // Fetch the user so we can check isActive and passwordChangedAt.
    // We select only the fields we need to keep the query lean.
    const user = await User.findById(decoded.id)
      .select('+passwordChangedAt')
      .lean();

    if (!user) {
      return unauthorized(res, 'User no longer exists');
    }

    if (!user.isActive) {
      return unauthorized(res, 'Account has been deactivated');
    }

    // Reject tokens issued before the last password change
    if (user.passwordChangedAt) {
      const changedAt = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);
      if (decoded.iat < changedAt) {
        return unauthorized(res, 'Password was recently changed. Please log in again.');
      }
    }

    // Attach a clean user object (no sensitive fields) to the request
    req.user = {
      id:    user._id.toString(),
      name:  user.name,
      email: user.email,
      role:  user.role,
    };

    next();
  } catch (err) {
    // jwt.verify throws JsonWebTokenError / TokenExpiredError —
    // globalErrorHandler formats those into proper 401 responses
    next(err);
  }
};

// ── optionalProtect ───────────────────────────────────────────────────────────
const optionalProtect = async (req, _res, next) => {
  try {
    const decoded = verifyToken(req.headers.authorization);
    if (!decoded) return next(); // guest — continue without req.user

    const user = await User.findById(decoded.id).lean();
    if (user && user.isActive) {
      req.user = {
        id:    user._id.toString(),
        name:  user.name,
        email: user.email,
        role:  user.role,
      };
    }
  } catch {
    // Invalid token on an optional route — treat as guest, don't error
  }
  next();
};

module.exports = { protect, optionalProtect };
