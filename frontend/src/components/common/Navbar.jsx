/**
 * Navbar.jsx  —  Top navigation bar
 *
 * Shows:
 *  • Brand logo / name
 *  • Search bar (navigates to /products?search=...)
 *  • Cart icon with item count badge
 *  • Login / Register links when logged out
 *  • User dropdown (My Orders, Admin Dashboard, Logout) when logged in
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser, selectIsLoggedIn, selectIsAdmin, logoutUser } from '../../store/slices/authSlice';
import { selectCartTotalItems, resetCart } from '../../store/slices/cartSlice';

const Navbar = () => {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const user        = useSelector(selectUser);
  const isLoggedIn  = useSelector(selectIsLoggedIn);
  const isAdmin     = useSelector(selectIsAdmin);
  const cartCount   = useSelector(selectCartTotalItems);

  const [search,      setSearch]      = useState('');
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [dropOpen,    setDropOpen]    = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    dispatch(resetCart());
    setDropOpen(false);
    navigate('/login');
  };

  return (
    <nav style={styles.nav} role="navigation" aria-label="Main navigation">
      <div className="container" style={styles.inner}>

        {/* Brand */}
        <Link to="/" style={styles.brand}>🛒 ShopHub</Link>

        {/* Hamburger (mobile) */}
        <button
          style={styles.hamburger}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* Nav links */}
        <div style={{ ...styles.links, ...(menuOpen ? styles.linksOpen : {}) }}>

          {/* Search */}
          <form onSubmit={handleSearch} style={styles.searchForm}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              style={styles.searchInput}
              aria-label="Search products"
            />
            <button type="submit" style={styles.searchBtn} aria-label="Submit search">🔍</button>
          </form>

          <Link to="/products" style={styles.link}>Products</Link>

          {/* Cart */}
          <Link to="/cart" style={styles.cartLink} aria-label={`Cart, ${cartCount} items`}>
            🛒
            {cartCount > 0 && (
              <span style={styles.badge}>{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </Link>

          {/* Auth */}
          {isLoggedIn ? (
            <div style={styles.dropdown}>
              <button
                style={styles.userBtn}
                onClick={() => setDropOpen((o) => !o)}
                aria-haspopup="true"
                aria-expanded={dropOpen}
              >
                👤 {user?.name?.split(' ')[0]}  ▾
              </button>
              {dropOpen && (
                <div style={styles.dropMenu} role="menu">
                  <Link to="/orders"  style={styles.dropItem} onClick={() => setDropOpen(false)} role="menuitem">My Orders</Link>
                  {isAdmin && (
                    <Link to="/admin" style={styles.dropItem} onClick={() => setDropOpen(false)} role="menuitem">Admin Dashboard</Link>
                  )}
                  <button style={{ ...styles.dropItem, ...styles.logoutBtn }} onClick={handleLogout} role="menuitem">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login"    style={styles.link}>Login</Link>
              <Link to="/register" style={{ ...styles.link, ...styles.registerBtn }}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

// ── Inline styles (keeps component self-contained) ────────────────────────────
const styles = {
  nav:         { background: '#1e293b', color: '#fff', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,.3)' },
  inner:       { display: 'flex', alignItems: 'center', gap: '1rem', padding: '.75rem 1rem', flexWrap: 'wrap' },
  brand:       { fontSize: '1.3rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' },
  hamburger:   { display: 'none', background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', marginLeft: 'auto', '@media(max-width:768px)': { display: 'block' } },
  links:       { display: 'flex', alignItems: 'center', gap: '.75rem', marginLeft: 'auto', flexWrap: 'wrap' },
  linksOpen:   {},
  link:        { color: '#cbd5e1', fontSize: '.95rem', padding: '.25rem .5rem', borderRadius: '4px', transition: 'color .2s' },
  registerBtn: { background: 'var(--primary)', color: '#fff', padding: '.3rem .85rem', borderRadius: '4px' },
  searchForm:  { display: 'flex', alignItems: 'center' },
  searchInput: { padding: '.35rem .7rem', borderRadius: '4px 0 0 4px', border: 'none', fontSize: '.9rem', width: '180px', outline: 'none' },
  searchBtn:   { padding: '.35rem .6rem', background: 'var(--primary)', border: 'none', borderRadius: '0 4px 4px 0', color: '#fff', cursor: 'pointer' },
  cartLink:    { position: 'relative', color: '#cbd5e1', fontSize: '1.3rem', padding: '.1rem .3rem' },
  badge:       { position: 'absolute', top: '-6px', right: '-8px', background: 'var(--danger)', color: '#fff', borderRadius: '999px', fontSize: '.65rem', fontWeight: 700, padding: '1px 5px', minWidth: '18px', textAlign: 'center' },
  dropdown:    { position: 'relative' },
  userBtn:     { background: 'none', border: '1px solid #475569', color: '#cbd5e1', padding: '.3rem .75rem', borderRadius: '4px', fontSize: '.9rem', cursor: 'pointer' },
  dropMenu:    { position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: '#fff', borderRadius: '6px', boxShadow: '0 4px 16px rgba(0,0,0,.15)', minWidth: '160px', overflow: 'hidden', zIndex: 200 },
  dropItem:    { display: 'block', width: '100%', padding: '.65rem 1rem', color: '#1e293b', fontSize: '.9rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', transition: 'background .15s' },
  logoutBtn:   { color: 'var(--danger)' },
};

export default Navbar;
