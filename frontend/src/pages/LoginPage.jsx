/**
 * LoginPage.jsx  —  User login form
 *
 * On success: redirects to the page the user was trying to reach,
 * or to "/" if they navigated directly to /login.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import {
  loginUser,
  clearError,
  selectAuthLoading,
  selectAuthError,
  selectIsLoggedIn,
} from '../store/slices/authSlice';
import { fetchCart } from '../store/slices/cartSlice';

const LoginPage = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();
  const loading    = useSelector(selectAuthLoading);
  const error      = useSelector(selectAuthError);
  const isLoggedIn = useSelector(selectIsLoggedIn);

  const redirectTo = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });

  // If already logged in, redirect away
  useEffect(() => {
    if (isLoggedIn) navigate(redirectTo, { replace: true });
  }, [isLoggedIn, navigate, redirectTo]);

  // Clear stale errors when component mounts
  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      dispatch(fetchCart());
      toast.success(`Welcome back, ${result.payload.user.name.split(' ')[0]}!`);
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <div className="page" style={styles.page}>
      <div style={styles.card} className="card">
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.sub}>Sign in to your ShopHub account</p>

        {error && (
          <div className="alert alert-error" role="alert">{error}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              autoComplete="email"
              aria-required="true"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              aria-required="true"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>Create one free</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page:  { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem 1rem' },
  card:  { width: '100%', maxWidth: '420px', padding: '2.5rem 2rem' },
  title: { fontSize: '1.6rem', fontWeight: 700, marginBottom: '.25rem', textAlign: 'center' },
  sub:   { color: 'var(--text-muted)', fontSize: '.9rem', textAlign: 'center', marginBottom: '1.5rem' },
  footer:{ textAlign: 'center', marginTop: '1.25rem', fontSize: '.9rem', color: 'var(--text-muted)' },
  link:  { color: 'var(--primary)', fontWeight: 500 },
};

export default LoginPage;
