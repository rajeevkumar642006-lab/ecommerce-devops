/**
 * OrderDetailPage.jsx  —  Single order detail view
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import orderService from '../services/orderService';
import Loader from '../components/common/Loader';

const PLACEHOLDER = 'https://placehold.co/60x60?text=?';

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

const STATUS_COLORS = {
  pending:    { bg: '#fef9c3', color: '#a16207' },
  processing: { bg: '#dbeafe', color: '#1d4ed8' },
  shipped:    { bg: '#e0f2fe', color: '#0369a1' },
  delivered:  { bg: '#dcfce7', color: '#15803d' },
  cancelled:  { bg: '#fee2e2', color: '#b91c1c' },
};

const OrderDetailPage = () => {
  const { id }    = useParams();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await orderService.getById(id);
        setOrder(data);
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="page"><div className="container"><Loader text="Loading order…" /></div></div>;
  if (error)   return <div className="page"><div className="container"><div className="alert alert-error">{error}</div></div></div>;
  if (!order)  return null;

  const statusStyle  = STATUS_COLORS[order.status] || {};
  const currentStep  = STATUS_STEPS.indexOf(order.status);
  const isCancelled  = order.status === 'cancelled';

  return (
    <div className="page">
      <div className="container">
        {/* Back link */}
        <Link to="/orders" style={{ color: 'var(--primary)', fontSize: '.9rem', display: 'inline-block', marginBottom: '1rem' }}>
          ← Back to Orders
        </Link>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.orderNum}>{order.orderNumber}</h1>
            <p style={styles.orderDate}>
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <span style={{ ...styles.statusBadge, background: statusStyle.bg, color: statusStyle.color }}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>

        {/* Progress tracker */}
        {!isCancelled && (
          <div style={styles.tracker} aria-label="Order progress">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} style={styles.trackerStep}>
                <div style={{
                  ...styles.trackerDot,
                  background: i <= currentStep ? 'var(--primary)' : 'var(--border)',
                  color: i <= currentStep ? '#fff' : 'var(--text-muted)',
                }}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span style={{ ...styles.trackerLabel, color: i <= currentStep ? 'var(--primary)' : 'var(--text-muted)', fontWeight: i === currentStep ? 700 : 400 }}>
                  {step.charAt(0).toUpperCase() + step.slice(1)}
                </span>
                {i < STATUS_STEPS.length - 1 && (
                  <div style={{ ...styles.trackerLine, background: i < currentStep ? 'var(--primary)' : 'var(--border)' }} />
                )}
              </div>
            ))}
          </div>
        )}

        <div style={styles.grid}>
          {/* Items */}
          <section style={styles.section} aria-label="Order items">
            <h2 style={styles.sectionTitle}>Items Ordered</h2>
            {order.items.map((item, i) => (
              <div key={i} style={styles.itemRow}>
                <img src={item.image || PLACEHOLDER} alt={item.name} style={styles.itemImg} onError={(e) => { e.target.src = PLACEHOLDER; }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600 }}>{item.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>
                    ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                  </p>
                </div>
                <p style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </section>

          <div>
            {/* Shipping address */}
            <section style={styles.section} aria-label="Shipping address">
              <h2 style={styles.sectionTitle}>Shipping Address</h2>
              <address style={{ fontStyle: 'normal', lineHeight: 1.8, fontSize: '.9rem' }}>
                <strong>{order.shippingAddress.fullName}</strong><br />
                {order.shippingAddress.street}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                {order.shippingAddress.country}
                {order.shippingAddress.phone && <><br />📞 {order.shippingAddress.phone}</>}
              </address>
            </section>

            {/* Payment & totals */}
            <section style={styles.section} aria-label="Payment summary">
              <h2 style={styles.sectionTitle}>Payment</h2>
              <p style={{ fontSize: '.9rem', marginBottom: '.75rem' }}>
                Method: <strong>{order.paymentMethod.toUpperCase()}</strong>
                {' '}
                <span style={{ color: order.isPaid ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {order.isPaid ? '✓ Paid' : '✗ Not Paid'}
                </span>
              </p>
              <div style={styles.summaryRow}><span>Items</span><span>₹{order.itemsPrice.toLocaleString('en-IN')}</span></div>
              <div style={styles.summaryRow}><span>Shipping</span><span>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</span></div>
              <div style={styles.summaryRow}><span>Tax</span><span>₹{order.taxPrice.toLocaleString('en-IN')}</span></div>
              <div style={{ ...styles.summaryRow, fontWeight: 700, fontSize: '1.05rem', borderTop: '2px solid var(--border)', paddingTop: '.5rem', marginTop: '.25rem' }}>
                <span>Total</span><span>₹{order.totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  orderNum:     { fontSize: '1.4rem', fontWeight: 700 },
  orderDate:    { color: 'var(--text-muted)', fontSize: '.88rem' },
  statusBadge:  { padding: '.3rem .9rem', borderRadius: '999px', fontSize: '.85rem', fontWeight: 600 },
  tracker:      { display: 'flex', alignItems: 'center', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '.5rem' },
  trackerStep:  { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flex: 1, minWidth: '70px' },
  trackerDot:   { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', fontWeight: 700, marginBottom: '.35rem', zIndex: 1 },
  trackerLabel: { fontSize: '.78rem', textAlign: 'center' },
  trackerLine:  { position: 'absolute', top: '16px', left: '50%', width: '100%', height: '2px', zIndex: 0 },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' },
  section:      { background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '1.25rem', boxShadow: 'var(--shadow)', marginBottom: '1.25rem' },
  sectionTitle: { fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', paddingBottom: '.5rem', borderBottom: '1px solid var(--border)' },
  itemRow:      { display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.75rem' },
  itemImg:      { width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 },
  summaryRow:   { display: 'flex', justifyContent: 'space-between', fontSize: '.9rem', marginBottom: '.4rem' },
};

export default OrderDetailPage;
