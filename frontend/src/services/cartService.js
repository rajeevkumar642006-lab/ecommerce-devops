/**
 * cartService.js  —  Cart API calls
 */

import api from './api';

const cartService = {
  getCart: async () => {
    const { data } = await api.get('/cart');
    return data.data.cart;
  },

  addToCart: async (productId, quantity = 1) => {
    const { data } = await api.post('/cart', { productId, quantity });
    return data.data.cart;
  },

  updateItem: async (productId, quantity) => {
    const { data } = await api.put(`/cart/${productId}`, { quantity });
    return data.data.cart;
  },

  removeItem: async (productId) => {
    const { data } = await api.delete(`/cart/${productId}`);
    return data.data.cart;
  },

  clearCart: async () => {
    const { data } = await api.delete('/cart');
    return data.data.cart;
  },
};

export default cartService;
