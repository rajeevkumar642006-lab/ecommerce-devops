/**
 * User.js  —  Mongoose schema & model
 *
 * Fields
 * ──────
 *  name        Full display name
 *  email       Unique login identifier (lowercased before save)
 *  password    bcrypt hash — never returned in API responses
 *  role        'user' | 'admin'  (default: 'user')
 *  isActive    Soft-delete / account suspension flag
 *  address     Embedded sub-document for shipping details
 *  createdAt / updatedAt  — added automatically by { timestamps: true }
 *
 * Instance methods
 * ────────────────
 *  matchPassword(plain)  — compares a plain-text password against the hash
 *
 * Statics
 * ───────
 *  findByEmail(email)    — case-insensitive lookup helper
 *
 * Security notes
 * ──────────────
 *  • The password field has `select: false` so it is NEVER included in
 *    query results unless explicitly requested with .select('+password').
 *  • The pre-save hook only re-hashes when the password field is modified,
 *    so updates to other fields don't trigger an unnecessary bcrypt round.
 *  • toJSON transform strips __v and password from serialised output as a
 *    second line of defence.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Address sub-schema ────────────────────────────────────────────────────────
const addressSchema = new mongoose.Schema(
  {
    street:  { type: String, trim: true },
    city:    { type: String, trim: true },
    state:   { type: String, trim: true },
    zip:     { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' },
  },
  { _id: false }   // no separate _id for the embedded doc
);

// ── User schema ───────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      minlength: [2,  'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,   // always stored in lower-case
      trim:      true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select:    false,  // excluded from all queries by default
    },

    role: {
      type:    String,
      enum:    { values: ['user', 'admin'], message: 'Role must be user or admin' },
      default: 'user',
    },

    isActive: {
      type:    Boolean,
      default: true,
    },

    address: {
      type:    addressSchema,
      default: () => ({}),
    },

    // Stores the timestamp of the last successful login (useful for
    // invalidating tokens issued before a password change)
    passwordChangedAt: {
      type:   Date,
      select: false,
    },
  },
  {
    timestamps: true,   // adds createdAt + updatedAt

    // Strip sensitive / internal fields when the document is serialised
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// email already has a unique index from the schema definition.
// Add a compound index if you later need to query by role + isActive.
userSchema.index({ role: 1, isActive: 1 });

// ── Pre-save hook: hash password ──────────────────────────────────────────────
userSchema.pre('save', async function hashPassword(next) {
  // Only run when the password field was actually changed
  if (!this.isModified('password')) return next();

  const SALT_ROUNDS = 12;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);

  // Record when the password was last changed so we can invalidate
  // tokens that were issued before this moment
  this.passwordChangedAt = new Date(Date.now() - 1000); // 1 s buffer for clock skew
  next();
});

// ── Instance method: compare passwords ───────────────────────────────────────
/**
 * Compare a plain-text candidate password against the stored hash.
 *
 * @param  {string}  candidatePassword  Plain-text password from the request
 * @returns {Promise<boolean>}
 */
userSchema.methods.matchPassword = async function matchPassword(candidatePassword) {
  // `this.password` is available here because the controller explicitly
  // selects it with .select('+password')
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check whether a JWT was issued before the last password change.
 * Used in protect middleware to invalidate old tokens after a password reset.
 *
 * @param  {number} jwtIssuedAt  The `iat` claim from the decoded token (seconds)
 * @returns {boolean}  true if the token is stale
 */
userSchema.methods.changedPasswordAfter = function changedPasswordAfter(jwtIssuedAt) {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
    return jwtIssuedAt < changedTimestamp;
  }
  return false; // password never changed → token is still valid
};

// ── Static: find by email ─────────────────────────────────────────────────────
/**
 * Case-insensitive email lookup.
 * Always call this instead of User.findOne({ email }) directly.
 *
 * @param  {string} email
 * @returns {Promise<Document|null>}
 */
userSchema.statics.findByEmail = function findByEmail(email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
