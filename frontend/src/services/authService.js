/**
 * authService.js  —  Auth API calls
 *
 * Every function returns the `data` field from the API envelope
 * { success, message, data } so callers work with the payload directly.
 */

import api from './api';

const authService = {
  /** Register a new account */
  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data.data; // { token, user }
  },

  /** Login and receive a JWT */
  login: async (payload) => {
    const { data } = await api.post('/auth/login', payload);
    return data.data; // { token, user }
  },

  /** Logout hint (client clears token) */
  logout: async () => {
    await api.post('/auth/logout');
  },

  /** Get the currently authenticated user */
  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data.data.user;
  },

  /** Change password */
  changePassword: async (payload) => {
    const { data } = await api.put('/auth/change-password', payload);
    return data.data;
  },
};

export default authService;
