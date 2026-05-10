/**
 * Skeleton — Universal loading placeholder.
 * Uses CSS animation, no Tailwind dependency.
 */
const S = {
  base: {
    background: 'var(--bb-bg-elevated, #f3f4f6)',
    borderRadius: 'var(--bb-radius-md, 8px)',
    animation: 'skeleton-pulse 1.5s ease-in-out infinite',
  },
};

export function Skeleton({ width = '100%', height = 16, radius, style }) {
  return (
    <div
      style={{ ...S.base, width, height, borderRadius: radius || S.base.borderRadius, ...style }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function SkeletonCard({ height = 80 }) {
  return <Skeleton width="100%" height={height} radius="var(--bb-radius-lg, 12px)" />;
}

export function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
      <Skeleton width={36} height={36} radius="50%" />
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height={14} style={{ marginBottom: 6 }} />
        <Skeleton width="40%" height={10} />
      </div>
    </div>
  );
}

export function SkeletonGrid({ cols = 4, height = 80 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
      {Array.from({ length: cols }, (_, i) => <SkeletonCard key={i} height={height} />)}
    </div>
  );
}
