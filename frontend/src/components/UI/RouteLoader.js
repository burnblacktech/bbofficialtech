// =====================================================
// ROUTE LOADER - Skeleton fallback for lazy-loaded routes
// =====================================================

const RouteLoader = ({ message = 'Loading...' }) => (
  <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
    <div style={{ height: 24, width: 200, background: 'var(--bb-bg-elevated, #f3f4f6)', borderRadius: 6, marginBottom: 16, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
    <div style={{ height: 14, width: 300, background: 'var(--bb-bg-elevated, #f3f4f6)', borderRadius: 4, marginBottom: 24, animation: 'skeleton-pulse 1.5s ease-in-out infinite', animationDelay: '0.2s' }} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ height: 80, background: 'var(--bb-bg-elevated, #f3f4f6)', borderRadius: 'var(--bb-radius-lg, 12px)', animation: 'skeleton-pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
    <div style={{ height: 200, background: 'var(--bb-bg-elevated, #f3f4f6)', borderRadius: 'var(--bb-radius-lg, 12px)', animation: 'skeleton-pulse 1.5s ease-in-out infinite', animationDelay: '0.5s' }} />
    <span className="sr-only">{message}</span>
  </div>
);

export default RouteLoader;
