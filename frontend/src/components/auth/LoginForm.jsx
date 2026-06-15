/**
 * LoginForm.jsx  —  Reusable login form component
 *
 * Props:
 *   onSubmit({ email, password }) — called with form values on submit
 *   loading  — disables the submit button
 *   error    — error message string to display
 */

import { useState } from 'react';

const LoginForm = ({ onSubmit, loading, error }) => {
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="alert alert-error" role="alert">{error}</div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="lf-email">Email Address</label>
        <input
          id="lf-email"
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
        <label className="form-label" htmlFor="lf-password">Password</label>
        <input
          id="lf-password"
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
  );
};

export default LoginForm;
