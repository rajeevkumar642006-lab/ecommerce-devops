/**
 * Loader.jsx  —  Centered spinner for loading states
 *
 * Usage:
 *   <Loader />                  — full-page centered spinner
 *   <Loader size="sm" />        — small inline spinner
 *   <Loader text="Loading..." />— spinner with label
 */

const Loader = ({ size = 'md', text = '' }) => {
  const sizeMap = { sm: '1.2rem', md: '2rem', lg: '3rem' };
  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div className="spinner-center" role="status" aria-label={text || 'Loading'}>
      <div
        className="spinner"
        style={{ width: dim, height: dim }}
      />
      {text && (
        <span style={{ marginLeft: '.75rem', color: 'var(--text-muted)', fontSize: '.9rem' }}>
          {text}
        </span>
      )}
    </div>
  );
};

export default Loader;
