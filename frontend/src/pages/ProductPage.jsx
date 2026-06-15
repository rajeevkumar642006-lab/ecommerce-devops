/**
 * ProductPage.jsx  —  Single product detail page
 *
 * Sections:
 *  • Image gallery + product info (price, stock, add-to-cart)
 *  • Description tab
 *  • Customer reviews + add review form (logged-in users)
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import {
  fetchProductById,
  selectProduct,
  selectProductLoading,
  selectProductError,
  clearProductDetail,
} from '../store/slices/productSlice';
import { addToCart }        from '../store/slices/cartSlice';
import { selectIsLoggedIn, selectUser } from '../store/slices/authSlice';
import productService from '../services/productService';

import Loader from '../components/common/Loader';

const PLACEHOLDER = 'https://placehold.co/500x400?text=No+Image';

const StarRating = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: '.25rem' }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange && onChange(star)}
        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: onChange ? 'pointer' : 'default', color: star <= value ? '#f59e0b' : '#d1d5db' }}
        aria-label={`${star} star${star > 1 ? 's' : ''}`}
      >
        ★
      </button>
    ))}
  </div>
);

const ProductPage = () => {
  const { id }     = useParams();
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const product    = useSelector(selectProduct);
  const loading    = useSelector(selectProductLoading);
  const error      = useSelector(selectProductError);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user       = useSelector(selectUser);

  const [qty,           setQty]           = useState(1);
  const [activeImg,     setActiveImg]     = useState(0);
  const [reviewRating,  setReviewRating]  = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchProductById(id));
    return () => dispatch(clearProductDetail());
  }, [id, dispatch]);

  if (loading) return <div className="page"><div className="container"><Loader text="Loading product…" /></div></div>;
  if (error)   return <div className="page"><div className="container"><div className="alert alert-error">{error}</div></div></div>;
  if (!product) return null;

  const images = product.images?.length > 0 ? product.images : [{ url: PLACEHOLDER, altText: product.name }];
  const primaryImg = images[activeImg]?.url || PLACEHOLDER;

  const handleAddToCart = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    const result = await dispatch(addToCart({ productId: product._id, quantity: qty }));
    if (addToCart.fulfilled.match(result)) toast.success(`${qty} × ${product.name} added to cart!`);
    else toast.error(result.payload || 'Could not add to cart');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { navigate('/login'); return; }
    setReviewLoading(true);
    try {
      await productService.addReview(product._id, { rating: reviewRating, comment: reviewComment });
      toast.success('Review submitted!');
      setReviewComment('');
      dispatch(fetchProductById(id)); // refresh to show new review
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <div className="page">
      <div className="container">
        {/* Breadcrumb */}
        <nav style={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/" style={styles.breadLink}>Home</Link> /
          <Link to="/products" style={styles.breadLink}> Products</Link> /
          <span style={{ color: 'var(--text-muted)' }}> {product.name}</span>
        </nav>

        {/* Product detail grid */}
        <div style={styles.grid}>
          {/* Image gallery */}
          <div style={styles.gallery}>
            <img
              src={primaryImg}
              alt={images[activeImg]?.altText || product.name}
              style={styles.mainImg}
              onError={(e) => { e.target.src = PLACEHOLDER; }}
            />
            {images.length > 1 && (
              <div style={styles.thumbRow}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    style={{ ...styles.thumb, ...(i === activeImg ? styles.thumbActive : {}) }}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img src={img.url} alt={img.altText || `Image ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info panel */}
          <div style={styles.info}>
            {product.brand && <p style={styles.brand}>{product.brand}</p>}
            <h1 style={styles.name}>{product.name}</h1>

            {/* Rating summary */}
            {product.ratings?.count > 0 && (
              <div style={styles.ratingRow}>
                <StarRating value={Math.round(product.ratings.average)} />
                <span style={styles.ratingText}>
                  {product.ratings.average} ({product.ratings.count} review{product.ratings.count !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            {/* Price */}
            <div style={styles.priceRow}>
              <span style={styles.price}>₹{product.price.toLocaleString('en-IN')}</span>
              {product.comparePrice > product.price && (
                <>
                  <span style={styles.comparePrice}>₹{product.comparePrice.toLocaleString('en-IN')}</span>
                  <span style={styles.discountBadge}>{discount}% OFF</span>
                </>
              )}
            </div>

            {/* Stock */}
            <p style={{ color: product.isInStock ? 'var(--success)' : 'var(--danger)', fontWeight: 600, marginBottom: '1rem' }}>
              {product.isInStock ? `✓ In Stock (${product.stock} available)` : '✗ Out of Stock'}
            </p>

            {/* Category & tags */}
            {product.category && (
              <p style={styles.meta}>
                Category: <Link to={`/products?category=${product.category._id}`} style={{ color: 'var(--primary)' }}>{product.category.name}</Link>
              </p>
            )}
            {product.tags?.length > 0 && (
              <div style={styles.tags}>
                {product.tags.map((t) => (
                  <span key={t} className="badge badge-primary">{t}</span>
                ))}
              </div>
            )}

            {/* Quantity + Add to cart */}
            {product.isInStock && (
              <div style={styles.cartRow}>
                <div style={styles.qtyControl}>
                  <button className="btn btn-outline btn-sm" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                  <span style={styles.qtyValue} aria-live="polite">{qty}</span>
                  <button className="btn btn-outline btn-sm" onClick={() => setQty((q) => Math.min(product.stock, q + 1))} aria-label="Increase quantity">+</button>
                </div>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddToCart}>
                  🛒 Add to Cart
                </button>
              </div>
            )}

            <Link to="/cart" className="btn btn-outline btn-full" style={{ marginTop: '.75rem' }}>
              View Cart
            </Link>
          </div>
        </div>

        {/* Description */}
        <section style={styles.section} aria-label="Product description">
          <h2 style={styles.sectionTitle}>Description</h2>
          <p style={styles.description}>{product.description}</p>
        </section>

        {/* Reviews */}
        <section style={styles.section} aria-label="Customer reviews">
          <h2 style={styles.sectionTitle}>
            Customer Reviews ({product.reviews?.length || 0})
          </h2>

          {/* Review form */}
          {isLoggedIn ? (
            <form onSubmit={handleReviewSubmit} style={styles.reviewForm}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '.75rem' }}>Write a Review</h3>
              <div style={{ marginBottom: '.75rem' }}>
                <label style={{ fontSize: '.9rem', fontWeight: 500, display: 'block', marginBottom: '.35rem' }}>Your Rating</label>
                <StarRating value={reviewRating} onChange={setReviewRating} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="review-comment">Comment (optional)</label>
                <textarea
                  id="review-comment"
                  className="form-input"
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience…"
                  maxLength={1000}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={reviewLoading}>
                {reviewLoading ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          ) : (
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              <Link to="/login" style={{ color: 'var(--primary)' }}>Sign in</Link> to leave a review.
            </p>
          )}

          {/* Review list */}
          {product.reviews?.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first!</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {product.reviews?.map((review, i) => (
              <div key={i} style={styles.reviewCard}>
                <div style={styles.reviewHeader}>
                  <strong>{review.name}</strong>
                  <StarRating value={review.rating} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '.82rem' }}>
                    {new Date(review.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                {review.comment && <p style={{ fontSize: '.9rem', marginTop: '.35rem' }}>{review.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const styles = {
  breadcrumb:    { fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', display: 'flex', gap: '.35rem', alignItems: 'center', flexWrap: 'wrap' },
  breadLink:     { color: 'var(--primary)' },
  grid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' },
  gallery:       {},
  mainImg:       { width: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: 'var(--radius)', background: '#f1f5f9', marginBottom: '.75rem' },
  thumbRow:      { display: 'flex', gap: '.5rem', flexWrap: 'wrap' },
  thumb:         { width: '64px', height: '64px', border: '2px solid var(--border)', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', background: 'none', padding: 0 },
  thumbActive:   { borderColor: 'var(--primary)' },
  info:          {},
  brand:         { color: 'var(--text-muted)', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.25rem' },
  name:          { fontSize: '1.5rem', fontWeight: 700, marginBottom: '.5rem', lineHeight: 1.3 },
  ratingRow:     { display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' },
  ratingText:    { fontSize: '.88rem', color: 'var(--text-muted)' },
  priceRow:      { display: 'flex', alignItems: 'baseline', gap: '.75rem', marginBottom: '.75rem', flexWrap: 'wrap' },
  price:         { fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' },
  comparePrice:  { fontSize: '1.1rem', color: 'var(--text-muted)', textDecoration: 'line-through' },
  discountBadge: { background: '#fee2e2', color: 'var(--danger)', fontSize: '.8rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' },
  meta:          { fontSize: '.88rem', color: 'var(--text-muted)', marginBottom: '.5rem' },
  tags:          { display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1rem' },
  cartRow:       { display: 'flex', gap: '.75rem', alignItems: 'center', marginBottom: '.5rem' },
  qtyControl:    { display: 'flex', alignItems: 'center', gap: '.5rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '.2rem .5rem' },
  qtyValue:      { minWidth: '2rem', textAlign: 'center', fontWeight: 600 },
  section:       { marginBottom: '2.5rem' },
  sectionTitle:  { fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', paddingBottom: '.5rem', borderBottom: '2px solid var(--border)' },
  description:   { color: 'var(--text)', lineHeight: 1.8, whiteSpace: 'pre-wrap' },
  reviewForm:    { background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', marginBottom: '1.5rem' },
  reviewCard:    { background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' },
  reviewHeader:  { display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' },
};

export default ProductPage;
