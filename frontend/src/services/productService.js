/**
 * productService.js  —  Product API calls
 */

import api from './api';

const productService = {
  /** Get paginated, filtered product list */
  getProducts: async (params = {}) => {
    const { data } = await api.get('/products', { params });
    return data; // { success, data: { products }, meta }
  },

  /** Get featured products */
  getFeatured: async () => {
    const { data } = await api.get('/products/featured');
    return data.data.products;
  },

  /** Get single product by ID */
  getById: async (id) => {
    const { data } = await api.get(`/products/${id}`);
    return data.data.product;
  },

  /** Get single product by slug */
  getBySlug: async (slug) => {
    const { data } = await api.get(`/products/slug/${slug}`);
    return data.data.product;
  },

  /** Admin: create product */
  create: async (payload) => {
    const { data } = await api.post('/products', payload);
    return data.data.product;
  },

  /** Admin: update product */
  update: async (id, payload) => {
    const { data } = await api.put(`/products/${id}`, payload);
    return data.data.product;
  },

  /** Admin: delete product */
  remove: async (id) => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },

  /** Add or update a review */
  addReview: async (id, payload) => {
    const { data } = await api.post(`/products/${id}/reviews`, payload);
    return data.data;
  },
};

export default productService;
