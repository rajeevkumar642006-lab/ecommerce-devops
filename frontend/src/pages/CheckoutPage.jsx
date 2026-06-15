/**
 * CheckoutPage.jsx  —  Order placement form
 *
 * Steps:
 *  1. Shipping address form
 *  2. Payment method selection
 *  3. Order summary review
 *  4. Place Order → calls POST /api/orders → redirects to order detail
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { selectCartItems, selectCartTotalPrice } from '../store/slices/cartSlice';
import { selectUser } from '../store/slices/authSlice';
import orderService from '../services/orderService';

const PAYMENT_METHODS = [
  { value: 'cod',  label: '💵 Cash on Delivery' },
  { value: 'card', label: '💳 Credit / Debit Card' },
  { value: 'upi',  label: '📱 UPI' },
];

const SHIPPING_FEE    = 49;
const FREE_THRESHOLD  = 499;

const CheckoutPage = () => {
  const navigate   = useNavigate();
  const items      = useSelector(selectCartItems);
  const totalPrice = useSelector(selectCartTotalPrice);
  const user       = useSelector(selectUser);

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [address, setAddress] = useState({
    fullName: user?.name || '',
    street:   '',
    city:     '',
    state:    '',
    zip:      '',
    country:  'India',
    phone:    '',
  });
  const [errors, setErrors] = useState({});

  const shipping   = totalPrice >= FREE_THRESHOLD ? 0 : SHIPPING_FEE;
  const tax        = Math.round(totalPrice * 0.18 * 100) / 100;
  const orderTotal = Math.round((totalPrice + shipping + tax) * 100) / 100;

  const handleAddressChange = (e) => {
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validateAddress = () => {
    const errs = {};
    if (!address.fullName.trim()) errs.fullName = 'Full name is required';
    if (!address.street.trim())   errs.street   = 'Street address is required';
    if (!address.city.trim())     errs.city     = 'City is required';
    if (!address.state.trim())    errs.state    = 'State is required';
    if (!address.zip.trim())      errs.zip      = 'ZIP / PIN code is required';
    return errs;
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) { toast.error('Your cart is empty'); return; }

    const fieldErrors = validateAddress();
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }

    setLoading(true);
    try {
      const order = await orderService.createOrder({
        shippingAddress: address,
        paymentMethod,
      });
      toast.success(`Order ${order.orderNumber} placed successfully! 🎉`);
      navigate(`/orders/${order._id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="page">
        <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <p style={{ fontSize: '3rem' }}>🛒</p>
          <h2>Your cart is empty</h2>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/products')}>
            Shop Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">Checkout</h1>

        <div style={styles.layout}>
          {/* Left: address + payment */}
          <div style={styles.formCol}>
            {/* Shipping address */}
            <section style={styles.section} aria-label="Shipping address">
              <h2 style={styles.sectionTitle}>📦 Shipping Address</h2>

              <div style={styles.twoCol}>
                <Field label="Full Name" name="fullName" value={address.fullName} onChange={handleAddressChange} error={errors.fullName} required />
                <Field label="Phone" name="phone" value={address.phone} onChange={handleAddressChange} type="tel" />
              </div>
              <Field label="Street Address" name="street" value={address.street} onChange={handleAddressChange} error={errors.street} required />
              <div style={styles.twoCol}>
                <Field label="City" name="city" value={address.city} onChange={handleAddressChange} error={errors.city} required />
                <Field label="State" name="state" value={address.state} onChange={handleAddressChange} error={errors.state} required />
              </div>
              <div style={styles.twoCol}>
                <Field label="ZIP / PIN Code" name="zip" value={address.zip} onChange={handleAddressChange} error={errors.zip} required />
                <Field label="Country" name="country" value={address.country} onChange={handleAddressChange} />
              </div>
            </section>

            {/* Payment method */}
            <section style={styles.section} aria-label="Payment method">
              <h2 style={styles.sectionTitle}>💳 Payment Method</h2>
              <div style={styles.paymentOptions}>
                {PAYMENT_METHODS.map((m) => (
                  <label key={m.value} style={{ ...styles.paymentOption, ...(paymentMethod === m.value ? styles.paymentSelected : {}) }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m.value}
                      checked={paymentMethod === m.value}
                      onChange={() => setPaymentMethod(m.value)}
                      style={{ marginRight: '.5rem' }}
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* Right: order summary */}
          <aside style={styles.summary} aria-label="Order summary">
            <h2 style={styles.sectionTitle}>🧾 Order Summary</h2>

            {/* Items */}
            <div style={styles.itemList}>
              {items.map((item) => (
                <div key={item.product?._id || item.product} style={styles.summaryItem}>
                  <span style={styles.summaryItemName}>{item.name} × {item.quantity}</span>
                  <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <div style={styles.divider} />

            <div style={styles.summaryRow}><span>Subtotal</span><span>₹{totalPrice.toLocaleString('en-IN')}</span></div>
            <div style={styles.summaryRow}>
              <span>Shipping</span>
              <span style={{ color: shipping === 0 ? 'var(--success)' : undefined }}>
                {shipping === 0 ? 'FREE' : `₹${shipping}`}
              </span>
            </div>
            <div style={styles.summaryRow}><span>Tax (18% GST)</span><span>₹{tax.toLocaleString('en-IN')}</span></div>

            <div style={styles.divider} />

            <div style={{ ...styles.summaryRow, fontWeight: 700, fontSize: '1.1rem' }}>
              <span>Total</span>
              <span>₹{orderTotal.toLocaleString('en-IN')}</span>
            </div>

            <button
              className="btn btn-primary btn-full"
              style={{ marginTop: '1.25rem', fontSize: '1rem', padding: '.75rem' }}
              onClick={handlePlaceOrder}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Placing Order…' : '✓ Place Order'}
            </button>

            <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '.75rem' }}>
              🔒 Secure checkout — your data is encrypted
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
};

// ── Reusable field component ──────────────────────────────────────────────────
const Field = ({ label, name, value, onChange, error, type = 'text', required }) => (
  <div className="form-group">
    <label className="form-label" htmlFor={`checkout-${name}`}>
      {label}{required && <span style={{ color: 'var(--danger)' }}> *</span>}
    </label>
    <input
      id={`checkout-${name}`}
      name={name}
      type={type}
      className="form-input"
      value={value}
      onChange={onChange}
      aria-required={required}
      aria-describedby={error ? `${name}-err` : undefined}
    />
    {error && <span id={`${name}-err`} className="form-error" role="alert">{error}</span>}
  </div>
);

const styles = {
  layout:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'flex-start' },
  formCol:         {},
  section:         { background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '1.5rem', boxShadow: 'var(--shadow)', marginBottom: '1.25rem' },
  sectionTitle:    { fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem' },
  twoCol:          { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  paymentOptions:  { display: 'flex', flexDirection: 'column', gap: '.6rem' },
  paymentOption:   { display: 'flex', alignItems: 'center', padding: '.75rem 1rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '.95rem', transition: 'border-color .2s' },
  paymentSelected: { borderColor: 'var(--primary)', background: '#eff6ff' },
  summary:         { background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '1.5rem', boxShadow: 'var(--shadow)', position: 'sticky', top: '80px' },
  itemList:        { marginBottom: '.75rem' },
  summaryItem:     { display: 'flex', justifyContent: 'space-between', fontSize: '.88rem', marginBottom: '.4rem' },
  summaryItemName: { color: 'var(--text-muted)', flex: 1, marginRight: '.5rem' },
  divider:         { borderTop: '1px solid var(--border)', margin: '.75rem 0' },
  summaryRow:      { display: 'flex', justifyContent: 'space-between', fontSize: '.9rem', marginBottom: '.5rem' },
};

export default CheckoutPage;
