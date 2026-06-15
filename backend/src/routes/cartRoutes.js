/**
 * cartRoutes.js
 * Base path: /api/cart
 *
 * All routes require authentication.
 *
 * GET    /api/cart                  — view cart
 * POST   /api/cart                  — add item
 * PUT    /api/cart/:productId        — update item quantity
 * DELETE /api/cart/:productId        — remove item
 * DELETE /api/cart                  — clear cart
 */

const express = require('express');
const router  = express.Router();

const { protect }      = require('../middleware/authMiddleware');
const cartController   = require('../controllers/cartController');

router.use(protect); // all cart routes require login

router.get('/',                 cartController.getCart);
router.post('/',                cartController.addToCart);
router.put('/:productId',       cartController.updateCartItem);
router.delete('/:productId',    cartController.removeFromCart);
router.delete('/',              cartController.clearCart);

module.exports = router;
