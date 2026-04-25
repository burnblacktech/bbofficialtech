import React from 'react';

const shimmerClass =
  'animate-pulse bg-gradient-to-r from-[var(--bg-muted)] via-[var(--bg-card-hover)] to-[var(--bg-muted)] bg-[length:200%_100%] rounded-[var(--radius-md)]';

const VARIANTS = {
  card: () => (
    <div className={`${shimmerClass} h-32 w-full rounded-[var(--radius-lg)]`} />
  ),
  'list-row': () => (
    <div className="flex items-center gap-3 py-3">
      <div className={`${shimmerClass} h-10 w-10 shrink-0 rounded-full`} />
      <div className="flex-1 space-y-2">
        <div className={`${shimmerClass} h-4 w-3/4`} />
        <div className={`${shimmerClass} h-3 w-1/2`} />
      </div>
      <div className={`${shimmerClass} h-5 w-16`} />
    </div>
  ),
  metric: () => (
    <div className={`${shimmerClass} h-24 w-full rounded-[var(--radius-lg)]`} />
  ),
  chart: () => (
    <div className={`${shimmerClass} h-48 w-full rounded-[var(--radius-lg)]`} />
  ),
  text: () => (
    <div className="space-y-2">
      <div className={`${shimmerClass} h-4 w-full`} />
      <div className={`${shimmerClass} h-4 w-5/6`} />
      <div className={`${shimmerClass} h-4 w-2/3`} />
    </div>
  ),
};

/**
 * SkeletonLoader — Placeholder loading states matching final content layout.
 *
 * @param {'card'|'list-row'|'metric'|'chart'|'text'} variant
 * @param {number} [count=1] - Number of skeleton items
 * @param {string} [className] - Additional CSS classes
 */
export default function SkeletonLoader({ variant = 'card', count = 1, className = '' }) {
  const Skeleton = VARIANTS[variant] || VARIANTS.card;

  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
