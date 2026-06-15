/**
 * Order.js  —  Mongoose schema & model
 *
 * An order is a permanent record created from the user's cart at checkout.
 * Product details are snapshotted so the order history is accurate even
 * if products are later updated or deleted.
 *
 * Fields
 * ──────
 *  user            ObjectId → User
 *  orderNumber     Human-readable unique ID  (e.g. "ORD-20240527-A3F9")
 *  items           Snapshotted line items (product ref + name/price/qty)
 *  shippingAddress Delivery address at time of order
 *  paymentMethod   'cod' | 'card' | 'upi'
 *  paymentResult   Gateway response (id, status, email, update_time)
 *  itemsPrice      Sum of line items
 *  shippingPrice   Flat shipping fee
 *  taxPrice        Tax amount
 *  totalPrice      itemsPrice + shippingPrice + taxPrice
 *  isPaid          Boolean — set true when payment is confirmed
 *  paidAt          Timestamp of payment
 *  status          'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
 *  deliveredAt     Timestamp when status → 'delivered'
 *  createdAt / updatedAt  — added by { timestamps: true }
 *
 * Statics
 * ───────
 *  generateOrderNumber()  — creates a unique human-readable order ID
 */

const mongoose = require('mongoose');

// ── Order item sub-schema ─────────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Product',
      // Not required — product may be deleted but order must persist
    },
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
    },
  },
  { _id: false }
);

// ── Shipping address sub-schema ───────────────────────────────────────────────
const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    street:   { type: String, required: true, trim: true },
    city:     { type: String, required: true, trim: true },
    state:    { type: String, required: true, trim: true },
    zip:      { type: String, required: true, trim: true },
    country:  { type: String, required: true, trim: true, default: 'India' },
    phone:    { type: String, trim: true },
  },
  { _id: false }
);

// ── Payment result sub-schema ─────────────────────────────────────────────────
const paymentResultSchema = new mongoose.Schema(
  {
    id:          { type: String },
    status:      { type: String },
    updateTime:  { type: String },
    emailAddress:{ type: String },
  },
  { _id: false }
);

// ── Order schema ──────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    orderNumber: {
      type:   String,
      unique: true,
    },

    items: {
      type:     [orderItemSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message:   'Order must contain at least one item',
      },
    },

    shippingAddress: {
      type:     shippingAddressSchema,
      required: true,
    },

    paymentMethod: {
      type:     String,
      required: true,
      enum:     {
        values:   ['cod', 'card', 'upi'],
        message:  'Payment method must be cod, card, or upi',
      },
    },

    paymentResult: {
      type:    paymentResultSchema,
      default: null,
    },

    itemsPrice: {
      type:     Number,
      required: true,
      min:      0,
    },

    shippingPrice: {
      type:    Number,
      default: 0,
      min:     0,
    },

    taxPrice: {
      type:    Number,
      default: 0,
      min:     0,
    },

    totalPrice: {
      type:     Number,
      required: true,
      min:      0,
    },

    isPaid: {
      type:    Boolean,
      default: false,
    },

    paidAt: {
      type: Date,
    },

    status: {
      type:    String,
      enum:    {
        values:  ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        message: 'Invalid order status',
      },
      default: 'pending',
    },

    deliveredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
orderSchema.index({ user:        1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status:      1 });
orderSchema.index({ createdAt:  -1 });

// ── Pre-save: generate order number ──────────────────────────────────────────
orderSchema.pre('save', async function generateOrderNumber(next) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = await Order.generateOrderNumber();
  }
  next();
});

// ── Static: generate unique order number ─────────────────────────────────────
/**
 * Generates a human-readable order number like "ORD-20240527-A3F9".
 * Retries up to 5 times on collision (astronomically unlikely).
 */
const generateOrderNumber = async () => {
  const date    = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const chars   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random  = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

  let orderNumber;
  let attempts = 0;
  do {
    orderNumber = `ORD-${date}-${random()}`;
    attempts++;
    // eslint-disable-next-line no-await-in-loop
  } while (attempts < 5 && await mongoose.model('Order').exists({ orderNumber }));

  return orderNumber;
};

const Order = mongoose.model('Order', orderSchema);
Order.generateOrderNumber = generateOrderNumber;

module.exports = Order;
