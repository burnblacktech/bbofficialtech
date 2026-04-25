import React from 'react';
import { motion } from 'framer-motion';
import useCountUp from '../../hooks/useCountUp';
import { formatCurrency, formatCompact } from '../../utils/formatCurrency';

/**
 * MetricCard — Displays a financial metric with count-up animation.
 *
 * @param {string} label - Metric label (e.g., "Total Income")
 * @param {number} value - Raw numeric value
 * @param {string} [prefix='₹'] - Currency prefix
 * @param {import('lucide-react').LucideIcon} [icon] - Optional Lucide icon
 * @param {{ direction: 'up'|'down'|'flat', label: string }} [trend] - Trend indicator
 * @param {boolean} [animate=true] - Enable count-up animation
 */
export default function MetricCard({ label, value, prefix = '₹', icon: Icon, trend, animate = true }) {
  const { value: animatedValue } = useCountUp(animate ? value : value, animate ? 600 : 0);
  const displayValue = animate ? animatedValue : value;

  const formattedFull = formatCurrency(displayValue);
  const formattedCompact = formatCompact(displayValue);
  const isCompact = Math.abs(displayValue) >= 1_00_000;

  const trendColor =
    trend?.direction === 'up'
      ? 'text-[var(--color-success)]'
      : trend?.direction === 'down'
        ? 'text-[var(--color-error)]'
        : 'text-[var(--text-muted)]';

  const trendArrow =
    trend?.direction === 'up' ? '↑' : trend?.direction === 'down' ? '↓' : '→';

  return (
    <motion.div
      className="rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] p-5 transition-shadow hover:shadow-[var(--shadow-md)]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          {label}
        </span>
        {Icon && <Icon size={18} className="text-[var(--text-light)]" />}
      </div>

      <div
        className="font-mono text-2xl font-bold text-[var(--text-primary)] tabular-nums"
        title={isCompact ? formattedFull : undefined}
      >
        {isCompact ? formattedCompact : formattedFull}
      </div>

      {trend && (
        <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          <span>{trendArrow}</span>
          <span>{trend.label}</span>
        </div>
      )}
    </motion.div>
  );
}
