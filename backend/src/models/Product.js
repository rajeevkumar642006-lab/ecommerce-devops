/**
 * Product.js  —  Mongoose schema & model
 *
 * Fields
 * ──────
 *  name          Display name
 *  slug          URL-safe identifier — auto-generated from name
 *  description   Long-form product description
 *  price         Selling price (stored in smallest currency unit, e.g. paise/cents)
 *  comparePrice  Original / crossed-out price for "sale" display
 *  category      ObjectId ref → Category
 *  brand         Brand name string
 *  images        Array of image objects { url, altText, isPrimary }
 *  stock         Current inventory count
 *  sku           Stock-keeping unit — unique per product variant
 *  ratings       Embedded aggregate: { average, count }
 *  reviews       Array of embedded review sub-documents
 *  tags          Array of searchable keyword strings
 *  isActive      Soft-delete / visibility flag
 *  isFeatured    Pinned to homepage / featured section
 *  createdBy     ObjectId ref → User (admin who created the product)
 *  createdAt / updatedAt  — added by { timestamps: true }
 *
 * Virtuals
 * ────────
 *  isInStock     true when stock > 0
 *  discountPercent  percentage saved vs comparePrice
 *
 * Statics
 * ───────
 *  findBySlug(slug)   — convenience lookup
 *  findByCategory(categoryId, options)  — paginated category listing
 */

const mongoose = require('mongoose');

// ── Review sub-schema ─────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    name: {
      type:     String,
      required: true,
      trim:     true,
    },
    rating: {
      type:     Number,
      required: [true, 'Rating is required'],
      min:      [1, 'Rating must be at least 1'],
      max:      [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type:      String,
      trim:      true,
      maxlength: [1000, 'Review comment cannot exceed 1000 characters'],
    },
  },
  { timestamps: true }
);

// ── Image sub-schema ──────────────────────────────────────────────────────────
const imageSchema = new mongoose.Schema(
  {
    url: {
      type:     String,
      required: [true, 'Image URL is required'],
      trim:     true,
    },
    altText: {
      type:    String,
      trim:    true,
      default: '',
    },
    isPrimary: {
      type:    Boolean,
      default: false,
    },
  },
  { _id: false }
);

// ── Product schema ────────────────────────────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Product name is required'],
      trim:      true,
      minlength: [2,   'Product name must be at least 2 characters'],
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },

    slug: {
      type:      String,
      unique:    true,
      lowercase: true,
      trim:      true,
    },

    description: {
      type:      String,
      required:  [true, 'Product description is required'],
      trim:      true,
      minlength: [10,   'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },

    price: {
      type:     Number,
      required: [true, 'Price is required'],
      min:      [0, 'Price cannot be negative'],
    },

    // Optional "was" price — used to show a discount
    comparePrice: {
      type:    Number,
      min:     [0, 'Compare price cannot be negative'],
      default: null,
      validate: {
        validator(v) {
          // comparePrice must be greater than price when set
          return v === null || v > this.price;
        },
        message: 'Compare price must be greater than the selling price',
      },
    },

    category: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Category',
      required: [true, 'Category is required'],
    },

    brand: {
      type:    String,
      trim:    true,
      default: '',
    },

    images: {
      type:     [imageSchema],
      validate: {
        validator: (arr) => arr.length <= 10,
        message:   'A product cannot have more than 10 images',
      },
    },

    stock: {
      type:    Number,
      required: [true, 'Stock quantity is required'],
      min:     [0, 'Stock cannot be negative'],
      default: 0,
    },

    sku: {
      type:   String,
      unique: true,
      sparse: true,   // allows multiple null values (sku is optional)
      trim:   true,
      uppercase: true,
    },

    // Aggregate ratings — updated by a post-save hook on reviews
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count:   { type: Number, default: 0, min: 0 },
    },

    reviews: [reviewSchema],

    tags: {
      type:    [String],
      default: [],
    },

    isActive: {
      type:    Boolean,
      default: true,
    },

    isFeatured: {
      type:    Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    },
  },
  {
    timestamps: true,
    // Expose virtuals when converting to JSON / plain object
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
productSchema.index({ slug:       1 });
productSchema.index({ category:   1 });
productSchema.index({ isActive:   1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ price:      1 });
productSchema.index({ 'ratings.average': -1 });
// Full-text search index on name, description, brand, and tags
productSchema.index(
  { name: 'text', description: 'text', brand: 'text', tags: 'text' },
  { weights: { name: 10, brand: 5, tags: 3, description: 1 } }
);

// ── Pre-save: auto-generate slug ──────────────────────────────────────────────
productSchema.pre('save', async function generateSlug(next) {
  if (!this.isModified('name')) return next();

  const base = this.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  // Ensure uniqueness by appending a counter if the slug already exists
  let slug = base;
  let counter = 1;
  while (await mongoose.model('Product').exists({ slug, _id: { $ne: this._id } })) {
    slug = `${base}-${counter++}`;
  }
  this.slug = slug;
  next();
});

// ── Post-save on reviews: recalculate aggregate ratings ───────────────────────
productSchema.methods.recalculateRatings = function recalculateRatings() {
  const reviews = this.reviews;
  if (reviews.length === 0) {
    this.ratings = { average: 0, count: 0 };
  } else {
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    this.ratings = {
      average: Math.round((sum / reviews.length) * 10) / 10, // 1 decimal place
      count:   reviews.length,
    };
  }
};

// ── Virtuals ──────────────────────────────────────────────────────────────────
productSchema.virtual('isInStock').get(function () {
  return this.stock > 0;
});

productSchema.virtual('discountPercent').get(function () {
  if (!this.comparePrice || this.comparePrice <= this.price) return 0;
  return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
});

// ── Statics ───────────────────────────────────────────────────────────────────
productSchema.statics.findBySlug = function findBySlug(slug) {
  return this.findOne({ slug, isActive: true }).populate('category', 'name slug');
};

productSchema.statics.findByCategory = function findByCategory(categoryId, { page = 1, limit = 12 } = {}) {
  const skip = (page - 1) * limit;
  return this.find({ category: categoryId, isActive: true })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .populate('category', 'name slug');
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
