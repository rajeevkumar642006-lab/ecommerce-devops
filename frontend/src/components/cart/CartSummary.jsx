/**
 * CartSummary.jsx  —  Order total summary panel
 *
 * Props:
 *   totalItems   — number of items
 *   totalPrice   — subtotal (sum of price × qty)
 *   onCheckout() — called when "Proceed to Checkout" is clicked
 *   loading      — disables the checkout button
 */

import { Link } from 'react-router-dom';

const SHIPPING_FEE    = 49;
const FREE_THRESHOLD  = 499;

const CartSummary = ({ totalItems, totalPrice, onCheckout, loading }) => {
  const shipping   = totalPrice >= FREE_THRESHOLD ? 0 : SHIPPING_FEE;
  const tax        = Math.round(totalPrice * 0.18 * 100) / 100;
  const orderTotal = Math.round((totalPrice + shipping + tax) * 100) / 100;

  return (
    <aside style={styles.card} aria-label="Order summary">
      <h2 style={styles.title}>Order Summary</h2>

      <div style={styles.row}>
        <span>Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
        <span>₹{totalPrice.toLocaleString('en-IN')}</span>
      </div>

      <div style={styles.row}>
        <span>Shipping</span>
        <span style={{ color: shipping === 0 ? 'var(--success)' : undefined }}>
          {shipping === 0 ? 'FREE' : `₹${shipping}`}
        </span>
      </div>

      <div style={styles.row}>
        <span>Tax (18% GST)</span>
        <span>₹{tax.toLocaleString('en-IN')}</span>
      </div>

      {shipping > 0 && (
        <p style={styles.freeNote}>
          Add ₹{(FREE_THRESHOLD - totalPrice).toFixed(0)} more for free shipping!
        </p>
      )}

      <div style={styles.total}>
        <span>Total</span>
        <span>₹{orderTotal.toLocaleString('en-IN')}</span>
      </div>

      <button
        className="btn btn-primary btn-full"
        style={{ marginTop: '1rem', padding: '.75rem', fontSize: '1rem' }}
        onClick={onCheckout}
        disabled={loading || totalItems === 0}
        aria-busy={loading}
      >
        {loading ? 'Processing…' : 'Proceed to Checkout →'}
      </button>

      <Link to="/products" style={styles.continueShopping}>
        ← Continue Shopping
      </Link>
    </aside>
  );
};

const styles = {
  card:              { background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '1.5rem', boxShadow: 'var(--shadow)', position: 'sticky', top: '80px' },
  title:             { fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', paddingBottom: '.75rem', borderBottom: '1px solid var(--border)' },
  row:               { display: 'flex', justifyContent: 'space-between', fontSize: '.9rem', marginBottom: '.6rem' },
  freeNote:          { fontSize: '.8rem', color: '#a16207', background: '#fef9c3', padding: '.4rem .6rem', borderRadius: '4px', marginBottom: '.5rem' },
  total:             { display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', paddingTop: '.75rem', borderTop: '2px solid var(--border)', marginTop: '.5rem' },
  continueShopping:  { display: 'block', textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '.85rem' },
};

export default CartSummary;
