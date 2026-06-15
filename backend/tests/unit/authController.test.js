/**
 * authController.test.js
 * Unit tests for authController.js
 */

const authController = require('../../src/controllers/authController');
const User = require('../../src/models/User');
const { created, ok, unauthorized, conflict, notFound } = require('../../src/utils/apiResponse');

jest.mock('../../src/models/User');
jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashed'),
}));
jest.mock('../../src/utils/generateToken', () => jest.fn(() => 'mock-jwt-token'));
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));
jest.mock('../../src/utils/apiResponse', () => ({
  created: jest.fn(),
  ok: jest.fn(),
  unauthorized: jest.fn(),
  conflict: jest.fn(),
  notFound: jest.fn(),
}));

describe('authController Unit Tests', () => {
  let req, res;
  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      user: { id: 'user123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('logout', () => {
    it('should return logout success response', async () => {
      await authController.logout(req, res);
      expect(ok).toHaveBeenCalledWith(res, 'Logged out successfully');
    });
  });

  describe('getMe', () => {
    it('should return user profile if found', async () => {
      const mockUser = { _id: 'user123', name: 'Test' };
      User.findById.mockResolvedValue(mockUser);
      await authController.getMe(req, res);
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(ok).toHaveBeenCalledWith(res, 'Profile fetched successfully', { user: mockUser });
    });

    it('should return 404 if user not found', async () => {
      User.findById.mockResolvedValue(null);
      await authController.getMe(req, res);
      expect(notFound).toHaveBeenCalledWith(res, 'User not found');
    });
  });
});
