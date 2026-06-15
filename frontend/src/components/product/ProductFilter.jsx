/**
 * ProductFilter.jsx  —  Sidebar filter panel for product listing
 *
 * Props:
 *   filters  — current filter state { search, minPrice, maxPrice, sort, inStock }
 *   onChange(key, value) — called when any filter changes
 *   onReset() — clears all filters
 */

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'name_asc',   label: 'Name A–Z' },
];

const ProductFilter = ({ filters, onChange, onReset }) => (
  <aside style={styles.aside} aria-label="Product filters">
    <div style={styles.header}>
      <h2 style={styles.title}>Filters</h2>
      <button className="btn btn-sm btn-outline" onClick={onReset}>Reset</button>
    </div>

    {/* Sort */}
    <div className="form-group">
      <label className="form-label" htmlFor="sort">Sort By</label>
      <select
        id="sort"
        className="form-input"
        value={filters.sort || 'newest'}
        onChange={(e) => onChange('sort', e.target.value)}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>

    {/* Price range */}
    <div className="form-group">
      <label className="form-label">Price Range (₹)</label>
      <div style={styles.priceRow}>
        <input
          type="number"
          className="form-input"
          placeholder="Min"
          min={0}
          value={filters.minPrice || ''}
          onChange={(e) => onChange('minPrice', e.target.value)}
          aria-label="Minimum price"
          style={{ width: '48%' }}
        />
        <input
          type="number"
          className="form-input"
          placeholder="Max"
          min={0}
          value={filters.maxPrice || ''}
          onChange={(e) => onChange('maxPrice', e.target.value)}
          aria-label="Maximum price"
          style={{ width: '48%' }}
        />
      </div>
    </div>

    {/* In stock only */}
    <div style={styles.checkRow}>
      <input
        type="checkbox"
        id="inStock"
        checked={filters.inStock === 'true'}
        onChange={(e) => onChange('inStock', e.target.checked ? 'true' : '')}
      />
      <label htmlFor="inStock" style={styles.checkLabel}>In Stock Only</label>
    </div>
  </aside>
);

const styles = {
  aside:     { background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '1.25rem', boxShadow: 'var(--shadow)', minWidth: '200px' },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  title:     { fontSize: '1rem', fontWeight: 700 },
  priceRow:  { display: 'flex', gap: '4%' },
  checkRow:  { display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' },
  checkLabel:{ fontSize: '.9rem', cursor: 'pointer' },
};

export default ProductFilter;
