/**
 * CartPage.jsx  —  Shopping cart
 *
 * Shows all cart items with quantity controls, line totals,
 * order summary, and a Proceed to Checkout button.
 */

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import {
  fetchCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  selectCartItems,
  selectCartTotalItems,
  selectCartTotalPrice,
  selectCartLoading,
  selectCartError,
} from '../store/slices/cartSlice';

import Loader from '../components/common/Loader';

const PLACEHOLDER = 'https://placehold.co/80x80?text=?';
const SHIPPING_FEE = 49;
const FREE_THRESHOLD = 499;

const CartPage = () => {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const items       = useSelector(selectCartItems);
  const totalItems  = useSelector(selectCartTotalItems);
  const totalPrice  = useSelector(selectCartTotalPrice);
  const loading     = useSelector(selectCartLoading);
  const error       = useSelector(selectCartError);

  useEffect(() => { dispatch(fetchCart()); }, [dispatch]);

  const handleQtyChange = async (productId, qty) => {
    if (qty < 1) return;
    const result = await dispatch(updateCartItem({ productId, quantity: qty }));
    if (updateCartItem.rejected.match(result)) toast.error(result.payload);
  };

  const handleRemove = async (productId, name) => {
    const result = await dispatch(removeFromCart(productId));
    if (removeFromCart.fulfilled.match(result)) toast.info(`${name} removed from cart`);
    else toast.error(result.payload);
  };

  const handleClear = async () => {
    if (!window.confirm('Clear your entire cart?')) return;
    await dispatch(clearCart());
    toast.info('Cart cleared');
  };

  const shipping = totalPrice >= FREE_THRESHOLD ? 0 : SHIPPING_FEE;
  const tax      = Math.round(totalPrice * 0.18 * 100) / 100;
  const orderTotal = Math.round((totalPrice + shipping + tax) * 100) / 100;

  if (loading && items.length === 0) return <div className="page"><div className="container"><Loader text="Loading cart…" /></div></div>;

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">Shopping Cart ({totalItems} item{totalItems !== 1 ? 's' : ''})</h1>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        {items.length === 0 ? (
          /* Empty state */
          <div style={styles.empty}>
            <p style={{ fontSize: '4rem' }}>🛒</p>
            <h2 style={{ marginBottom: '.5rem' }}>Your cart is empty</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Looks like you haven't added anything yet.
            </p>
            <Link to="/products" className="btn btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div style={styles.layout}>
            {/* Cart items */}
            <div style={styles.itemsCol}>
              <div style={styles.itemsHeader}>
                <span style={{ color: 'var(--text-muted)', fontSize: '.88rem' }}>
                  {totalItems} item{totalItems !== 1 ? 's' : ''}
                </span>
                <button className="btn btn-sm btn-outline" onClick={handleClear} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                  Clear Cart
                </button>
              </div>

              {items.map((item) => (
                <article key={item.product?._id || item.product} style={styles.itemCard} className="card">
                  {/* Image */}
                  <img
                    src={item.image || PLACEHOLDER}
                    alt={item.name}
                    style={styles.itemImg}
                    onError={(e) => { e.target.src = PLACEHOLDER; }}
                  />

                  {/* Details */}
                  <div style={styles.itemDetails}>
                    <Link
                      to={`/products/${item.product?._id || item.product}`}
                      style={styles.itemName}
                    >
                      {item.name}
                    </Link>
                    <p style={styles.itemPrice}>₹{item.price.toLocaleString('en-IN')} each</p>

                    {/* Quantity control */}
                    <div style={styles.qtyRow}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleQtyChange(item.product?._id || item.product, item.quantity - 1)}
                        disabled={loading || item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >−</button>
                      <span style={styles.qtyVal} aria-live="polite">{item.quantity}</span>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleQtyChange(item.product?._id || item.product, item.quantity + 1)}
                        disabled={loading}
                        aria-label="Increase quantity"
                      >+</button>
                    </div>
                  </div>

                  {/* Line total + remove */}
                  <div style={styles.itemRight}>
                    <p style={styles.lineTotal}>
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                    <button
                      className="btn btn-sm"
                      style={{ color: 'var(--danger)', background: 'none' }}
                      onClick={() => handleRemove(item.product?._id || item.product, item.name)}
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      🗑 Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Order summary */}
            <aside style={styles.summary} aria-label="Order summary">
              <h2 style={styles.summaryTitle}>Order Summary</h2>

              <div style={styles.summaryRow}>
                <span>Subtotal ({totalItems} items)</span>
                <span>₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div style={styles.summaryRow}>
                <span>Shipping</span>
                <span style={{ color: shipping === 0 ? 'var(--success)' : undefined }}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
              </div>
              <div style={styles.summaryRow}>
                <span>Tax (18% GST)</span>
                <span>₹{tax.toLocaleString('en-IN')}</span>
              </div>

              {shipping > 0 && (
                <p style={styles.freeShipNote}>
                  Add ₹{(FREE_THRESHOLD - totalPrice).toFixed(0)} more for free shipping!
                </p>
              )}

              <div style={styles.summaryTotal}>
                <span>Total</span>
                <span>₹{orderTotal.toLocaleString('en-IN')}</span>
              </div>

              <button
                className="btn btn-primary btn-full"
                style={{ marginTop: '1rem', fontSize: '1rem', padding: '.75rem' }}
                onClick={() => navigate('/checkout')}
                disabled={loading}
              >
                Proceed to Checkout →
              </button>

              <Link to="/products" style={styles.continueShopping}>
                ← Continue Shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  empty:         { textAlign: 'center', padding: '5rem 1rem' },
  layout:        { display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' },
  itemsCol:      {},
  itemsHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  itemCard:      { display: 'flex', gap: '1rem', padding: '1rem', marginBottom: '1rem', alignItems: 'flex-start' },
  itemImg:       { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 },
  itemDetails:   { flex: 1, minWidth: 0 },
  itemName:      { fontWeight: 600, fontSize: '.95rem', color: 'var(--text)', display: 'block', marginBottom: '.25rem' },
  itemPrice:     { color: 'var(--text-muted)', fontSize: '.85rem', marginBottom: '.5rem' },
  qtyRow:        { display: 'flex', alignItems: 'center', gap: '.5rem' },
  qtyVal:        { minWidth: '2rem', textAlign: 'center', fontWeight: 600 },
  itemRight:     { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.5rem', flexShrink: 0 },
  lineTotal:     { fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' },
  summary:       { background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '1.5rem', boxShadow: 'var(--shadow)', alignSelf: 'flex-start', position: 'sticky', top: '80px' },
  summaryTitle:  { fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', paddingBottom: '.75rem', borderBottom: '1px solid var(--border)' },
  summaryRow:    { display: 'flex', justifyContent: 'space-between', marginBottom: '.6rem', fontSize: '.9rem' },
  freeShipNote:  { fontSize: '.8rem', color: 'var(--secondary)', background: '#fef9c3', padding: '.4rem .6rem', borderRadius: '4px', marginBottom: '.5rem' },
  summaryTotal:  { display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', paddingTop: '.75rem', borderTop: '2px solid var(--border)', marginTop: '.5rem' },
  continueShopping: { display: 'block', textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '.88rem' },
};

export default CartPage;
