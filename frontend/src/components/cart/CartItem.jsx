/**
 * CartItem.jsx  —  Reusable cart line-item row
 *
 * Props:
 *   item          — cart item object { product, name, image, price, quantity }
 *   onUpdate(productId, qty)  — called when quantity changes
 *   onRemove(productId, name) — called when remove is clicked
 *   loading       — disables controls while an API call is in flight
 */

import { Link } from 'react-router-dom';

const PLACEHOLDER = 'https://placehold.co/72x72?text=?';

const CartItem = ({ item, onUpdate, onRemove, loading }) => {
  const productId = item.product?._id || item.product;

  return (
    <article style={styles.row} aria-label={`Cart item: ${item.name}`}>
      {/* Thumbnail */}
      <Link to={`/products/${productId}`} aria-label={`View ${item.name}`}>
        <img
          src={item.image || PLACEHOLDER}
          alt={item.name}
          style={styles.img}
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />
      </Link>

      {/* Details */}
      <div style={styles.details}>
        <Link to={`/products/${productId}`} style={styles.name}>{item.name}</Link>
        <p style={styles.unitPrice}>₹{item.price.toLocaleString('en-IN')} each</p>

        {/* Quantity stepper */}
        <div style={styles.qtyRow} role="group" aria-label="Quantity">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onUpdate(productId, item.quantity - 1)}
            disabled={loading || item.quantity <= 1}
            aria-label="Decrease quantity"
          >−</button>
          <span style={styles.qty} aria-live="polite">{item.quantity}</span>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onUpdate(productId, item.quantity + 1)}
            disabled={loading}
            aria-label="Increase quantity"
          >+</button>
        </div>
      </div>

      {/* Line total + remove */}
      <div style={styles.right}>
        <p style={styles.lineTotal}>
          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
        </p>
        <button
          style={styles.removeBtn}
          onClick={() => onRemove(productId, item.name)}
          disabled={loading}
          aria-label={`Remove ${item.name} from cart`}
        >
          🗑 Remove
        </button>
      </div>
    </article>
  );
};

const styles = {
  row:       { display: 'flex', gap: '1rem', padding: '1rem', alignItems: 'flex-start', borderBottom: '1px solid var(--border)' },
  img:       { width: '72px', height: '72px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 },
  details:   { flex: 1, minWidth: 0 },
  name:      { fontWeight: 600, fontSize: '.92rem', color: 'var(--text)', display: 'block', marginBottom: '.2rem' },
  unitPrice: { color: 'var(--text-muted)', fontSize: '.82rem', marginBottom: '.5rem' },
  qtyRow:    { display: 'flex', alignItems: 'center', gap: '.4rem' },
  qty:       { minWidth: '2rem', textAlign: 'center', fontWeight: 600, fontSize: '.95rem' },
  right:     { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.4rem', flexShrink: 0 },
  lineTotal: { fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' },
  removeBtn: { background: 'none', border: 'none', color: 'var(--danger)', fontSize: '.82rem', cursor: 'pointer', padding: '.2rem 0' },
};

export default CartItem;
