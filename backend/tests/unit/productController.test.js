/**
 * productController.test.js
 * Unit tests for productController.js
 */

const productController = require('../../src/controllers/productController');
const Product = require('../../src/models/Product');
const { ok, notFound } = require('../../src/utils/apiResponse');

jest.mock('../../src/models/Product');
jest.mock('../../src/models/Category');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));
jest.mock('../../src/utils/apiResponse', () => ({
  created: jest.fn(),
  ok: jest.fn(),
  noContent: jest.fn(),
  badRequest: jest.fn(),
  notFound: jest.fn(),
  conflict: jest.fn(),
  forbidden: jest.fn(),
}));

describe('productController Unit Tests', () => {
  let req, res;
  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      query: {},
      params: {},
      body: {},
      user: { id: 'admin123', email: 'admin@test.com' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('getFeaturedProducts', () => {
    it('should fetch up to 8 featured products', async () => {
      const mockProducts = [{ _id: 'prod1', name: 'Featured Product' }];
      const selectMock = jest.fn().mockReturnThis();
      const sortMock = jest.fn().mockReturnThis();
      const limitMock = jest.fn().mockReturnThis();
      const leanMock = jest.fn().mockResolvedValue(mockProducts);
      const populateMock = jest.fn().mockReturnValue({
        select: selectMock,
      });
      selectMock.mockReturnValue({
        sort: sortMock,
      });
      sortMock.mockReturnValue({
        limit: limitMock,
      });
      limitMock.mockReturnValue({
        lean: leanMock,
      });
      
      Product.find.mockReturnValue({
        populate: populateMock,
      });

      await productController.getFeaturedProducts(req, res);

      expect(Product.find).toHaveBeenCalledWith({ isActive: true, isFeatured: true });
      expect(ok).toHaveBeenCalledWith(res, 'Featured products fetched successfully', { products: mockProducts });
    });
  });

  describe('getProductById', () => {
    it('should return product if found', async () => {
      const mockProduct = { _id: 'prod123', name: 'Product 1' };
      req.params.id = 'prod123';

      const populate3 = jest.fn().mockResolvedValue(mockProduct);
      const populate2 = jest.fn().mockReturnValue({ populate: populate3 });
      const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
      const findOneMock = jest.fn().mockReturnValue({ populate: populate1 });
      Product.findOne = findOneMock;

      await productController.getProductById(req, res);

      expect(Product.findOne).toHaveBeenCalledWith({ _id: 'prod123', isActive: true });
      expect(ok).toHaveBeenCalledWith(res, 'Product fetched successfully', { product: mockProduct });
    });

    it('should return 404 if product not found', async () => {
      req.params.id = 'prod999';
      
      const populate3 = jest.fn().mockResolvedValue(null);
      const populate2 = jest.fn().mockReturnValue({ populate: populate3 });
      const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
      const findOneMock = jest.fn().mockReturnValue({ populate: populate1 });
      Product.findOne = findOneMock;

      await productController.getProductById(req, res);

      expect(notFound).toHaveBeenCalledWith(res, 'Product not found');
    });
  });
});
