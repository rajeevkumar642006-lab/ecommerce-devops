/**
 * RegisterForm.jsx  —  Reusable registration form component
 *
 * Props:
 *   onSubmit({ name, email, password, confirmPassword }) — called on submit
 *   loading  — disables the submit button
 *   error    — API error message string
 */

import { useState } from 'react';

const validate = ({ name, email, password, confirmPassword }) => {
  const errs = {};
  if (!name || name.trim().length < 2)          errs.name = 'Name must be at least 2 characters';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email';
  if (!password || password.length < 8)         errs.password = 'Password must be at least 8 characters';
  else if (!/[A-Z]/.test(password))             errs.password = 'Needs an uppercase letter';
  else if (!/[a-z]/.test(password))             errs.password = 'Needs a lowercase letter';
  else if (!/\d/.test(password))                errs.password = 'Needs a number';
  if (password !== confirmPassword)             errs.confirmPassword = 'Passwords do not match';
  return errs;
};

const RegisterForm = ({ onSubmit, loading, error }) => {
  const [form,   setForm]   = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }
    onSubmit(form);
  };

  const Field = ({ id, name, type = 'text', label, placeholder, autoComplete }) => (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <input
        id={id} name={name} type={type}
        className="form-input"
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-required="true"
        aria-describedby={errors[name] ? `${id}-err` : undefined}
      />
      {errors[name] && <span id={`${id}-err`} className="form-error" role="alert">{errors[name]}</span>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <Field id="rf-name"    name="name"            label="Full Name"        placeholder="Jane Doe"          autoComplete="name" />
      <Field id="rf-email"   name="email"   type="email"  label="Email Address"    placeholder="you@example.com"   autoComplete="email" />
      <Field id="rf-pw"      name="password" type="password" label="Password"      placeholder="Min 8 chars"       autoComplete="new-password" />
      <Field id="rf-cpw"     name="confirmPassword" type="password" label="Confirm Password" placeholder="Repeat password" autoComplete="new-password" />

      <button type="submit" className="btn btn-primary btn-full" disabled={loading} aria-busy={loading}>
        {loading ? 'Creating account…' : 'Create Account'}
      </button>
    </form>
  );
};

export default RegisterForm;
