/**
 * RegisterPage.jsx  —  New account registration form
 *
 * Client-side validation mirrors the backend rules:
 *  • Name: 2–50 chars
 *  • Email: valid format
 *  • Password: ≥8 chars, uppercase, lowercase, digit
 *  • Confirm password: must match
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import {
  registerUser,
  clearError,
  selectAuthLoading,
  selectAuthError,
  selectIsLoggedIn,
} from '../store/slices/authSlice';

// ── Client-side validation ────────────────────────────────────────────────────
const validate = ({ name, email, password, confirmPassword }) => {
  const errs = {};
  if (!name || name.trim().length < 2)          errs.name = 'Name must be at least 2 characters';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email';
  if (!password || password.length < 8)         errs.password = 'Password must be at least 8 characters';
  else if (!/[A-Z]/.test(password))             errs.password = 'Password needs an uppercase letter';
  else if (!/[a-z]/.test(password))             errs.password = 'Password needs a lowercase letter';
  else if (!/\d/.test(password))                errs.password = 'Password needs a number';
  if (password !== confirmPassword)             errs.confirmPassword = 'Passwords do not match';
  return errs;
};

const RegisterPage = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const loading    = useSelector(selectAuthLoading);
  const apiError   = useSelector(selectAuthError);
  const isLoggedIn = useSelector(selectIsLoggedIn);

  const [form, setForm]     = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => { if (isLoggedIn) navigate('/', { replace: true }); }, [isLoggedIn, navigate]);
  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear field error on change
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }

    const result = await dispatch(registerUser(form));
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created! Welcome to ShopHub 🎉');
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="page" style={styles.page}>
      <div style={styles.card} className="card">
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.sub}>Join ShopHub and start shopping</p>

        {apiError && (
          <div className="alert alert-error" role="alert">{apiError}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input id="name" name="name" type="text" className="form-input"
              value={form.name} onChange={handleChange}
              placeholder="Jane Doe" autoComplete="name" aria-required="true"
              aria-describedby={errors.name ? 'name-err' : undefined}
            />
            {errors.name && <span id="name-err" className="form-error" role="alert">{errors.name}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <input id="reg-email" name="email" type="email" className="form-input"
              value={form.email} onChange={handleChange}
              placeholder="you@example.com" autoComplete="email" aria-required="true"
              aria-describedby={errors.email ? 'email-err' : undefined}
            />
            {errors.email && <span id="email-err" className="form-error" role="alert">{errors.email}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input id="reg-password" name="password" type="password" className="form-input"
              value={form.password} onChange={handleChange}
              placeholder="Min 8 chars, uppercase, number" autoComplete="new-password" aria-required="true"
              aria-describedby={errors.password ? 'pw-err' : undefined}
            />
            {errors.password && <span id="pw-err" className="form-error" role="alert">{errors.password}</span>}
          </div>

          {/* Confirm password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" className="form-input"
              value={form.confirmPassword} onChange={handleChange}
              placeholder="Repeat your password" autoComplete="new-password" aria-required="true"
              aria-describedby={errors.confirmPassword ? 'cpw-err' : undefined}
            />
            {errors.confirmPassword && <span id="cpw-err" className="form-error" role="alert">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading} aria-busy={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page:  { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '2rem 1rem' },
  card:  { width: '100%', maxWidth: '440px', padding: '2.5rem 2rem' },
  title: { fontSize: '1.6rem', fontWeight: 700, marginBottom: '.25rem', textAlign: 'center' },
  sub:   { color: 'var(--text-muted)', fontSize: '.9rem', textAlign: 'center', marginBottom: '1.5rem' },
  footer:{ textAlign: 'center', marginTop: '1.25rem', fontSize: '.9rem', color: 'var(--text-muted)' },
  link:  { color: 'var(--primary)', fontWeight: 500 },
};

export default RegisterPage;
