/**
 * productValidator.js
 *
 * express-validator rule chains for product endpoints.
 *
 * Exports
 * ───────
 *  validateCreateProduct   POST /api/products
 *  validateUpdateProduct   PUT  /api/products/:id
 *  validateProductQuery    GET  /api/products  (query-string params)
 *  validateObjectId        Any route with /:id
 *  validateAddReview       POST /api/products/:id/reviews
 */

const { body, query, param, validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

// ── Shared: collect errors and short-circuit ──────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field:   e.path,
      message: e.msg,
    }));
    return sendError(res, 422, 'Validation failed', formatted);
  }
  next();
};

// ── Shared: validate MongoDB ObjectId in route params ────────────────────────
const validateObjectId = [
  param('id')
    .isMongoId().withMessage('Invalid product ID format'),
  validate,
];

// ── Create product ────────────────────────────────────────────────────────────
const validateCreateProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Name must be 2–200 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Description must be 10–5000 characters'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),

  body('comparePrice')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Compare price must be a non-negative number')
    .custom((value, { req }) => {
      if (value !== null && value !== undefined && parseFloat(value) <= parseFloat(req.body.price)) {
        throw new Error('Compare price must be greater than the selling price');
      }
      return true;
    }),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Category must be a valid ID'),

  body('brand')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Brand cannot exceed 100 characters'),

  body('stock')
    .notEmpty().withMessage('Stock quantity is required')
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),

  body('sku')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('SKU cannot exceed 100 characters'),

  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.some((t) => typeof t !== 'string' || t.trim() === '')) {
        throw new Error('Each tag must be a non-empty string');
      }
      return true;
    }),

  body('images')
    .optional()
    .isArray({ max: 10 }).withMessage('A product can have at most 10 images'),

  body('images.*.url')
    .optional()
    .trim()
    .isURL().withMessage('Each image must have a valid URL'),

  body('isFeatured')
    .optional()
    .isBoolean().withMessage('isFeatured must be true or false'),

  validate,
];

// ── Update product (all fields optional) ─────────────────────────────────────
const validateUpdateProduct = [
  param('id')
    .isMongoId().withMessage('Invalid product ID format'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Name must be 2–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 }).withMessage('Description must be 10–5000 characters'),

  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),

  body('comparePrice')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Compare price must be a non-negative number'),

  body('category')
    .optional()
    .isMongoId().withMessage('Category must be a valid ID'),

  body('brand')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Brand cannot exceed 100 characters'),

  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),

  body('sku')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('SKU cannot exceed 100 characters'),

  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),

  body('images')
    .optional()
    .isArray({ max: 10 }).withMessage('A product can have at most 10 images'),

  body('images.*.url')
    .optional()
    .trim()
    .isURL().withMessage('Each image must have a valid URL'),

  body('isFeatured')
    .optional()
    .isBoolean().withMessage('isFeatured must be true or false'),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be true or false'),

  validate,
];

// ── GET /api/products query-string validation ─────────────────────────────────
const validateProductQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('minPrice must be a non-negative number'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('maxPrice must be a non-negative number'),

  query('sort')
    .optional()
    .isIn(['price_asc', 'price_desc', 'newest', 'oldest', 'rating', 'name_asc', 'name_desc'])
    .withMessage('Invalid sort option'),

  query('category')
    .optional()
    .isMongoId().withMessage('Category must be a valid ID'),

  validate,
];

// ── Add review ────────────────────────────────────────────────────────────────
const validateAddReview = [
  param('id')
    .isMongoId().withMessage('Invalid product ID format'),

  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),

  validate,
];

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductQuery,
  validateObjectId,
  validateAddReview,
};
