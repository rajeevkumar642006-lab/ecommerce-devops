/**
 * store/index.js  —  Redux store configuration
 *
 * Combines all slices into a single store.
 * The store is imported once in main.jsx and provided via <Provider>.
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer    from './slices/authSlice';
import cartReducer    from './slices/cartSlice';
import productReducer from './slices/productSlice';

const store = configureStore({
  reducer: {
    auth:     authReducer,
    cart:     cartReducer,
    products: productReducer,
  },
  // Redux DevTools is enabled automatically in development
  devTools: import.meta.env.DEV,
});

export default store;
