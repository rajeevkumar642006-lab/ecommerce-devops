/**
 * auth.test.js  —  Integration tests for /api/auth
 *
 * Uses supertest to fire real HTTP requests against the Express app.
 * MongoDB is mocked with jest.mock so no real database is needed.
 *
 * Covered scenarios
 * ─────────────────
 *  Register  : success, duplicate email, validation errors
 *  Login     : success, wrong password, unknown email, inactive account
 *  Get /me   : success, no token, expired/invalid token
 *  Logout    : always succeeds
 */

// Set env vars before any module is loaded
process.env.MONGO_URI  = 'mongodb://localhost/test';
process.env.JWT_SECRET = 'test_secret_key_for_jest';
process.env.NODE_ENV   = 'test';

const request = require('supertest');
const app     = require('../../src/app');

// ── Mock the User model so tests never touch a real DB ────────────────────────
jest.mock('../../src/models/User');
const User = require('../../src/models/User');

// ── Mock connectDB so the app doesn't try to connect ─────────────────────────
jest.mock('../../src/config/db', () => jest.fn().mockResolvedValue(true));

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeUser = (overrides = {}) => ({
  _id:       '64a1b2c3d4e5f6a7b8c9d0e1',
  name:      'Test User',
  email:     'test@example.com',
  role:      'user',
  isActive:  true,
  address:   {},
  createdAt: new Date().toISOString(),
  password:  '$2a$12$hashedpassword',
  matchPassword: jest.fn(),
  save:      jest.fn().mockResolvedValue(true),
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  const validBody = {
    name:            'Jane Doe',
    email:           'jane@example.com',
    password:        'Password1',
    confirmPassword: 'Password1',
  };

  beforeEach(() => jest.clearAllMocks());

  it('should register a new user and return 201 + token', async () => {
    User.findByEmail = jest.fn().mockResolvedValue(null);
    User.create      = jest.fn().mockResolvedValue(makeUser({ email: validBody.email }));

    const res = await request(app).post('/api/auth/register').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('should return 409 when email is already registered', async () => {
    User.findByEmail = jest.fn().mockResolvedValue(makeUser());

    const res = await request(app).post('/api/auth/register').send(validBody);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should return 422 when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'bad' });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('should return 422 when passwords do not match', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...validBody,
      confirmPassword: 'DifferentPass1',
    });

    expect(res.status).toBe(422);
  });

  it('should return 422 when password is too weak', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...validBody,
      password:        'weak',
      confirmPassword: 'weak',
    });

    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  const validBody = { email: 'test@example.com', password: 'Password1' };

  beforeEach(() => jest.clearAllMocks());

  it('should login and return 200 + token', async () => {
    const user = makeUser();
    user.matchPassword = jest.fn().mockResolvedValue(true);
    User.findByEmail   = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });

    const res = await request(app).post('/api/auth/login').send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
  });

  it('should return 401 for wrong password', async () => {
    const user = makeUser();
    user.matchPassword = jest.fn().mockResolvedValue(false);
    User.findByEmail   = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });

    const res = await request(app).post('/api/auth/login').send(validBody);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('should return 401 for unknown email', async () => {
    User.findByEmail = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app).post('/api/auth/login').send(validBody);

    expect(res.status).toBe(401);
  });

  it('should return 401 for deactivated account', async () => {
    const user = makeUser({ isActive: false });
    user.matchPassword = jest.fn().mockResolvedValue(true);
    User.findByEmail   = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });

    const res = await request(app).post('/api/auth/login').send(validBody);

    expect(res.status).toBe(401);
  });

  it('should return 422 for missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('should return 401 with an invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });

  it('should return 200 with a valid token', async () => {
    // Generate a real token for the test user
    const generateToken = require('../../src/utils/generateToken');
    const user = makeUser();
    const token = generateToken(user);

    // protect middleware calls: User.findById(id).select('+passwordChangedAt').lean()
    // getMe controller calls:   User.findById(id)  (plain, no chaining)
    const protectUser = { ...user, passwordChangedAt: null };
    User.findById = jest.fn()
      // First call — from protect middleware (chains .select().lean())
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(protectUser),
        }),
      })
      // Second call — from getMe controller (plain promise, no password field)
      .mockResolvedValueOnce({ ...user, password: undefined });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user).not.toHaveProperty('password');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/logout', () => {
  it('should always return 200', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
