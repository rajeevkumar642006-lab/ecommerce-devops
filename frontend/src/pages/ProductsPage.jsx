/**
 * ProductsPage.jsx  —  Paginated, filterable product listing
 *
 * URL query params are the source of truth for filters so the page is
 * shareable and the browser back button works correctly.
 *
 * Layout: sidebar filter (desktop) | product grid | pagination
 */

import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
  fetchProducts,
  selectProducts,
  selectProductMeta,
  selectProductLoading,
  selectProductError,
} from '../store/slices/productSlice';
import { addToCart }        from '../store/slices/cartSlice';
import { selectIsLoggedIn } from '../store/slices/authSlice';

import ProductCard   from '../components/product/ProductCard';
import ProductFilter from '../components/product/ProductFilter';
import Loader        from '../components/common/Loader';

const ProductsPage = () => {
  const dispatch      = useDispatch();
  const navigate      = useNavigate();
  const [params, setParams] = useSearchParams();
  const products  = useSelector(selectProducts);
  const meta      = useSelector(selectProductMeta);
  const loading   = useSelector(selectProductLoading);
  const error     = useSelector(selectProductError);
  const isLoggedIn = useSelector(selectIsLoggedIn);

  // Derive filter state from URL params
  const filters = {
    search:   params.get('search')   || '',
    sort:     params.get('sort')     || 'newest',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    inStock:  params.get('inStock')  || '',
    page:     parseInt(params.get('page') || '1', 10),
  };

  // Fetch whenever URL params change
  useEffect(() => {
    const query = {};
    if (filters.search)   query.search   = filters.search;
    if (filters.sort)     query.sort     = filters.sort;
    if (filters.minPrice) query.minPrice = filters.minPrice;
    if (filters.maxPrice) query.maxPrice = filters.maxPrice;
    if (filters.inStock)  query.inStock  = filters.inStock;
    query.page  = filters.page;
    query.limit = 12;
    dispatch(fetchProducts(query));
  }, [dispatch, params]);  // eslint-disable-line react-hooks/exhaustive-deps

  const updateFilter = useCallback((key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    next.set('page', '1'); // reset to page 1 on filter change
    setParams(next);
  }, [params, setParams]);

  const resetFilters = () => setParams({});

  const goToPage = (page) => {
    const next = new URLSearchParams(params);
    next.set('page', String(page));
    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (productId) => {
    if (!isLoggedIn) { navigate('/login'); return; }
    const result = await dispatch(addToCart({ productId, quantity: 1 }));
    if (addToCart.fulfilled.match(result)) toast.success('Added to cart!');
    else toast.error(result.payload || 'Could not add to cart');
  };

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">
          {filters.search ? `Results for "${filters.search}"` : 'All Products'}
        </h1>

        <div style={styles.layout}>
          {/* Sidebar */}
          <ProductFilter
            filters={filters}
            onChange={updateFilter}
            onReset={resetFilters}
          />

          {/* Main content */}
          <div style={styles.main}>
            {/* Result count */}
            {!loading && (
              <p style={styles.count}>
                {meta.total} product{meta.total !== 1 ? 's' : ''} found
              </p>
            )}

            {loading && <Loader text="Loading products…" />}

            {error && (
              <div className="alert alert-error" role="alert">{error}</div>
            )}

            {!loading && !error && products.length === 0 && (
              <div style={styles.empty}>
                <p style={{ fontSize: '3rem' }}>🔍</p>
                <p style={{ fontWeight: 600, marginBottom: '.5rem' }}>No products found</p>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Try adjusting your filters or search term.
                </p>
                <button className="btn btn-outline" onClick={resetFilters}>Clear Filters</button>
              </div>
            )}

            {!loading && products.length > 0 && (
              <>
                <div className="grid-products">
                  {products.map((p) => (
                    <ProductCard key={p._id} product={p} onAddToCart={handleAddToCart} />
                  ))}
                </div>

                {/* Pagination */}
                {meta.pages > 1 && (
                  <nav style={styles.pagination} aria-label="Pagination">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => goToPage(filters.page - 1)}
                      disabled={filters.page <= 1}
                      aria-label="Previous page"
                    >
                      ← Prev
                    </button>

                    {Array.from({ length: meta.pages }, (_, i) => i + 1)
                      .filter((p) => Math.abs(p - filters.page) <= 2)
                      .map((p) => (
                        <button
                          key={p}
                          className={`btn btn-sm ${p === filters.page ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => goToPage(p)}
                          aria-label={`Page ${p}`}
                          aria-current={p === filters.page ? 'page' : undefined}
                        >
                          {p}
                        </button>
                      ))}

                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => goToPage(filters.page + 1)}
                      disabled={filters.page >= meta.pages}
                      aria-label="Next page"
                    >
                      Next →
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  layout:     { display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' },
  main:       { flex: 1, minWidth: 0 },
  count:      { color: 'var(--text-muted)', fontSize: '.88rem', marginBottom: '1rem' },
  empty:      { textAlign: 'center', padding: '4rem 1rem' },
  pagination: { display: 'flex', gap: '.5rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' },
};

export default ProductsPage;
