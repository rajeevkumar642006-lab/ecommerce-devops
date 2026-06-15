/**
 * cartSlice.js  —  Redux Toolkit slice for cart state
 *
 * State shape:
 *   items      — array of cart line items (from API)
 *   totalItems — sum of quantities
 *   totalPrice — sum of price × quantity
 *   loading    — true while a cart API call is in flight
 *   error      — last error message
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cartService from '../../services/cartService';

// ── Async thunks ──────────────────────────────────────────────────────────────
export const fetchCart = createAsyncThunk(
  'cart/fetch',
  async (_, { rejectWithValue }) => {
    try { return await cartService.getCart(); }
    catch (err) { return rejectWithValue(err.message); }
  }
);

export const addToCart = createAsyncThunk(
  'cart/add',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try { return await cartService.addToCart(productId, quantity); }
    catch (err) { return rejectWithValue(err.message); }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/update',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try { return await cartService.updateItem(productId, quantity); }
    catch (err) { return rejectWithValue(err.message); }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/remove',
  async (productId, { rejectWithValue }) => {
    try { return await cartService.removeItem(productId); }
    catch (err) { return rejectWithValue(err.message); }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clear',
  async (_, { rejectWithValue }) => {
    try { return await cartService.clearCart(); }
    catch (err) { return rejectWithValue(err.message); }
  }
);

// ── Helper: derive totals from items array ────────────────────────────────────
const deriveTotals = (cart) => ({
  items:      cart?.items      ?? [],
  totalItems: cart?.totalItems ?? 0,
  totalPrice: cart?.totalPrice ?? 0,
});

// ── Slice ─────────────────────────────────────────────────────────────────────
const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items:      [],
    totalItems: 0,
    totalPrice: 0,
    loading:    false,
    error:      null,
  },

  reducers: {
    clearCartError: (state) => { state.error = null; },
    // Called on logout to wipe local cart state
    resetCart: (state) => {
      state.items      = [];
      state.totalItems = 0;
      state.totalPrice = 0;
    },
  },

  extraReducers: (builder) => {
    // Shared pending / rejected handlers
    const pending  = (state) => { state.loading = true;  state.error = null; };
    const rejected = (state, { payload }) => { state.loading = false; state.error = payload; };
    const fulfilled = (state, { payload }) => {
      state.loading = false;
      Object.assign(state, deriveTotals(payload));
    };

    builder
      .addCase(fetchCart.pending,      pending)
      .addCase(fetchCart.fulfilled,    fulfilled)
      .addCase(fetchCart.rejected,     rejected)

      .addCase(addToCart.pending,      pending)
      .addCase(addToCart.fulfilled,    fulfilled)
      .addCase(addToCart.rejected,     rejected)

      .addCase(updateCartItem.pending,  pending)
      .addCase(updateCartItem.fulfilled, fulfilled)
      .addCase(updateCartItem.rejected,  rejected)

      .addCase(removeFromCart.pending,  pending)
      .addCase(removeFromCart.fulfilled, fulfilled)
      .addCase(removeFromCart.rejected,  rejected)

      .addCase(clearCart.pending,      pending)
      .addCase(clearCart.fulfilled,    fulfilled)
      .addCase(clearCart.rejected,     rejected);
  },
});

export const { clearCartError, resetCart } = cartSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectCartItems      = (state) => state.cart.items;
export const selectCartTotalItems = (state) => state.cart.totalItems;
export const selectCartTotalPrice = (state) => state.cart.totalPrice;
export const selectCartLoading    = (state) => state.cart.loading;
export const selectCartError      = (state) => state.cart.error;

export default cartSlice.reducer;
