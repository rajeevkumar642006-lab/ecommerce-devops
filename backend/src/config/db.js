/**
 * db.js
 *
 * Encapsulates the Mongoose connection lifecycle.
 * - connectDB()   : opens the connection; called once at startup.
 * - Mongoose emits events that are forwarded to the logger so every
 *   connection state change is visible in the logs.
 * - The function returns the Mongoose connection object so callers
 *   can await it or attach additional listeners if needed.
 */

const mongoose = require('mongoose');
const { MONGO_URI, NODE_ENV } = require('./env');
const logger = require('../utils/logger');

// Silence Mongoose's own debug output in production; enable in development
mongoose.set('debug', NODE_ENV === 'development');

// Prevent Mongoose from buffering commands when the connection drops
mongoose.set('bufferCommands', false);

/**
 * Automatically seeds default admin users if they do not exist
 * or ensures their passwords match and are hashed properly.
 */
const seedDefaultAdmin = async () => {
  try {
    const User = require('../models/User');

    // 1. Seed admin@test.com
    const adminEmail = 'admin@test.com';
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      logger.info(`Admin user not found. Seeding default admin user: ${adminEmail}...`);
      await User.create({
        name: 'Admin Test',
        email: adminEmail,
        password: 'admin123',
        role: 'admin',
        isActive: true,
        address: {}
      });
      logger.info(`Default admin user seeded successfully: ${adminEmail} / admin123`);
    } else {
      logger.info(`Default admin user already exists: ${adminEmail}`);
    }

    // 2. Seed/Verify admin@shophub.com
    const shophubEmail = 'admin@shophub.com';
    const shophubExists = await User.findOne({ email: shophubEmail });
    if (!shophubExists) {
      logger.info(`ShopHub admin user not found. Seeding: ${shophubEmail}...`);
      await User.create({
        name: 'Admin User',
        email: shophubEmail,
        password: 'Admin@123',
        role: 'admin',
        isActive: true,
        address: {}
      });
      logger.info(`Admin user seeded successfully: ${shophubEmail} / Admin@123`);
    } else {
      logger.info(`ShopHub admin user already exists: ${shophubEmail}. Ensuring hashed password is correct.`);
      // Update/Re-hash to ensure compatibility with local bcrypt
      shophubExists.password = 'Admin@123';
      await shophubExists.save();
      logger.info(`ShopHub admin user password verified and re-hashed successfully.`);
    }

  } catch (error) {
    logger.error(`Error seeding default admin user(s): ${error.message}`);
  }
};

/**
 * Opens a Mongoose connection to MongoDB.
 * Throws (and exits the process) if the initial connection fails so the
 * container / process manager can restart cleanly.
 *
 * @returns {Promise<mongoose.Connection>}
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      // These are the recommended options for Mongoose 7+
      serverSelectionTimeoutMS: 5000, // fail fast if MongoDB is unreachable
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    // Automatically seed default admin users
    await seedDefaultAdmin();

    // ── Connection event listeners ──────────────────────────────────────────
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    return conn.connection;
  } catch (err) {
    logger.error(`MongoDB initial connection failed: ${err.message}`);
    process.exit(1); // let the process manager restart the container
  }
};

module.exports = connectDB;
