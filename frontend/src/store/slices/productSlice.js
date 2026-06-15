/**
 * productSlice.js  —  Redux Toolkit slice for product state
 *
 * State shape:
 *   products   — current page of products
 *   featured   — featured products for homepage
 *   product    — single product detail
 *   meta       — pagination metadata { total, page, pages, limit }
 *   loading    — true while fetching
 *   error      — last error message
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import productService from '../../services/productService';

// ── Async thunks ──────────────────────────────────────────────────────────────
export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (params, { rejectWithValue }) => {
    try { return await productService.getProducts(params); }
    catch (err) { return rejectWithValue(err.message); }
  }
);

export const fetchFeatured = createAsyncThunk(
  'products/fetchFeatured',
  async (_, { rejectWithValue }) => {
    try { return await productService.getFeatured(); }
    catch (err) { return rejectWithValue(err.message); }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchById',
  async (id, { rejectWithValue }) => {
    try { return await productService.getById(id); }
    catch (err) { return rejectWithValue(err.message); }
  }
);

export const createProduct = createAsyncThunk(
  'products/create',
  async (payload, { rejectWithValue }) => {
    try { return await productService.create(payload); }
    catch (err) { return rejectWithValue(err.message); }
  }
);

export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, payload }, { rejectWithValue }) => {
    try { return await productService.update(id, payload); }
    catch (err) { return rejectWithValue(err.message); }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/delete',
  async (id, { rejectWithValue }) => {
    try {
      await productService.remove(id);
      return id;
    } catch (err) { return rejectWithValue(err.message); }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const productSlice = createSlice({
  name: 'products',
  initialState: {
    products: [],
    featured: [],
    product:  null,
    meta:     { total: 0, page: 1, pages: 1, limit: 12 },
    loading:  false,
    error:    null,
  },

  reducers: {
    clearProductError:  (state) => { state.error   = null; },
    clearProductDetail: (state) => { state.product = null; },
  },

  extraReducers: (builder) => {
    const pending  = (state) => { state.loading = true;  state.error = null; };
    const rejected = (state, { payload }) => { state.loading = false; state.error = payload; };

    builder
      // fetchProducts
      .addCase(fetchProducts.pending,   pending)
      .addCase(fetchProducts.fulfilled, (state, { payload }) => {
        state.loading  = false;
        state.products = payload.data?.products ?? [];
        state.meta     = payload.meta ?? state.meta;
      })
      .addCase(fetchProducts.rejected,  rejected)

      // fetchFeatured
      .addCase(fetchFeatured.pending,   pending)
      .addCase(fetchFeatured.fulfilled, (state, { payload }) => {
        state.loading  = false;
        state.featured = payload;
      })
      .addCase(fetchFeatured.rejected,  rejected)

      // fetchProductById
      .addCase(fetchProductById.pending,   pending)
      .addCase(fetchProductById.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.product = payload;
      })
      .addCase(fetchProductById.rejected,  rejected)

      // createProduct
      .addCase(createProduct.pending,   pending)
      .addCase(createProduct.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.products.unshift(payload);
      })
      .addCase(createProduct.rejected,  rejected)

      // updateProduct
      .addCase(updateProduct.pending,   pending)
      .addCase(updateProduct.fulfilled, (state, { payload }) => {
        state.loading  = false;
        const idx = state.products.findIndex((p) => p._id === payload._id);
        if (idx >= 0) state.products[idx] = payload;
        if (state.product?._id === payload._id) state.product = payload;
      })
      .addCase(updateProduct.rejected,  rejected)

      // deleteProduct
      .addCase(deleteProduct.pending,   pending)
      .addCase(deleteProduct.fulfilled, (state, { payload: id }) => {
        state.loading  = false;
        state.products = state.products.filter((p) => p._id !== id);
      })
      .addCase(deleteProduct.rejected,  rejected);
  },
});

export const { clearProductError, clearProductDetail } = productSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectProducts       = (state) => state.products.products;
export const selectFeatured       = (state) => state.products.featured;
export const selectProduct        = (state) => state.products.product;
export const selectProductMeta    = (state) => state.products.meta;
export const selectProductLoading = (state) => state.products.loading;
export const selectProductError   = (state) => state.products.error;

export default productSlice.reducer;
