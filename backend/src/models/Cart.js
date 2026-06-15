/**
 * Cart.js  —  Mongoose schema & model
 *
 * One cart document per user (upserted on every add/update).
 * Cart items snapshot the product price at the time of adding so
 * price changes don't silently alter the cart total.
 *
 * Fields
 * ──────
 *  user        ObjectId → User  (unique — one cart per user)
 *  items       Array of cart line items
 *    product   ObjectId → Product
 *    name      Snapshot of product name
 *    image     Snapshot of primary image URL
 *    price     Snapshot of price at time of adding
 *    quantity  Number ≥ 1
 *  updatedAt   Auto-managed by { timestamps: true }
 *
 * Virtuals
 * ────────
 *  totalItems   — sum of all item quantities
 *  totalPrice   — sum of (price × quantity) for all items
 */

const mongoose = require('mongoose');

// ── Cart item sub-schema ──────────────────────────────────────────────────────
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Product',
      required: true,
    },
    // Snapshot fields — stored so the cart total is stable even if the
    // product is later updated or deleted
    name: {
      type:     String,
      required: true,
      trim:     true,
    },
    image: {
      type:    String,
      default: '',
    },
    price: {
      type:     Number,
      required: true,
      min:      [0, 'Price cannot be negative'],
    },
    quantity: {
      type:     Number,
      required: true,
      min:      [1, 'Quantity must be at least 1'],
      default:  1,
    },
  },
  { _id: false }  // no separate _id per line item
);

// ── Cart schema ───────────────────────────────────────────────────────────────
const cartSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,   // one cart per user
    },
    items: {
      type:    [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
cartSchema.index({ user: 1 });

// ── Virtuals ──────────────────────────────────────────────────────────────────
cartSchema.virtual('totalItems').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

cartSchema.virtual('totalPrice').get(function () {
  return Math.round(
    this.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100
  ) / 100;
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
