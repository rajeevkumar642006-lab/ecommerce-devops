/**
 * adminMiddleware.js
 *
 * adminOnly  – must be used AFTER protect.
 *              Allows only users with role === 'admin'.
 *
 * authorizeRoles(...roles)
 *            – factory that returns a middleware accepting any of the
 *              given roles.  More flexible than adminOnly for future
 *              role expansion (e.g. 'manager', 'support').
 *
 * Usage:
 *   router.delete('/:id', protect, adminOnly, productController.deleteProduct);
 *   router.get('/reports', protect, authorizeRoles('admin','manager'), ctrl.fn);
 */

const { forbidden } = require('../utils/apiResponse');

// ── adminOnly ─────────────────────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return forbidden(res, 'Admin access required');
};

// ── authorizeRoles ────────────────────────────────────────────────────────────
const authorizeRoles = (...roles) => (req, res, next) => {
  if (roles.includes(req.user?.role)) return next();
  return forbidden(res, `Access restricted to: ${roles.join(', ')}`);
};

module.exports = { adminOnly, authorizeRoles };
