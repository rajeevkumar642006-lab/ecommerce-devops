/**
 * productRoutes.js
 * Base path: /api/products
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Method  │  Path                      │  Auth        │  Handler          │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  GET     │  /                         │  public      │  getProducts      │
 * │  GET     │  /featured                 │  public      │  getFeaturedProds │
 * │  GET     │  /slug/:slug               │  public      │  getProductBySlug │
 * │  GET     │  /:id                      │  public      │  getProductById   │
 * │  POST    │  /                         │  admin       │  createProduct    │
 * │  PUT     │  /:id                      │  admin       │  updateProduct    │
 * │  DELETE  │  /:id                      │  admin       │  deleteProduct    │
 * │  POST    │  /:id/reviews              │  user        │  addReview        │
 * │  DELETE  │  /:id/reviews              │  user        │  deleteReview     │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * NOTE: /featured and /slug/:slug MUST be declared before /:id so Express
 * doesn't try to cast "featured" or "slug" as a MongoDB ObjectId.
 */

const express = require('express');
const router  = express.Router();

const { protect }   = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductQuery,
  validateObjectId,
  validateAddReview,
} = require('../validators/productValidator');
const productController = require('../controllers/productController');

// ── Public routes ─────────────────────────────────────────────────────────────
router.get('/',
  validateProductQuery,
  productController.getProducts
);

router.get('/featured',
  productController.getFeaturedProducts
);

router.get('/slug/:slug',
  productController.getProductBySlug
);

router.get('/:id',
  validateObjectId,
  productController.getProductById
);

// ── Admin-only routes ─────────────────────────────────────────────────────────
router.post('/',
  protect, adminOnly,
  validateCreateProduct,
  productController.createProduct
);

router.put('/:id',
  protect, adminOnly,
  validateUpdateProduct,
  productController.updateProduct
);

router.delete('/:id',
  protect, adminOnly,
  validateObjectId,
  productController.deleteProduct
);

// ── Authenticated user routes ─────────────────────────────────────────────────
router.post('/:id/reviews',
  protect,
  validateAddReview,
  productController.addReview
);

router.delete('/:id/reviews',
  protect,
  validateObjectId,
  productController.deleteReview
);

module.exports = router;
