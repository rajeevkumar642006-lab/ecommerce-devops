/**
 * generateToken.js
 *
 * Wraps jwt.sign so every part of the app uses the same signing
 * options.  The token payload intentionally contains only the minimum
 * needed to identify the user and check their role — never sensitive
 * data like passwords or full profile objects.
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

/**
 * Sign and return a JWT for the given user document.
 *
 * @param {object} user  Mongoose User document (or plain object with _id + role)
 * @returns {string}     Signed JWT string
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id:   user._id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

module.exports = generateToken;
