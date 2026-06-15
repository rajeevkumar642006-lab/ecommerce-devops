/**
 * OrdersPage.jsx  —  User's order history list
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import orderService from '../services/orderService';
import { useState } from 'react';
import Loader from '../components/common/Loader';

const STATUS_COLORS = {
  pending:    { bg: '#fef9c3', color: '#a16207' },
  processing: { bg: '#dbeafe', color: '#1d4ed8' },
  shipped:    { bg: '#e0f2fe', color: '#0369a1' },
  delivered:  { bg: '#dcfce7', color: '#15803d' },
  cancelled:  { bg: '#fee2e2', color: '#b91c1c' },
};

const OrdersPage = () => {
  const [orders,  setOrders]  = useState([]);
  const [meta,    setMeta]    = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [page,    setPage]    = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await orderService.getMyOrders({ page, limit: 10 });
        setOrders(res.data?.orders || []);
        setMeta(res.meta || { total: 0, page: 1, pages: 1 });
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">My Orders</h1>

        {loading && <Loader text="Loading orders…" />}
        {error   && <div className="alert alert-error" role="alert">{error}</div>}

        {!loading && orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <p style={{ fontSize: '3rem' }}>📦</p>
            <h2 style={{ marginBottom: '.5rem' }}>No orders yet</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              When you place an order, it will appear here.
            </p>
            <Link to="/products" className="btn btn-primary">Start Shopping</Link>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <>
            <div style={styles.list}>
              {orders.map((order) => {
                const statusStyle = STATUS_COLORS[order.status] || {};
                return (
                  <article key={order._id} style={styles.card} className="card">
                    <div style={styles.cardHeader}>
                      <div>
                        <p style={styles.orderNum}>{order.orderNumber}</p>
                        <p style={styles.orderDate}>
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span style={{ ...styles.statusBadge, background: statusStyle.bg, color: statusStyle.color }}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>

                    <div style={styles.cardBody}>
                      <div style={styles.itemsPreview}>
                        {order.items.slice(0, 3).map((item, i) => (
                          <span key={i} style={styles.itemChip}>{item.name} ×{item.quantity}</span>
                        ))}
                        {order.items.length > 3 && (
                          <span style={styles.itemChip}>+{order.items.length - 3} more</span>
                        )}
                      </div>

                      <div style={styles.cardFooter}>
                        <div>
                          <p style={styles.totalLabel}>Total</p>
                          <p style={styles.totalValue}>₹{order.totalPrice.toLocaleString('en-IN')}</p>
                        </div>
                        <Link to={`/orders/${order._id}`} className="btn btn-outline btn-sm">
                          View Details →
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination */}
            {meta.pages > 1 && (
              <nav style={styles.pagination} aria-label="Orders pagination">
                <button className="btn btn-outline btn-sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>← Prev</button>
                <span style={{ padding: '.35rem .75rem', fontSize: '.9rem' }}>Page {page} of {meta.pages}</span>
                <button className="btn btn-outline btn-sm" onClick={() => setPage((p) => p + 1)} disabled={page >= meta.pages}>Next →</button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  list:        { display: 'flex', flexDirection: 'column', gap: '1rem' },
  card:        { padding: '1.25rem' },
  cardHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' },
  orderNum:    { fontWeight: 700, fontSize: '1rem' },
  orderDate:   { color: 'var(--text-muted)', fontSize: '.85rem' },
  statusBadge: { padding: '.25rem .75rem', borderRadius: '999px', fontSize: '.8rem', fontWeight: 600 },
  cardBody:    {},
  itemsPreview:{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '.75rem' },
  itemChip:    { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px', padding: '.2rem .5rem', fontSize: '.8rem', color: 'var(--text-muted)' },
  cardFooter:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:  { fontSize: '.8rem', color: 'var(--text-muted)' },
  totalValue:  { fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary)' },
  pagination:  { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '.75rem', marginTop: '2rem' },
};

export default OrdersPage;
