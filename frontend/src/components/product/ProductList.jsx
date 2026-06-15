/**
 * ProductList.jsx  —  Renders a grid of ProductCard components
 *
 * Props:
 *   products      — array of product objects
 *   onAddToCart(productId) — optional; passed through to each card
 *   loading       — shows skeleton placeholders while true
 *   emptyMessage  — text shown when products array is empty
 */

import ProductCard from './ProductCard';
import Loader      from '../common/Loader';

const ProductList = ({
  products = [],
  onAddToCart,
  loading = false,
  emptyMessage = 'No products found.',
}) => {
  if (loading) return <Loader text="Loading products…" />;

  if (products.length === 0) {
    return (
      <div style={styles.empty}>
        <p style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🔍</p>
        <p style={{ color: 'var(--text-muted)' }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid-products" role="list" aria-label="Product list">
      {products.map((product) => (
        <div key={product._id} role="listitem">
          <ProductCard product={product} onAddToCart={onAddToCart} />
        </div>
      ))}
    </div>
  );
};

const styles = {
  empty: { textAlign: 'center', padding: '3rem 1rem' },
};

export default ProductList;
