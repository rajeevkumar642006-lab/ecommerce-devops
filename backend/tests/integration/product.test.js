/**
 * product.test.js  —  Integration tests for /api/products
 *
 * Mocks:
 *   - Product model  (no real DB needed)
 *   - Category model
 *   - User model     (used by protect middleware)
 *   - connectDB
 *
 * Covered scenarios
 * ─────────────────
 *  GET  /api/products          — list with pagination meta
 *  GET  /api/products/featured — featured list
 *  GET  /api/products/:id      — single product, 404 case
 *  POST /api/products          — create (admin), 401/403 guards, 422 validation
 *  PUT  /api/products/:id      — update (admin), 404 case
 *  DELETE /api/products/:id    — soft-delete (admin)
 */

process.env.MONGO_URI  = 'mongodb://localhost/test';
process.env.JWT_SECRET = 'test_secret_key_for_jest';
process.env.NODE_ENV   = 'test';

const request = require('supertest');
const app     = require('../../src/app');

jest.mock('../../src/models/Product');
jest.mock('../../src/models/Category');
jest.mock('../../src/models/User');
jest.mock('../../src/config/db', () => jest.fn().mockResolvedValue(true));

const Product  = require('../../src/models/Product');
const Category = require('../../src/models/Category');
const User     = require('../../src/models/User');
const generateToken = require('../../src/utils/generateToken');

// ── Fixtures ──────────────────────────────────────────────────────────────────
const makeCategory = (overrides = {}) => ({
  _id:      '64b1c2d3e4f5a6b7c8d9e0f1',
  name:     'Electronics',
  slug:     'electronics',
  isActive: true,
  ...overrides,
});

const makeProduct = (overrides = {}) => ({
  _id:         '64c1d2e3f4a5b6c7d8e9f0a1',
  name:        'Test Laptop',
  slug:        'test-laptop',
  description: 'A great laptop for testing',
  price:       999.99,
  category:    makeCategory(),
  brand:       'TestBrand',
  stock:       10,
  images:      [],
  tags:        ['laptop', 'electronics'],
  ratings:     { average: 4.5, count: 2 },
  reviews:     [],
  isActive:    true,
  isFeatured:  false,
  createdAt:   new Date().toISOString(),
  populate:    jest.fn().mockResolvedValue(undefined),
  save:        jest.fn().mockResolvedValue(undefined),
  recalculateRatings: jest.fn(),
  ...overrides,
});

const makeAdminUser = () => ({
  _id:              '64a1b2c3d4e5f6a7b8c9d0e1',
  name:             'Admin User',
  email:            'admin@example.com',
  role:             'admin',
  isActive:         true,
  passwordChangedAt: null,
});

const makeRegularUser = () => ({
  _id:              '64a1b2c3d4e5f6a7b8c9d0e2',
  name:             'Regular User',
  email:            'user@example.com',
  role:             'user',
  isActive:         true,
  passwordChangedAt: null,
});

// ── Token helpers ─────────────────────────────────────────────────────────────
const adminToken = () => {
  const admin = makeAdminUser();
  User.findById = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(admin) }),
  });
  return `Bearer ${generateToken(admin)}`;
};

