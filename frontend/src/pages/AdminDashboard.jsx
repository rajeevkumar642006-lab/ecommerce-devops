/**
 * AdminDashboard.jsx  —  Admin control panel
 *
 * Tabs:
 *   Overview   — KPI stat cards + recent orders table
 *   Products   — paginated product table with add/edit/delete
 *   Orders     — all orders with status update controls
 *   Users      — user list (read-only in this view)
 *
 * All data is fetched directly via services (not Redux) so the admin
 * view always shows fresh server state without polluting the user-facing
 * product/order slices.
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import productService from '../services/productService';
import orderService   from '../services/orderService';
import api            from '../services/api';
import Loader         from '../components/common/Loader';

// ── Constants ─────────────────────────────────────────────────────────────────
const TABS = ['Overview', 'Products', 'Orders', 'Users'];

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS = {
  pending:    { bg: '#fef9c3', color: '#a16207' },
  processing: { bg: '#dbeafe', color: '#1d4ed8' },
  shipped:    { bg: '#e0f2fe', color: '#0369a1' },
  delivered:  { bg: '#dcfce7', color: '#15803d' },
  cancelled:  { bg: '#fee2e2', color: '#b91c1c' },
};

// ── Shared sub-components ─────────────────────────────────────────────────────

/** KPI stat card */
const StatCard = ({ icon, label, value, sub, color = 'var(--primary)' }) => (
  <div style={{ ...styles.statCard, borderTop: `4px solid ${color}` }} className="card">
    <div style={styles.statIcon}>{icon}</div>
    <div>
      <p style={styles.statLabel}>{label}</p>
      <p style={{ ...styles.statValue, color }}>{value}</p>
      {sub && <p style={styles.statSub}>{sub}</p>}
    </div>
  </div>
);

/** Status badge */
const StatusBadge = ({ status }) => {
  const s = STATUS_COLORS[status] || { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '.2rem .65rem', borderRadius: '999px', fontSize: '.75rem', fontWeight: 600 }}>
      {status}
    </span>
  );
};

/** Confirmation modal */
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Confirm action">
    <div style={styles.modal}>
      <p style={{ fontWeight: 600, marginBottom: '1rem' }}>{message}</p>
      <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
        <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger btn-sm"  onClick={onConfirm}>Confirm</button>
      </div>
    </div>
  </div>
);

