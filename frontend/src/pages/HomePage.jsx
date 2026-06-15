/**
 * HomePage.jsx  —  Landing page
 *
 * Sections:
 *  1. Hero banner with CTA
 *  2. Featured products grid (fetched from /api/products/featured)
 *  3. Category highlights strip
 */

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import {
  fetchFeatured,
  selectFeatured,
  selectProductLoading,
  selectProductError,
} from '../store/slices/productSlice';
import { addToCart }        from '../store/slices/cartSlice';
import { selectIsLoggedIn } from '../store/slices/authSlice';

import ProductCard from '../components/product/ProductCard';
import Loader      from '../components/common/Loader';

const CATEGORIES = [
  { label: 'Electronics',  emoji: '💻', query: 'electronics' },
  { label: 'Fashion',      emoji: '👗', query: 'fashion' },
  { label: 'Home & Living',emoji: '🏠', query: 'home' },
  { label: 'Sports',       emoji: '⚽', query: 'sports' },
];

const HomePage = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const featured   = useSelector(selectFeatured);
  const loading    = useSelector(selectProductLoading);
  const error      = useSelector(selectProductError);
  const isLoggedIn = useSelector(selectIsLoggedIn);

  useEffect(() => {
    dispatch(fetchFeatured());
  }, [dispatch]);

  const handleAddToCart = async (productId) => {
    if (!isLoggedIn) { navigate('/login'); return; }
    const result = await dispatch(addToCart({ productId, quantity: 1 }));
    if (addToCart.fulfilled.match(result)) {
      toast.success('Added to cart!');
    } else {
      toast.error(result.payload || 'Could not add to cart');
    }
  };

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section style={styles.hero} aria-label="Hero banner">
        <div className="container" style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Shop Everything You Love</h1>
          <p style={styles.heroSub}>
            Discover thousands of products at unbeatable prices, delivered to your door.
          </p>
          <div style={styles.heroBtns}>
            <Link to="/products" className="btn btn-primary" style={{ fontSize: '1rem', padding: '.7rem 2rem' }}>
              Shop Now
            </Link>
            <Link to="/register" className="btn btn-outline" style={{ fontSize: '1rem', padding: '.7rem 2rem', borderColor: '#fff', color: '#fff' }}>
              Join Free
            </Link>
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────────────── */}
      <section style={styles.section} aria-label="Browse categories">
        <div className="container">
          <h2 style={styles.sectionTitle}>Browse Categories</h2>
          <div style={styles.catGrid}>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.query}
                to={`/products?search=${cat.query}`}
                style={styles.catCard}
                aria-label={`Browse ${cat.label}`}
              >
                <span style={styles.catEmoji}>{cat.emoji}</span>
                <span style={styles.catLabel}>{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ──────────────────────────────────────────── */}
      <section style={styles.section} aria-label="Featured products">
        <div className="container">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Featured Products</h2>
            <Link to="/products" style={styles.viewAll}>View All →</Link>
          </div>

          {loading && <Loader text="Loading products…" />}

          {error && (
            <div className="alert alert-error" role="alert">{error}</div>
          )}

          {!loading && !error && featured.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              No featured products yet.
            </p>
          )}

          {!loading && featured.length > 0 && (
            <div className="grid-products">
              {featured.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Value props ────────────────────────────────────────────────── */}
      <section style={{ ...styles.section, background: 'var(--bg-card)' }} aria-label="Why shop with us">
        <div className="container">
          <div style={styles.valueGrid}>
            {[
              { icon: '🚚', title: 'Free Shipping',    desc: 'On orders above ₹499' },
              { icon: '🔒', title: 'Secure Payments',  desc: 'SSL encrypted checkout' },
              { icon: '↩️', title: 'Easy Returns',     desc: '30-day hassle-free returns' },
              { icon: '🎧', title: '24/7 Support',     desc: 'We\'re always here to help' },
            ].map((v) => (
              <div key={v.title} style={styles.valueCard}>
                <span style={styles.valueIcon}>{v.icon}</span>
                <h3 style={styles.valueTitle}>{v.title}</h3>
                <p style={styles.valueDesc}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const styles = {
  hero:         { background: 'linear-gradient(135deg, #1e293b 0%, #2563eb 100%)', color: '#fff', padding: '5rem 0' },
  heroContent:  { textAlign: 'center' },
  heroTitle:    { fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2 },
  heroSub:      { fontSize: '1.1rem', opacity: .85, marginBottom: '2rem', maxWidth: '520px', margin: '0 auto 2rem' },
  heroBtns:     { display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' },
  section:      { padding: '3.5rem 0' },
  sectionHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  sectionTitle: { fontSize: '1.4rem', fontWeight: 700 },
  viewAll:      { color: 'var(--primary)', fontSize: '.9rem', fontWeight: 500 },
  catGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' },
  catCard:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem', padding: '1.5rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', transition: 'box-shadow .2s', cursor: 'pointer' },
  catEmoji:     { fontSize: '2rem' },
  catLabel:     { fontSize: '.9rem', fontWeight: 600, color: 'var(--text)' },
  valueGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' },
  valueCard:    { textAlign: 'center', padding: '1.5rem 1rem' },
  valueIcon:    { fontSize: '2rem', display: 'block', marginBottom: '.5rem' },
  valueTitle:   { fontWeight: 700, marginBottom: '.25rem' },
  valueDesc:    { fontSize: '.88rem', color: 'var(--text-muted)' },
};

export default HomePage;
