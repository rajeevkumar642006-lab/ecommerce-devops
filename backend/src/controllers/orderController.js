/**
 * orderController.js
 *
 * POST   /api/orders                  createOrder       — checkout from cart
 * GET    /api/orders/my-orders        getMyOrders       — user's order history
 * GET    /api/orders/:id              getOrderById      — single order detail
 * GET    /api/orders                  getAllOrders       — admin: all orders
 * PUT    /api/orders/:id/status       updateOrderStatus — admin: change status
 * PUT    /api/orders/:id/pay          markAsPaid        — mark order paid
 *
 * Design notes
 * ────────────
 * • createOrder reads from the user's cart, validates stock for every item,
 *   decrements stock atomically, creates the order, then clears the cart.
 * • All price fields are calculated server-side — never trusted from the client.
 * • Shipping is free above FREE_SHIPPING_THRESHOLD, otherwise SHIPPING_FEE.
 * • Tax is calculated as TAX_RATE % of itemsPrice.
 */

const Order   = require('../models/Order');
const Cart    = require('../models/Cart');
const Product = require('../models/Product');
const { created, ok, notFound, badRequest, forbidden } = require('../utils/apiResponse');
const logger  = require('../utils/logger');

// ── Business constants (move to env for production) ───────────────────────────
const TAX_RATE                = 0.18;   // 18 % GST
const SHIPPING_FEE            = 49;     // ₹49 flat
const FREE_SHIPPING_THRESHOLD = 499;    // free above ₹499

// ── Helper: round to 2 decimal places ────────────────────────────────────────
const round2 = (n) => Math.round(n * 100) / 100;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Create an order from the user's current cart.
 *
 * Body: { shippingAddress, paymentMethod }
 *
 * Steps:
 *  1. Load cart — error if empty
 *  2. Validate stock for every item (fail fast)
 *  3. Calculate prices server-side
 *  4. Create order document
 *  5. Decrement stock for each product (atomic $inc)
 *  6. Clear the cart
 */
exports.createOrder = async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  if (!shippingAddress) return badRequest(res, 'Shipping address is required');
  if (!paymentMethod)   return badRequest(res, 'Payment method is required');

  // 1. Load cart
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart || cart.items.length === 0) {
    return badRequest(res, 'Your cart is empty');
  }

  // 2. Validate stock for every item
  const productIds = cart.items.map((i) => i.product);
  const products   = await Product.find({ _id: { $in: productIds } }).select('name stock isActive price');
  const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

  const stockErrors = [];
  for (const item of cart.items) {
    const product = productMap[item.product.toString()];
    if (!product || !product.isActive) {
      stockErrors.push(`"${item.name}" is no longer available`);
    } else if (product.stock < item.quantity) {
      stockErrors.push(`"${item.name}": only ${product.stock} unit(s) left`);
    }
  }
  if (stockErrors.length > 0) {
    return badRequest(res, 'Some items are unavailable', stockErrors);
  }

  // 3. Calculate prices (always server-side)
  const itemsPrice    = round2(cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const shippingPrice = itemsPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const taxPrice      = round2(itemsPrice * TAX_RATE);
  const totalPrice    = round2(itemsPrice + shippingPrice + taxPrice);

  // 4. Create order
  const order = await Order.create({
    user:    req.user.id,
    items:   cart.items.map((i) => ({
      product:  i.product,
      name:     i.name,
      image:    i.image,
      price:    i.price,
      quantity: i.quantity,
    })),
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  });

  // 5. Decrement stock atomically for each product
  await Promise.all(
    cart.items.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      })
    )
  );

  // 6. Clear cart
  await Cart.findOneAndUpdate({ user: req.user.id }, { $set: { items: [] } });

  logger.info(`Order created: ${order.orderNumber} by user ${req.user.id} — ₹${totalPrice}`);

  return created(res, 'Order placed successfully', { order });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/my-orders
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Return the authenticated user's order history, newest first.
 * Supports pagination via ?page and ?limit.
 */
exports.getMyOrders = async (req, res) => {
  const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const skip  = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v'),
    Order.countDocuments({ user: req.user.id }),
  ]);

  return ok(res, 'Orders fetched successfully', { orders }, {
    total, page, limit, pages: Math.ceil(total / limit),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/:id
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Return a single order.
 * Users can only view their own orders; admins can view any order.
 */
exports.getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .select('-__v');

  if (!order) return notFound(res, 'Order not found');

  // Non-admin users can only see their own orders
  if (req.user.role !== 'admin' && order.user._id.toString() !== req.user.id) {
    return forbidden(res, 'Not authorised to view this order');
  }

  return ok(res, 'Order fetched successfully', { order });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders  (admin)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Admin: paginated list of all orders with optional status filter.
 * Query params: page, limit, status
 */
exports.getAllOrders = async (req, res) => {
  const page   = Math.max(parseInt(req.query.page,  10) || 1, 1);
  const limit  = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip   = (page - 1) * limit;
  const filter = req.query.status ? { status: req.query.status } : {};

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v'),
    Order.countDocuments(filter),
  ]);

  return ok(res, 'All orders fetched', { orders }, {
    total, page, limit, pages: Math.ceil(total / limit),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/orders/:id/status  (admin)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Admin: update order status.
 * Automatically sets deliveredAt when status → 'delivered'.
 * Restores product stock when status → 'cancelled'.
 *
 * Body: { status }
 */
exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const VALID = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!status || !VALID.includes(status)) {
    return badRequest(res, `Status must be one of: ${VALID.join(', ')}`);
  }

  const order = await Order.findById(req.params.id);
  if (!order) return notFound(res, 'Order not found');

  // Prevent re-cancelling or re-delivering
  if (order.status === status) {
    return badRequest(res, `Order is already ${status}`);
  }
  if (order.status === 'delivered' || order.status === 'cancelled') {
    return badRequest(res, `Cannot change status of a ${order.status} order`);
  }

  // Restore stock when cancelling
  if (status === 'cancelled') {
    await Promise.all(
      order.items.map((item) =>
        Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        })
      )
    );
  }

  order.status = status;
  if (status === 'delivered') order.deliveredAt = new Date();

  await order.save();

  logger.info(`Order ${order.orderNumber} status → ${status} by admin ${req.user.id}`);

  return ok(res, 'Order status updated', { order });
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/orders/:id/pay
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Mark an order as paid (called after payment gateway callback).
 *
 * Body: { id, status, updateTime, emailAddress }  (payment gateway result)
 */
exports.markAsPaid = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return notFound(res, 'Order not found');

  if (order.isPaid) return badRequest(res, 'Order is already marked as paid');

  // Only the order owner or an admin can mark it paid
  if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
    return forbidden(res, 'Not authorised');
  }

  order.isPaid         = true;
  order.paidAt         = new Date();
  order.paymentResult  = {
    id:           req.body.id,
    status:       req.body.status,
    updateTime:   req.body.updateTime,
    emailAddress: req.body.emailAddress,
  };
  // Auto-advance from pending → processing on payment
  if (order.status === 'pending') order.status = 'processing';

  await order.save();

  logger.info(`Order ${order.orderNumber} marked as paid`);

  return ok(res, 'Order marked as paid', { order });
};
