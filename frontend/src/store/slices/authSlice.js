/**
 * authSlice.js  —  Redux Toolkit slice for authentication state
 *
 * State shape:
 *   user    — user object from the API (null when logged out)
 *   token   — JWT string (also persisted in localStorage)
 *   loading — true while an async auth operation is in flight
 *   error   — last error message string (null when no error)
 *
 * Async thunks:
 *   loginUser(credentials)
 *   registerUser(formData)
 *   logoutUser()
 *   fetchCurrentUser()
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

// ── Helpers ───────────────────────────────────────────────────────────────────
const persistAuth = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user',  JSON.stringify(user));
};

const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// ── Async thunks ──────────────────────────────────────────────────────────────
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const result = await authService.login(credentials);
      persistAuth(result.token, result.user);
      return result;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      const result = await authService.register(formData);
      persistAuth(result.token, result.user);
      return result;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors — always clear local state
    } finally {
      clearAuth();
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getMe();
    } catch (err) {
      clearAuth();
      return rejectWithValue(err.message);
    }
  }
);

// ── Initial state (rehydrate from localStorage) ───────────────────────────────
const storedUser  = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');

const initialState = {
  user:    storedUser  ? JSON.parse(storedUser) : null,
  token:   storedToken || null,
  loading: false,
  error:   null,
};

// ── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    clearError: (state) => { state.error = null; },
    // Allows other slices (e.g. cart) to update the stored user
    setUser:    (state, action) => { state.user = action.payload; },
  },

  extraReducers: (builder) => {
    // ── login ──────────────────────────────────────────────────────────────
    builder
      .addCase(loginUser.pending,  (state) => { state.loading = true;  state.error = null; })
      .addCase(loginUser.fulfilled,(state, { payload }) => {
        state.loading = false;
        state.user    = payload.user;
        state.token   = payload.token;
      })
      .addCase(loginUser.rejected, (state, { payload }) => {
        state.loading = false;
        state.error   = payload;
      });

    // ── register ───────────────────────────────────────────────────────────
    builder
      .addCase(registerUser.pending,  (state) => { state.loading = true;  state.error = null; })
      .addCase(registerUser.fulfilled,(state, { payload }) => {
        state.loading = false;
        state.user    = payload.user;
        state.token   = payload.token;
      })
      .addCase(registerUser.rejected, (state, { payload }) => {
        state.loading = false;
        state.error   = payload;
      });

    // ── logout ─────────────────────────────────────────────────────────────
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user  = null;
        state.token = null;
        state.error = null;
      });

    // ── fetchMe ────────────────────────────────────────────────────────────
    builder
      .addCase(fetchCurrentUser.fulfilled, (state, { payload }) => {
        state.user = payload;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user  = null;
        state.token = null;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectUser      = (state) => state.auth.user;
export const selectToken     = (state) => state.auth.token;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError   = (state) => state.auth.error;
export const selectIsAdmin   = (state) => state.auth.user?.role === 'admin';
export const selectIsLoggedIn = (state) => !!state.auth.token;

export default authSlice.reducer;
