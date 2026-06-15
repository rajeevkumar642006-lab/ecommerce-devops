/**
 * userRoutes.js
 * Base path: /api/users
 */

const express = require('express');
const router  = express.Router();

const { protect }                  = require('../middleware/authMiddleware');
const { adminOnly }                = require('../middleware/adminMiddleware');
const { validateUpdateProfile }    = require('../validators/authValidator');
const userController               = require('../controllers/userController');

// ── Own profile ───────────────────────────────────────────────────────────────
router.get('/profile',  protect,                              userController.getProfile);
router.put('/profile',  protect, validateUpdateProfile,       userController.updateProfile);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/',         protect, adminOnly,                   userController.getAllUsers);
router.delete('/:id',   protect, adminOnly,                   userController.deleteUser);

module.exports = router;
