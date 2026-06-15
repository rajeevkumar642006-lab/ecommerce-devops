/**
 * AppRoutes.jsx  —  Central route table
 *
 * Route groups:
 *   Public      — accessible by anyone
 *   Private     — requires login (PrivateRoute guard)
 *   Admin       — requires admin role (AdminRoute guard)
 */

import { Routes, Route, Navigate } from 'react-router-dom';

import PrivateRoute from './PrivateRoute';
import AdminRoute   from './AdminRoute';

import HomePage        from '../pages/HomePage';
import LoginPage       from '../pages/LoginPage';
import RegisterPage    from '../pages/RegisterPage';
import ProductsPage    from '../pages/ProductsPage';
import ProductPage     from '../pages/ProductPage';
import CartPage        from '../pages/CartPage';
import CheckoutPage    from '../pages/CheckoutPage';
import OrdersPage      from '../pages/OrdersPage';
import OrderDetailPage from '../pages/OrderDetailPage';
import AdminDashboard  from '../pages/AdminDashboard';
import NotFoundPage    from '../pages/NotFoundPage';

const AppRoutes = () => (
  <Routes>
    {/* ── Public ─────────────────────────────────────────────────────── */}
    <Route path="/"          element={<HomePage />} />
    <Route path="/login"     element={<LoginPage />} />
    <Route path="/register"  element={<RegisterPage />} />
    <Route path="/products"  element={<ProductsPage />} />
    <Route path="/products/:id" element={<ProductPage />} />

    {/* ── Private ────────────────────────────────────────────────────── */}
    <Route path="/cart"     element={<PrivateRoute><CartPage /></PrivateRoute>} />
    <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
    <Route path="/orders"   element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
    <Route path="/orders/:id" element={<PrivateRoute><OrderDetailPage /></PrivateRoute>} />

    {/* ── Admin ──────────────────────────────────────────────────────── */}
    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

    {/* ── Fallback ───────────────────────────────────────────────────── */}
    <Route path="/404"  element={<NotFoundPage />} />
    <Route path="*"     element={<Navigate to="/404" replace />} />
  </Routes>
);

export default AppRoutes;
