/**
 * productController.js
 *
 * All product CRUD operations plus review management.
 *
 * Public endpoints (no auth):
 *   GET  /api/products              getProducts      — paginated list with filters
 *   GET  /api/products/featured     getFeaturedProducts
 *   GET  /api/products/:id          getProductById
 *   GET  /api/products/slug/:slug   getProductBySlug
 *
 * Admin-only endpoints (protect + adminOnly):
 *   POST   /api/products            createProduct
 *   PUT    /api/products/:id        updateProduct
 *   DELETE /api/products/:id        deleteProduct
 *
 * Authenticated user endpoints (protect):
 *   POST   /api/products/:id/reviews   addReview
 *   DELETE /api/products/:id/reviews   deleteReview
 */

const Product  = require('../models/Product');
const Category = require('../models/Category');
const {
  created, ok, noContent,
  badRequest, notFound, conflict, forbidden,
} = require('../utils/apiResponse');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a Mongoose sort object from the ?sort= query param.
 * Defaults to newest-first.
 */
const buildSortObject = (sort) => {
  const map = {
    price_asc:  { price:  1 },
    price_desc: { price: -1 },
    newest:     { createdAt: -1 },
    oldest:     { createdAt:  1 },
    rating:     { 'ratings.average': -1 },
    name_asc:   { name:  1 },
    name_desc:  { name: -1 },
  };
  return map[sort] || { createdAt: -1 };
};

/**
 * Build a Mongoose filter object from the GET /products query string.
 *
 * Supported params:
 *   search, category, brand, minPrice, maxPrice,
 *   inStock, isFeatured, tags (comma-separated)
 */
const buildFilterObject = (query) => {
  const filter = { isActive: true };

  // Full-text search (uses the text index on name/description/brand/tags)
  if (query.search) {
    filter.$text = { $search: query.search };
  }

  if (query.category) filter.category   = query.category;
  if (query.brand)    filter.brand       = new RegExp(query.brand, 'i');
  if (query.inStock === 'true') filter.stock = { $gt: 0 };
  if (query.isFeatured === 'true') filter.isFeatured = true;

  if (query.tags) {
    const tagList = query.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagList.length) filter.tags = { $in: tagList };
  }

  // Price range
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = parseFloat(query.minPrice);
    if (query.maxPrice) filter.price.$lte = parseFloat(query.maxPrice);
  }

  return filter;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Return a paginated, filtered, sorted list of active products.
 *
 * Query params:
 *   page        (default 1)
 *   limit       (default 12, max 100)
 *   sort        price_asc | price_desc | newest | oldest | rating | name_asc | name_desc
 *   search      full-text search string
 *   category    ObjectId
 *   brand       partial match (case-insensitive)
 *   minPrice    number
 *   maxPrice    number
 *   inStock     true | false
 *   isFeatured  true | false
 *   tags        comma-separated list
 */
