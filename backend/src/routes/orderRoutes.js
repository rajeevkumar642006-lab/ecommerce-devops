/**
 * orderRoutes.js
 * Base path: /api/orders
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  Method  │  Path              │  Auth        │  Handler                  │
 * ├──────────────────────────────────────────────────────────────────────────┤
 * │  POST    │  /                 │  user        │  createOrder              │
 * │  GET     │  /my-orders        │  user        │  getMyOrders              │
 * │  GET     │  /:id              │  user/admin  │  getOrderById             │
 * │  PUT     │  /:id/pay          │  user/admin  │  markAsPaid               │
 * │  GET     │  /                 │  admin       │  getAllOrders              │
 * │  PUT     │  /:id/status       │  admin       │  updateOrderStatus        │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * NOTE: /my-orders must be declared before /:id to avoid Express treating
 * "my-orders" as a MongoDB ObjectId.
 */

const express = require('express');
const router  = express.Router();

const { protect }   = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const orderController = require('../controllers/orderController');

// ── User routes ───────────────────────────────────────────────────────────────
router.post('/',            protect,              orderController.createOrder);
router.get('/my-orders',    protect,              orderController.getMyOrders);
router.get('/:id',          protect,              orderController.getOrderById);
router.put('/:id/pay',      protect,              orderController.markAsPaid);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/',             protect, adminOnly,   orderController.getAllOrders);
router.put('/:id/status',   protect, adminOnly,   orderController.updateOrderStatus);

module.exports = router;
