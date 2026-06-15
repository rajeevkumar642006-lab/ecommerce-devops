/**
 * Footer.jsx  —  Simple site footer
 */

import { Link } from 'react-router-dom';

const Footer = () => (
  <footer style={styles.footer} role="contentinfo">
    <div className="container" style={styles.inner}>
      <p style={styles.brand}>🛒 ShopHub</p>
      <nav style={styles.links} aria-label="Footer navigation">
        <Link to="/products" style={styles.link}>Products</Link>
        <Link to="/cart"     style={styles.link}>Cart</Link>
        <Link to="/orders"   style={styles.link}>Orders</Link>
      </nav>
      <p style={styles.copy}>© {new Date().getFullYear()} ShopHub. All rights reserved.</p>
    </div>
  </footer>
);

const styles = {
  footer: { background: '#1e293b', color: '#94a3b8', marginTop: 'auto', padding: '1.5rem 0' },
  inner:  { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' },
  brand:  { color: '#fff', fontWeight: 700, fontSize: '1.1rem' },
  links:  { display: 'flex', gap: '1.25rem' },
  link:   { color: '#94a3b8', fontSize: '.9rem', transition: 'color .2s' },
  copy:   { fontSize: '.82rem' },
};

export default Footer;