// ── Overview Tab ──────────────────────────────────────────────────────────────
const OverviewTab = () => {
  const [stats,   setStats]   = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersRes, productsRes, usersRes] = await Promise.all([
          orderService.getAllOrders({ limit: 5, page: 1 }),
          productService.getProducts({ limit: 1 }),
          api.get('/users'),
        ]);
        setOrders(ordersRes.data?.orders || []);
        setStats({
          totalOrders:   ordersRes.meta?.total   || 0,
          totalProducts: productsRes.meta?.total || 0,
          totalUsers:    usersRes.data?.meta?.total || 0,
          revenue: (ordersRes.data?.orders || [])
            .filter(o => o.status !== 'cancelled')
            .reduce((s, o) => s + o.totalPrice, 0),
        });
      } catch (err) {
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader text="Loading overview…" />;

  return (
    <div>
      {/* KPI cards */}
      <div style={styles.statsGrid}>
        <StatCard icon="📦" label="Total Orders"   value={stats?.totalOrders}   color="var(--primary)" />
        <StatCard icon="🛍" label="Total Products" value={stats?.totalProducts} color="#7c3aed" />
        <StatCard icon="👥" label="Total Users"    value={stats?.totalUsers}    color="#0891b2" />
        <StatCard icon="💰" label="Revenue (non-cancelled)" value={`₹${(stats?.revenue || 0).toLocaleString('en-IN')}`} color="var(--success)" />
      </div>

      {/* Recent orders */}
      <div style={styles.tableCard} className="card">
        <h3 style={styles.tableTitle}>Recent Orders</h3>
        {orders.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No orders yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Order #</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id} style={styles.tr}>
                    <td style={styles.td}><span style={{ fontWeight: 600, fontSize: '.85rem' }}>{o.orderNumber}</span></td>
                    <td style={styles.td}>{o.user?.name || '—'}</td>
                    <td style={styles.td}>₹{o.totalPrice.toLocaleString('en-IN')}</td>
                    <td style={styles.td}><StatusBadge status={o.status} /></td>
                    <td style={styles.td} style={{ color: 'var(--text-muted)', fontSize: '.82rem' }}>
                      {new Date(o.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Products Tab ──────────────────────────────────────────────────────────────
const EMPTY_PRODUCT = { name: '', description: '', price: '', stock: '', category: '', brand: '', isFeatured: false };

const ProductsTab = () => {
  const [products,  setProducts]  = useState([]);
  const [meta,      setMeta]      = useState({ total: 0, pages: 1 });
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState(EMPTY_PRODUCT);
  const [deleteId,  setDeleteId]  = useState(null);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productService.getProducts({ page, limit: 10 });
      setProducts(res.data?.products || []);
      setMeta(res.meta || { total: 0, pages: 1 });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm(EMPTY_PRODUCT); setEditId(null); setFormError(''); setShowForm(true); };
  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description, price: p.price, stock: p.stock, category: p.category?._id || p.category || '', brand: p.brand || '', isFeatured: p.isFeatured });
    setEditId(p._id);
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.price || !form.stock) {
      setFormError('Name, description, price and stock are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
      if (editId) {
        await productService.update(editId, payload);
        toast.success('Product updated');
      } else {
        await productService.create(payload);
        toast.success('Product created');
      }
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await productService.remove(deleteId);
      toast.success('Product deleted');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err.message);
      setDeleteId(null);
    }
  };

  return (
    <div>
      {deleteId && (
        <ConfirmModal
          message="Delete this product? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {/* Product form modal */}
      {showForm && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-label={editId ? 'Edit product' : 'Add product'}>
          <div style={{ ...styles.modal, maxWidth: '560px', width: '100%' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>{editId ? 'Edit Product' : 'Add New Product'}</h3>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleSave}>
              <div style={styles.twoCol}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <input className="form-input" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required style={{ resize: 'vertical' }} />
              </div>
              <div style={styles.twoCol}>
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock *</label>
                  <input className="form-input" type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Category ID</label>
                <input className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="MongoDB ObjectId" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
                <input type="checkbox" id="featured" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} />
                <label htmlFor="featured" style={{ fontSize: '.9rem', cursor: 'pointer' }}>Featured product</label>
              </div>
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Save Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '.88rem' }}>{meta.total} products total</p>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Product</button>
      </div>

      {loading ? <Loader text="Loading products…" /> : (
        <>
          <div style={{ overflowX: 'auto' }} className="card">
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Price</th>
                  <th style={styles.th}>Stock</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Featured</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={{ fontWeight: 600, fontSize: '.9rem' }}>{p.name}</span>
                      {!p.isActive && <span style={{ marginLeft: '.4rem', fontSize: '.72rem', color: 'var(--danger)' }}>(inactive)</span>}
                    </td>
                    <td style={styles.td}>₹{p.price.toLocaleString('en-IN')}</td>
                    <td style={{ ...styles.td, color: p.stock === 0 ? 'var(--danger)' : p.stock < 5 ? 'var(--secondary)' : 'var(--success)', fontWeight: 600 }}>{p.stock}</td>
                    <td style={styles.td}>{p.category?.name || '—'}</td>
                    <td style={styles.td}>{p.isFeatured ? '⭐' : '—'}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '.4rem' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-sm" style={{ background: '#fee2e2', color: 'var(--danger)', border: 'none' }} onClick={() => setDeleteId(p._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.pages > 1 && (
            <div style={styles.pagination}>
              <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>← Prev</button>
              <span style={{ fontSize: '.88rem', color: 'var(--text-muted)' }}>Page {page} / {meta.pages}</span>
              <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= meta.pages}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Orders Tab ────────────────────────────────────────────────────────────────
const OrdersTab = () => {
  const [orders,  setOrders]  = useState([]);
  const [meta,    setMeta]    = useState({ total: 0, pages: 1 });
  const [page,    setPage]    = useState(1);
  const [filter,  setFilter]  = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // orderId being updated

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filter) params.status = filter;
      const res = await orderService.getAllOrders(params);
      setOrders(res.data?.orders || []);
      setMeta(res.meta || { total: 0, pages: 1 });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await orderService.updateStatus(orderId, newStatus);
      toast.success(`Order status updated to "${newStatus}"`);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          className="form-input"
          style={{ width: 'auto', minWidth: '160px' }}
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(1); }}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <span style={{ color: 'var(--text-muted)', fontSize: '.88rem' }}>{meta.total} orders</span>
      </div>

      {loading ? <Loader text="Loading orders…" /> : (
        <>
          <div style={{ overflowX: 'auto' }} className="card">
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Order #</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Payment</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id} style={styles.tr}>
                    <td style={styles.td}><span style={{ fontWeight: 600, fontSize: '.82rem' }}>{o.orderNumber}</span></td>
                    <td style={styles.td}>
                      <div style={{ fontSize: '.88rem' }}>{o.user?.name || '—'}</div>
                      <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{o.user?.email}</div>
                    </td>
                    <td style={styles.td}>₹{o.totalPrice.toLocaleString('en-IN')}</td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '.82rem' }}>{o.paymentMethod.toUpperCase()}</span>
                      <br />
                      <span style={{ fontSize: '.75rem', color: o.isPaid ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                        {o.isPaid ? '✓ Paid' : '✗ Unpaid'}
                      </span>
                    </td>
                    <td style={styles.td}><StatusBadge status={o.status} /></td>
                    <td style={{ ...styles.td, color: 'var(--text-muted)', fontSize: '.8rem' }}>
                      {new Date(o.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td style={styles.td}>
                      {o.status !== 'delivered' && o.status !== 'cancelled' ? (
                        <select
                          className="form-input"
                          style={{ fontSize: '.82rem', padding: '.3rem .5rem', width: 'auto' }}
                          value={o.status}
                          disabled={updating === o._id}
                          onChange={e => handleStatusChange(o._id, e.target.value)}
                          aria-label={`Update status for order ${o.orderNumber}`}
                        >
                          {ORDER_STATUSES.filter(s => s !== 'cancelled' || o.status === 'pending').map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.pages > 1 && (
            <div style={styles.pagination}>
              <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>← Prev</button>
              <span style={{ fontSize: '.88rem', color: 'var(--text-muted)' }}>Page {page} / {meta.pages}</span>
              <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= meta.pages}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Users Tab ─────────────────────────────────────────────────────────────────
const UsersTab = () => {
  const [users,   setUsers]   = useState([]);
  const [meta,    setMeta]    = useState({ total: 0, pages: 1 });
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', { params: { page, limit: 15 } });
      setUsers(res.data?.data?.users || []);
      setMeta(res.data?.meta || { total: 0, pages: 1 });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDeactivate = async () => {
    try {
      await api.delete(`/users/${deleteId}`);
      toast.success('User deactivated');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err.message);
      setDeleteId(null);
    }
  };

  return (
    <div>
      {deleteId && (
        <ConfirmModal
          message="Deactivate this user? They will no longer be able to log in."
          onConfirm={handleDeactivate}
          onCancel={() => setDeleteId(null)}
        />
      )}

      <p style={{ color: 'var(--text-muted)', fontSize: '.88rem', marginBottom: '1rem' }}>{meta.total} users total</p>

      {loading ? <Loader text="Loading users…" /> : (
        <>
          <div style={{ overflowX: 'auto' }} className="card">
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Joined</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} style={styles.tr}>
                    <td style={styles.td}><span style={{ fontWeight: 600 }}>{u.name}</span></td>
                    <td style={styles.td}>{u.email}</td>
                    <td style={styles.td}>
                      <span style={{ background: u.role === 'admin' ? '#ede9fe' : '#f3f4f6', color: u.role === 'admin' ? '#7c3aed' : '#374151', padding: '.15rem .55rem', borderRadius: '999px', fontSize: '.75rem', fontWeight: 600 }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ color: u.isActive ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: '.85rem' }}>
                        {u.isActive ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: 'var(--text-muted)', fontSize: '.82rem' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td style={styles.td}>
                      {u.isActive && u.role !== 'admin' ? (
                        <button
                          className="btn btn-sm"
                          style={{ background: '#fee2e2', color: 'var(--danger)', border: 'none', fontSize: '.8rem' }}
                          onClick={() => setDeleteId(u._id)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.pages > 1 && (
            <div style={styles.pagination}>
              <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>← Prev</button>
              <span style={{ fontSize: '.88rem', color: 'var(--text-muted)' }}>Page {page} / {meta.pages}</span>
              <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= meta.pages}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Root AdminDashboard component ─────────────────────────────────────────────
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview');

  const renderTab = () => {
    switch (activeTab) {
      case 'Overview':  return <OverviewTab />;
      case 'Products':  return <ProductsTab />;
      case 'Orders':    return <OrdersTab />;
      case 'Users':     return <UsersTab />;
      default:          return null;
    }
  };

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '.25rem' }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>Manage your store</p>
          </div>
        </div>

        {/* Tab bar */}
        <nav style={styles.tabBar} role="tablist" aria-label="Dashboard sections">
          {TABS.map(tab => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              style={{
                ...styles.tabBtn,
                ...(activeTab === tab ? styles.tabBtnActive : {}),
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'Overview'  && '📊 '}
              {tab === 'Products'  && '🛍 '}
              {tab === 'Orders'    && '📦 '}
              {tab === 'Users'     && '👥 '}
              {tab}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div style={styles.tabContent} role="tabpanel">
          {renderTab()}
        </div>
      </div>
    </div>
  );
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const styles = {
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  tabBar:       { display: 'flex', gap: '.25rem', borderBottom: '2px solid var(--border)', marginBottom: '1.5rem', overflowX: 'auto' },
  tabBtn:       { background: 'none', border: 'none', padding: '.65rem 1.1rem', fontSize: '.9rem', fontWeight: 500, color: 'var(--text-muted)', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: '-2px', whiteSpace: 'nowrap', transition: 'color .15s' },
  tabBtnActive: { color: 'var(--primary)', borderBottomColor: 'var(--primary)', fontWeight: 700 },
  tabContent:   { minHeight: '400px' },
  statsGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  statCard:     { padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' },
  statIcon:     { fontSize: '2rem' },
  statLabel:    { fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: '.15rem' },
  statValue:    { fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 },
  statSub:      { fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.2rem' },
  tableCard:    { padding: '1.25rem' },
  tableTitle:   { fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' },
  table:        { width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' },
  thead:        { background: '#f8fafc' },
  th:           { padding: '.65rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' },
  tr:           { borderBottom: '1px solid var(--border)', transition: 'background .1s' },
  td:           { padding: '.7rem 1rem', verticalAlign: 'middle' },
  pagination:   { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '.75rem', marginTop: '1.25rem' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
  modal:        { background: '#fff', borderRadius: 'var(--radius)', padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,.2)', width: '100%', maxWidth: '420px' },
  twoCol:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
};

export default AdminDashboard;
