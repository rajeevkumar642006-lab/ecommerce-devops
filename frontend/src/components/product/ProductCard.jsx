/**
 * ProductCard.jsx  —  Single product tile for grid listings
 *
 * Props:
 *   product  — product object from the API
 *   onAddToCart(productId) — optional callback; if omitted the button is hidden
 */

import { Link } from 'react-router-dom';

const PLACEHOLDER = 'https://placehold.co/300x200?text=No+Image';

const ProductCard = ({ product, onAddToCart }) => {
  const {
    _id, name, price, comparePrice,
    images, ratings, stock, isInStock,
  } = product;

  const imageUrl = images?.find((i) => i.isPrimary)?.url || images?.[0]?.url || PLACEHOLDER;
  const discount = comparePrice && comparePrice > price
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  return (
    <article className="card" style={styles.card}>
      {/* Discount badge */}
      {discount > 0 && (
        <span style={styles.discountBadge}>-{discount}%</span>
      )}

      {/* Product image */}
      <Link to={`/products/${_id}`} aria-label={`View ${name}`}>
        <img
          src={imageUrl}
          alt={name}
          style={styles.image}
          loading="lazy"
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />
      </Link>

      <div style={styles.body}>
        {/* Name */}
        <Link to={`/products/${_id}`} style={styles.nameLink}>
          <h3 style={styles.name} title={name}>{name}</h3>
        </Link>

        {/* Rating */}
        {ratings?.count > 0 && (
          <div style={styles.rating} aria-label={`Rating: ${ratings.average} out of 5`}>
            {'★'.repeat(Math.round(ratings.average))}{'☆'.repeat(5 - Math.round(ratings.average))}
            <span style={styles.ratingCount}> ({ratings.count})</span>
          </div>
        )}

        {/* Price */}
        <div style={styles.priceRow}>
          <span style={styles.price}>₹{price.toLocaleString('en-IN')}</span>
          {comparePrice > price && (
            <span style={styles.comparePrice}>₹{comparePrice.toLocaleString('en-IN')}</span>
          )}
        </div>

        {/* Stock status */}
        <p style={{ ...styles.stock, color: isInStock ? 'var(--success)' : 'var(--danger)' }}>
          {isInStock ? `In Stock (${stock})` : 'Out of Stock'}
        </p>

        {/* Add to cart */}
        {onAddToCart && (
          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: '.5rem' }}
            onClick={() => onAddToCart(_id)}
            disabled={!isInStock}
            aria-label={`Add ${name} to cart`}
          >
            {isInStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        )}
      </div>
    </article>
  );
};

const styles = {
  card:         { position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', transition: 'box-shadow .2s', cursor: 'pointer' },
  discountBadge:{ position: 'absolute', top: '8px', left: '8px', background: 'var(--danger)', color: '#fff', fontSize: '.72rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', zIndex: 1 },
  image:        { width: '100%', height: '180px', objectFit: 'cover' },
  body:         { padding: '.85rem', display: 'flex', flexDirection: 'column', flex: 1 },
  nameLink:     { color: 'var(--text)' },
  name:         { fontSize: '.95rem', fontWeight: 600, marginBottom: '.3rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  rating:       { color: '#f59e0b', fontSize: '.85rem', marginBottom: '.3rem' },
  ratingCount:  { color: 'var(--text-muted)', fontSize: '.78rem' },
  priceRow:     { display: 'flex', alignItems: 'baseline', gap: '.5rem', marginBottom: '.25rem' },
  price:        { fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)' },
  comparePrice: { fontSize: '.85rem', color: 'var(--text-muted)', textDecoration: 'line-through' },
  stock:        { fontSize: '.78rem', fontWeight: 500, marginBottom: '.25rem' },
};

export default ProductCard;
