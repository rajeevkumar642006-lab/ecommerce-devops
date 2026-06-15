/**
 * NotFoundPage.jsx  —  404 page
 *
 * Shown when the user navigates to a route that doesn't exist.
 * Provides clear navigation back to safety.
 */

import { Link, useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page" style={styles.page}>
      <div style={styles.content}>
        {/* Large 404 */}
        <div style={styles.code} aria-hidden="true">404</div>

        {/* Illustration */}
        <div style={styles.emoji} role="img" aria-label="Lost in space">🚀</div>

        <h1 style={styles.title}>Page Not Found</h1>
        <p style={styles.message}>
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div style={styles.actions}>
          <button
            className="btn btn-outline"
            onClick={() => navigate(-1)}
            aria-label="Go back to previous page"
          >
            ← Go Back
          </button>
          <Link to="/" className="btn btn-primary">
            🏠 Home
          </Link>
          <Link to="/products" className="btn btn-outline">
            🛍 Browse Products
          </Link>
        </div>

        {/* Quick links */}
        <div style={styles.quickLinks}>
          <p style={styles.quickTitle}>Popular pages</p>
          <div style={styles.linkRow}>
            <Link to="/login"    style={styles.quickLink}>Login</Link>
            <Link to="/register" style={styles.quickLink}>Register</Link>
            <Link to="/cart"     style={styles.quickLink}>Cart</Link>
            <Link to="/orders"   style={styles.quickLink}>My Orders</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page:       { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 130px)', padding: '2rem 1rem' },
  content:    { textAlign: 'center', maxWidth: '480px' },
  code:       { fontSize: 'clamp(5rem, 20vw, 9rem)', fontWeight: 900, color: 'var(--border)', lineHeight: 1, marginBottom: '-.5rem', userSelect: 'none' },
  emoji:      { fontSize: '3.5rem', marginBottom: '1rem', display: 'block' },
  title:      { fontSize: '1.8rem', fontWeight: 700, marginBottom: '.75rem' },
  message:    { color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.7 },
  actions:    { display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' },
  quickLinks: { borderTop: '1px solid var(--border)', paddingTop: '1.5rem' },
  quickTitle: { color: 'var(--text-muted)', fontSize: '.85rem', marginBottom: '.75rem' },
  linkRow:    { display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' },
  quickLink:  { color: 'var(--primary)', fontSize: '.9rem', fontWeight: 500 },
};

export default NotFoundPage;
