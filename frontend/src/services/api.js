/**
 * api.js  —  Axios instance & request/response interceptors
 *
 * All API calls in the app go through this single instance so:
 *  • The base URL is configured in one place (VITE_API_BASE_URL env var).
 *  • The JWT token is automatically attached to every request.
 *  • 401 responses automatically clear the stored token and redirect to /login.
 *  • Error messages are normalised so every catch block gets a plain string.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: normalise errors ───────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 → clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on an auth page
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    // Normalise: always reject with a plain error message string
    const message =
      error.response?.data?.message ||
      error.response?.data?.error  ||
      error.message                 ||
      'Something went wrong';

    return Promise.reject(new Error(message));
  }
);

export default api;
