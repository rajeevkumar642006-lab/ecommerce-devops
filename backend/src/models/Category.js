/**
 * Category.js  —  Mongoose schema & model
 *
 * A lightweight taxonomy model.  Products reference a Category by ObjectId
 * so the category name can be updated in one place without touching every
 * product document.
 *
 * Fields
 * ──────
 *  name        Unique display name  (e.g. "Electronics")
 *  slug        URL-safe identifier  (e.g. "electronics")  — auto-generated
 *  description Optional long description
 *  isActive    Soft-delete flag; inactive categories are hidden from the API
 *  createdAt / updatedAt  — added by { timestamps: true }
 */

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Category name is required'],
      unique:    true,
      trim:      true,
      minlength: [2,  'Category name must be at least 2 characters'],
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },

    // Slug is derived from name in the pre-save hook below.
    // Stored separately so it can be indexed and queried efficiently.
    slug: {
      type:   String,
      unique: true,
      lowercase: true,
      trim:   true,
    },

    description: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default:   '',
    },

    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });

// ── Pre-save: auto-generate slug from name ────────────────────────────────────
categorySchema.pre('save', function generateSlug(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
      .replace(/\s+/g, '-')            // spaces → hyphens
      .replace(/-+/g, '-');            // collapse multiple hyphens
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
