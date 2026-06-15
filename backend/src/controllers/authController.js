/**
 * authController.js
 *
 * Handles all authentication operations:
 *
 *  POST /api/auth/register       – create account
 *  POST /api/auth/login          – issue JWT
 *  POST /api/auth/logout         – client-side token invalidation hint
 *  GET  /api/auth/me             – return current user profile
 *  PUT  /api/auth/change-password – update password (requires old password)
 *
 * Design decisions
 * ────────────────
 * • Tokens are stateless JWTs — no server-side session store needed.
 * • We use a generic "Invalid credentials" message for both wrong email
 *   AND wrong password to prevent user enumeration attacks.
 * • bcrypt.compare is always called even when the user is not found
 *   (dummy hash) to prevent timing-based user enumeration.
 * • The password field is stripped from every response via the User
 *   model's toJSON transform — this controller never manually deletes it.
 */

const User          = require('../models/User');
const bcrypt        = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const { created, ok, unauthorized, conflict, notFound } = require('../utils/apiResponse');
const logger        = require('../utils/logger');

// Dummy hash used to prevent timing attacks when a user is not found.
// bcrypt.compare will always return false against this, but it takes
// the same amount of time as a real comparison.
const DUMMY_HASH = '$2a$12$dummyhashusedtopreventtimingattacksonloginfailures00000';

// ── Helper: build the token response payload ──────────────────────────────────
const tokenResponse = (user) => ({
  token: generateToken(user),
  user: {
    id:        user._id,
    name:      user.name,
    email:     user.email,
    role:      user.role,
    address:   user.address,
    createdAt: user.createdAt,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Register a new user account.
 *
 * Body: { name, email, password, confirmPassword }
 *
 * Steps:
 *  1. Check for duplicate email
 *  2. Create user (pre-save hook hashes the password)
 *  3. Return JWT + user object
 */
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  // 1. Duplicate email check
  const existing = await User.findByEmail(email);
  if (existing) {
    return conflict(res, 'An account with this email already exists');
  }

  // 2. Create — password is hashed by the pre-save hook in User.js
  const user = await User.create({ name, email, password });

  logger.info(`New user registered: ${user.email} (${user._id})`);

  // 3. Respond with 201 + token
  return created(res, 'Account created successfully', tokenResponse(user));
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Authenticate a user and issue a JWT.
 *
 * Body: { email, password }
 *
 * Steps:
 *  1. Find user by email (select password back in)
 *  2. Compare password — always run bcrypt to prevent timing attacks
 *  3. Check account is active
 *  4. Return JWT + user object
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  logger.info(`Login attempt received for email: ${email}`);

  // 1. Find user — explicitly select password (it has select:false on schema)
  const user = await User.findByEmail(email).select('+password');

  if (!user) {
    logger.warn(`Login failed: No user found in database with email: ${email}`);
    // Still run a dummy bcrypt compare to prevent timing attacks
    await bcrypt.compare(password, DUMMY_HASH);
    return unauthorized(res, 'Invalid email or password');
  }

  logger.info(`User found: ${user.email} (ID: ${user._id}, Role: ${user.role}, Active: ${user.isActive})`);

  // 2. Compare password
  const isMatch = await user.matchPassword(password);
  logger.info(`Password verification for ${email}: ${isMatch ? 'SUCCESS' : 'FAILED'}`);

  if (!isMatch) {
    logger.warn(`Login failed: Password mismatch for email: ${email}`);
    return unauthorized(res, 'Invalid email or password');
  }

  // 3. Account status check
  if (!user.isActive) {
    logger.warn(`Login failed: User account is deactivated for email: ${email}`);
    return unauthorized(res, 'Your account has been deactivated. Please contact support.');
  }

  logger.info(`User successfully authenticated and logged in: ${user.email} (${user._id})`);

  // 4. Respond with token
  return ok(res, 'Login successful', tokenResponse(user));
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Logout hint for the client.
 *
 * JWTs are stateless — the server cannot truly invalidate them without a
 * token blacklist (Redis, DB).  We return a success response so the client
 * knows to delete the token from storage.
 *
 * For a production system that needs immediate revocation, add a Redis
 * blacklist and check it inside the protect middleware.
 */
exports.logout = async (_req, res) => {
  return ok(res, 'Logged out successfully');
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Return the currently authenticated user's profile.
 * Requires: protect middleware (req.user is populated).
 */
exports.getMe = async (req, res) => {
  // req.user.id is set by protect middleware
  const user = await User.findById(req.user.id);

  if (!user) {
    return notFound(res, 'User not found');
  }

  return ok(res, 'Profile fetched successfully', { user });
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/change-password
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Change the authenticated user's password.
 *
 * Body: { currentPassword, newPassword }
 *
 * Steps:
 *  1. Fetch user with password
 *  2. Verify current password
 *  3. Set new password (pre-save hook re-hashes + updates passwordChangedAt)
 *  4. Issue a fresh token so the client doesn't get logged out
 */
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // 1. Fetch with password
  const user = await User.findById(req.user.id).select('+password');
  if (!user) return notFound(res, 'User not found');

  // 2. Verify current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return unauthorized(res, 'Current password is incorrect');
  }

  // 3. Update — pre-save hook handles hashing and passwordChangedAt
  user.password = newPassword;
  await user.save();

  logger.info(`Password changed for user: ${user.email} (${user._id})`);

  // 4. Issue fresh token
  return ok(res, 'Password changed successfully', tokenResponse(user));
};
