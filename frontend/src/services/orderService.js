/**
 * orderService.js  —  Order API calls
 */

import api from './api';

const orderService = {
  /** Create order from cart */
  createOrder: async (payload) => {
    const { data } = await api.post('/orders', payload);
    return data.data.order;
  },

  /** Get current user's orders */
  getMyOrders: async (params = {}) => {
    const { data } = await api.get('/orders/my-orders', { params });
    return data;
  },

  /** Get single order by ID */
  getById: async (id) => {
    const { data } = await api.get(`/orders/${id}`);
    return data.data.order;
  },

  /** Admin: get all orders */
  getAllOrders: async (params = {}) => {
    const { data } = await api.get('/orders', { params });
    return data;
  },

  /** Admin: update order status */
  updateStatus: async (id, status) => {
    const { data } = await api.put(`/orders/${id}/status`, { status });
    return data.data.order;
  },
};

export default orderService;
