/**
 * userController.js
 *
 * GET    /api/users/profile      – get own profile  (protect)
 * PUT    /api/users/profile      – update own profile (protect + validateUpdateProfile)
 * GET    /api/users              – list all users    (protect + adminOnly)
 * DELETE /api/users/:id          – deactivate user   (protect + adminOnly)
 */

const User = require('../models/User');
const { ok, notFound, badRequest, conflict } = require('../utils/apiResponse');
const { validateUpdateProfile } = require('../validators/authValidator');
const logger = require('../utils/logger');

// ── GET /api/users/profile ────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return notFound(res, 'User not found');
  return ok(res, 'Profile fetched', { user });
};

// ── PUT /api/users/profile ────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  const { name, email, address } = req.body;

  // If email is being changed, check it isn't already taken
  if (email) {
    const existing = await User.findOne({ email, _id: { $ne: req.user.id } });
    if (existing) return conflict(res, 'Email is already in use');
  }

  const updated = await User.findByIdAndUpdate(
    req.user.id,
    { ...(name    && { name }),
      ...(email   && { email }),
      ...(address && { address }) },
    { new: true, runValidators: true }
  );

  if (!updated) return notFound(res, 'User not found');

  logger.info(`Profile updated: ${updated.email} (${updated._id})`);
  return ok(res, 'Profile updated successfully', { user: updated });
};

// ── GET /api/users  (admin) ───────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip  = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(),
  ]);

  return ok(res, 'Users fetched', { users }, {
    total, page, limit, pages: Math.ceil(total / limit),
  });
};

// ── DELETE /api/users/:id  (admin — soft delete) ──────────────────────────────
exports.deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return notFound(res, 'User not found');

  // Soft-delete: deactivate instead of removing the document
  user.isActive = false;
  await user.save();

  logger.info(`User deactivated by admin: ${user.email} (${user._id})`);
  return ok(res, 'User deactivated successfully');
};
