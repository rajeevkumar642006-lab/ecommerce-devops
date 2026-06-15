/**
 * cartController.js
 *
 * GET    /api/cart              getCart       — view current cart
 * POST   /api/cart              addToCart     — add item or increment qty
 * PUT    /api/cart/:productId   updateCartItem — set exact quantity
 * DELETE /api/cart/:productId   removeFromCart — remove one line item
 * DELETE /api/cart              clearCart     — empty the entire cart
 *
 * All routes require authentication (protect middleware).
 *
 * Design notes
 * ────────────
 * • We use findOneAndUpdate with upsert:true so the first add creates
 *   the cart document atomically — no separate "create cart" step needed.
 * • Product price is snapshotted at add-time so cart totals are stable.
 * • Stock is validated on add/update but NOT reserved — reservation
 *   happens at checkout (order creation).
 */

const Cart    = require('../models/Cart');
const Product = require('../models/Product');
const { ok, notFound, badRequest } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// ── Helper: get or create cart for the current user ───────────────────────────
const getOrCreateCart = (userId) =>
  Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { upsert: true, new: true }
  );

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/cart
// ─────────────────────────────────────────────────────────────────────────────
exports.getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id })
    .populate('items.product', 'name images stock isActive');

  if (!cart || cart.items.length === 0) {
    return ok(res, 'Cart is empty', {
      cart: { items: [], totalItems: 0, totalPrice: 0 },
    });
  }

  return ok(res, 'Cart fetched successfully', { cart });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cart
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Add a product to the cart.
 * If the product is already in the cart, increment its quantity.
 *
 * Body: { productId, quantity }  (quantity defaults to 1)
 */
exports.addToCart = async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const qty = parseInt(quantity, 10);

  if (!productId) return badRequest(res, 'productId is required');
  if (qty < 1)    return badRequest(res, 'Quantity must be at least 1');

  // Validate product exists and has enough stock
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) return notFound(res, 'Product not found');
  if (product.stock < qty) {
    return badRequest(res, `Only ${product.stock} unit(s) available in stock`);
  }

  const cart = await getOrCreateCart(req.user.id);

  // Check if product already in cart
  const existingIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (existingIndex >= 0) {
    // Increment quantity — but cap at available stock
    const newQty = cart.items[existingIndex].quantity + qty;
    if (newQty > product.stock) {
      return badRequest(res, `Cannot add more — only ${product.stock} unit(s) available`);
    }
    cart.items[existingIndex].quantity = newQty;
  } else {
    // Add new line item with price snapshot
    const primaryImage = product.images.find((img) => img.isPrimary)?.url
      || product.images[0]?.url
      || '';

    cart.items.push({
      product:  product._id,
      name:     product.name,
      image:    primaryImage,
      price:    product.price,
      quantity: qty,
    });
  }

  await cart.save();

  logger.info(`Cart updated for user ${req.user.id}: added product ${productId} x${qty}`);

  return ok(res, 'Item added to cart', { cart });
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/cart/:productId
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Set the exact quantity for a cart item.
 * Passing quantity = 0 removes the item.
 *
 * Body: { quantity }
 */
exports.updateCartItem = async (req, res) => {
  const { productId } = req.params;
  const qty = parseInt(req.body.quantity, 10);

  if (isNaN(qty) || qty < 0) {
    return badRequest(res, 'Quantity must be a non-negative integer');
  }

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return notFound(res, 'Cart not found');

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );
  if (itemIndex === -1) return notFound(res, 'Item not found in cart');

  if (qty === 0) {
    // Remove the item
    cart.items.splice(itemIndex, 1);
  } else {
    // Validate stock
    const product = await Product.findById(productId).select('stock isActive');
    if (!product || !product.isActive) return notFound(res, 'Product not found');
    if (qty > product.stock) {
      return badRequest(res, `Only ${product.stock} unit(s) available in stock`);
    }
    cart.items[itemIndex].quantity = qty;
  }

  await cart.save();

  return ok(res, 'Cart updated', { cart });
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/cart/:productId
// ─────────────────────────────────────────────────────────────────────────────
exports.removeFromCart = async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return notFound(res, 'Cart not found');

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );
  if (itemIndex === -1) return notFound(res, 'Item not found in cart');

  cart.items.splice(itemIndex, 1);
  await cart.save();

  return ok(res, 'Item removed from cart', { cart });
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/cart
// ─────────────────────────────────────────────────────────────────────────────
exports.clearCart = async (req, res) => {
  await Cart.findOneAndUpdate(
    { user: req.user.id },
    { $set: { items: [] } }
  );

  return ok(res, 'Cart cleared', { cart: { items: [], totalItems: 0, totalPrice: 0 } });
};