const userToken = () => {
  const user = makeRegularUser();
  User.findById = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(user) }),
  });
  return `Bearer ${generateToken(user)}`;
};

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/products', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return paginated product list with meta', async () => {
    const products = [makeProduct()];

    // Mock the chained query: find().populate().select().sort().skip().limit().lean()
    const chainMock = {
      populate: jest.fn().mockReturnThis(),
      select:   jest.fn().mockReturnThis(),
      sort:     jest.fn().mockReturnThis(),
      skip:     jest.fn().mockReturnThis(),
      limit:    jest.fn().mockReturnThis(),
      lean:     jest.fn().mockResolvedValue(products),
    };
    Product.find = jest.fn().mockReturnValue(chainMock);
    Product.countDocuments = jest.fn().mockResolvedValue(1);

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.products).toHaveLength(1);
    expect(res.body.meta).toMatchObject({ total: 1, page: 1 });
  });

  it('should return 422 for invalid query params', async () => {
    const res = await request(app).get('/api/products?page=abc');
    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/products/featured', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return featured products', async () => {
    const chainMock = {
      populate: jest.fn().mockReturnThis(),
      select:   jest.fn().mockReturnThis(),
      sort:     jest.fn().mockReturnThis(),
      limit:    jest.fn().mockReturnThis(),
      lean:     jest.fn().mockResolvedValue([makeProduct({ isFeatured: true })]),
    };
    Product.find = jest.fn().mockReturnValue(chainMock);

    const res = await request(app).get('/api/products/featured');

    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/products/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return a single product', async () => {
    const chainMock = {
      populate: jest.fn().mockReturnThis(),
    };
    // Last populate call resolves with the product
    chainMock.populate
      .mockReturnValueOnce(chainMock)
      .mockReturnValueOnce(chainMock)
      .mockResolvedValueOnce(makeProduct());

    Product.findOne = jest.fn().mockReturnValue(chainMock);

    const res = await request(app).get('/api/products/64c1d2e3f4a5b6c7d8e9f0a1');

    expect(res.status).toBe(200);
    expect(res.body.data.product.name).toBe('Test Laptop');
  });

  it('should return 404 for unknown product', async () => {
    const chainMock = {
      populate: jest.fn().mockReturnThis(),
    };
    chainMock.populate
      .mockReturnValueOnce(chainMock)
      .mockReturnValueOnce(chainMock)
      .mockResolvedValueOnce(null);

    Product.findOne = jest.fn().mockReturnValue(chainMock);

    const res = await request(app).get('/api/products/64c1d2e3f4a5b6c7d8e9f0a1');

    expect(res.status).toBe(404);
  });

  it('should return 422 for invalid ObjectId', async () => {
    const res = await request(app).get('/api/products/not-an-id');
    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/products', () => {
  const validBody = {
    name:        'New Laptop',
    description: 'A brand new laptop with great specs',
    price:       1299.99,
    category:    '64b1c2d3e4f5a6b7c8d9e0f1',
    stock:       5,
  };

  beforeEach(() => jest.clearAllMocks());

  it('should return 401 without a token', async () => {
    const res = await request(app).post('/api/products').send(validBody);
    expect(res.status).toBe(401);
  });

  it('should return 403 for a non-admin user', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', userToken())
      .send(validBody);
    expect(res.status).toBe(403);
  });

  it('should create a product and return 201', async () => {
    Category.findById = jest.fn().mockResolvedValue(makeCategory());
    Product.findOne   = jest.fn().mockResolvedValue(null); // no duplicate SKU

    const product = makeProduct({ name: validBody.name });
    Product.create = jest.fn().mockResolvedValue(product);

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', adminToken())
      .send(validBody);

    expect(res.status).toBe(201);
    // mock returns makeProduct() fixture which has name 'Test Laptop'
    expect(res.body.data.product).toHaveProperty('name');
  });

  it('should return 422 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', adminToken())
      .send({ name: 'Only name' });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('should return 400 when category does not exist', async () => {
    Category.findById = jest.fn().mockResolvedValue(null);

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', adminToken())
      .send(validBody);

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/products/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should update a product and return 200', async () => {
    const product = makeProduct();
    Product.findById = jest.fn().mockResolvedValue(product);

    const res = await request(app)
      .put('/api/products/64c1d2e3f4a5b6c7d8e9f0a1')
      .set('Authorization', adminToken())
      .send({ price: 899.99 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 when product does not exist', async () => {
    Product.findById = jest.fn().mockResolvedValue(null);

    const res = await request(app)
      .put('/api/products/64c1d2e3f4a5b6c7d8e9f0a1')
      .set('Authorization', adminToken())
      .send({ price: 899.99 });

    expect(res.status).toBe(404);
  });

  it('should return 403 for non-admin', async () => {
    const res = await request(app)
      .put('/api/products/64c1d2e3f4a5b6c7d8e9f0a1')
      .set('Authorization', userToken())
      .send({ price: 899.99 });

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/products/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should soft-delete a product and return 200', async () => {
    const product = makeProduct();
    Product.findById = jest.fn().mockResolvedValue(product);

    const res = await request(app)
      .delete('/api/products/64c1d2e3f4a5b6c7d8e9f0a1')
      .set('Authorization', adminToken());

    expect(res.status).toBe(200);
    expect(product.isActive).toBe(false);
    expect(product.save).toHaveBeenCalled();
  });

  it('should return 404 when product does not exist', async () => {
    Product.findById = jest.fn().mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/products/64c1d2e3f4a5b6c7d8e9f0a1')
      .set('Authorization', adminToken());

    expect(res.status).toBe(404);
  });

  it('should return 401 without a token', async () => {
    const res = await request(app).delete('/api/products/64c1d2e3f4a5b6c7d8e9f0a1');
    expect(res.status).toBe(401);
  });
});