exports.getProducts = async (req, res) => {
  const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 12, 100);
  const skip  = (page - 1) * limit;
  const sort  = buildSortObject(req.query.sort);
  const filter = buildFilterObject(req.query);

  // Run count and data fetch in parallel for performance
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .select('-reviews')          // exclude reviews array from list view
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return ok(res, 'Products fetched successfully', { products }, {
    total,
    page,
    limit,
    pages:    Math.ceil(total / limit),
    hasNext:  page < Math.ceil(total / limit),
    hasPrev:  page > 1,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products/featured
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Return up to 8 featured active products.
 * Ordered by rating descending so the best-rated appear first.
 */
exports.getFeaturedProducts = async (_req, res) => {
  const products = await Product.find({ isActive: true, isFeatured: true })
    .populate('category', 'name slug')
    .select('-reviews')
    .sort({ 'ratings.average': -1 })
    .limit(8)
    .lean();

  return ok(res, 'Featured products fetched successfully', { products });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products/:id
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Return a single product by its MongoDB ObjectId.
 * Includes the full reviews array and populates category + createdBy.
 */
exports.getProductById = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true })
    .populate('category', 'name slug description')
    .populate('createdBy', 'name email')
    .populate('reviews.user', 'name');

  if (!product) return notFound(res, 'Product not found');

  return ok(res, 'Product fetched successfully', { product });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products/slug/:slug
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Return a single product by its URL slug.
 * Useful for SEO-friendly product pages.
 */
exports.getProductBySlug = async (req, res) => {
  const product = await Product.findBySlug(req.params.slug)
    .populate('createdBy', 'name email')
    .populate('reviews.user', 'name');

  if (!product) return notFound(res, 'Product not found');

  return ok(res, 'Product fetched successfully', { product });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/products  (admin only)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Create a new product.
 *
 * Body: { name, description, price, comparePrice?, category, brand?,
 *         images?, stock, sku?, tags?, isFeatured? }
 *
 * Steps:
 *  1. Verify the referenced category exists and is active
 *  2. Check for duplicate SKU (if provided)
 *  3. Create the product (pre-save hook generates the slug)
 *  4. Return 201 with the populated product
 */
exports.createProduct = async (req, res) => {
  const {
    name, description, price, comparePrice,
    category, brand, images, stock, sku, tags, isFeatured,
  } = req.body;

  // 1. Validate category
  const categoryDoc = await Category.findById(category);
  if (!categoryDoc || !categoryDoc.isActive) {
    return badRequest(res, 'Category not found or inactive');
  }

  // 2. Duplicate SKU check
  if (sku) {
    const skuExists = await Product.findOne({ sku: sku.toUpperCase() });
    if (skuExists) return conflict(res, `SKU "${sku}" is already in use`);
  }

  // 3. Create
  const product = await Product.create({
    name,
    description,
    price,
    comparePrice:  comparePrice ?? null,
    category,
    brand:         brand || '',
    images:        images || [],
    stock,
    sku:           sku || undefined,
    tags:          tags || [],
    isFeatured:    isFeatured || false,
    createdBy:     req.user.id,
  });

  // 4. Populate for the response
  await product.populate('category', 'name slug');

  logger.info(`Product created: "${product.name}" (${product._id}) by ${req.user.email}`);

  return created(res, 'Product created successfully', { product });
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/products/:id  (admin only)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Update an existing product.
 * Only the fields present in the request body are updated (partial update).
 *
 * Steps:
 *  1. Find the product (including inactive ones so admins can re-activate)
 *  2. If category is being changed, verify the new category exists
 *  3. If SKU is being changed, check for duplicates
 *  4. Apply updates and save (triggers pre-save slug regeneration if name changed)
 */
exports.updateProduct = async (req, res) => {
  // 1. Find — admins can update inactive products too
  const product = await Product.findById(req.params.id);
  if (!product) return notFound(res, 'Product not found');

  const {
    name, description, price, comparePrice,
    category, brand, images, stock, sku,
    tags, isFeatured, isActive,
  } = req.body;

  // 2. Validate new category if provided
  if (category && category !== product.category.toString()) {
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc || !categoryDoc.isActive) {
      return badRequest(res, 'Category not found or inactive');
    }
  }

  // 3. Duplicate SKU check (exclude current product)
  if (sku && sku.toUpperCase() !== product.sku) {
    const skuExists = await Product.findOne({ sku: sku.toUpperCase(), _id: { $ne: product._id } });
    if (skuExists) return conflict(res, `SKU "${sku}" is already in use`);
  }

  // 4. Apply only the fields that were sent
  if (name        !== undefined) product.name        = name;
  if (description !== undefined) product.description = description;
  if (price       !== undefined) product.price       = price;
  if (comparePrice !== undefined) product.comparePrice = comparePrice;
  if (category    !== undefined) product.category    = category;
  if (brand       !== undefined) product.brand       = brand;
  if (images      !== undefined) product.images      = images;
  if (stock       !== undefined) product.stock       = stock;
  if (sku         !== undefined) product.sku         = sku;
  if (tags        !== undefined) product.tags        = tags;
  if (isFeatured  !== undefined) product.isFeatured  = isFeatured;
  if (isActive    !== undefined) product.isActive    = isActive;

  await product.save();
  await product.populate('category', 'name slug');

  logger.info(`Product updated: "${product.name}" (${product._id}) by ${req.user.email}`);

  return ok(res, 'Product updated successfully', { product });
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/products/:id  (admin only)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Soft-delete a product by setting isActive = false.
 * The document is retained in the database for order history integrity.
 *
 * Hard-delete is intentionally not exposed — use a DB migration script
 * if permanent removal is ever needed.
 */
exports.deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return notFound(res, 'Product not found');

  product.isActive = false;
  await product.save();

  logger.info(`Product deactivated: "${product.name}" (${product._id}) by ${req.user.email}`);

  return ok(res, 'Product deleted successfully');
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/products/:id/reviews  (authenticated users)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Add or update a review for a product.
 * Each user can only have one review per product — submitting again
 * replaces the existing review.
 *
 * Body: { rating, comment? }
 */
exports.addReview = async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findOne({ _id: req.params.id, isActive: true });
  if (!product) return notFound(res, 'Product not found');

  // Check if the user already reviewed this product
  const existingIndex = product.reviews.findIndex(
    (r) => r.user.toString() === req.user.id
  );

  const reviewData = {
    user:    req.user.id,
    name:    req.user.name,
    rating:  Number(rating),
    comment: comment || '',
  };

  if (existingIndex >= 0) {
    // Update existing review
    product.reviews[existingIndex] = {
      ...product.reviews[existingIndex].toObject(),
      ...reviewData,
    };
  } else {
    // Add new review
    product.reviews.push(reviewData);
  }

  // Recalculate aggregate ratings
  product.recalculateRatings();
  await product.save();

  const action = existingIndex >= 0 ? 'updated' : 'added';
  logger.info(`Review ${action} on product "${product.name}" by ${req.user.email}`);

  return ok(res, `Review ${action} successfully`, {
    ratings: product.ratings,
    review:  product.reviews[existingIndex >= 0 ? existingIndex : product.reviews.length - 1],
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/products/:id/reviews  (authenticated users)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Remove the authenticated user's review from a product.
 */
exports.deleteReview = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true });
  if (!product) return notFound(res, 'Product not found');

  const reviewIndex = product.reviews.findIndex(
    (r) => r.user.toString() === req.user.id
  );

  if (reviewIndex === -1) {
    return notFound(res, 'You have not reviewed this product');
  }

  product.reviews.splice(reviewIndex, 1);
  product.recalculateRatings();
  await product.save();

  logger.info(`Review deleted on product "${product.name}" by ${req.user.email}`);

  return ok(res, 'Review deleted successfully', { ratings: product.ratings });
};
