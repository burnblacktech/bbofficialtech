import React from 'react';
import { motion } from 'framer-motion';

/**
 * ProgressRing — SVG circular progress indicator with animated fill.
 *
 * @param {number} percentage - 0–100
 * @param {number} [size=120] - Diameter in px
 * @param {number} [strokeWidth=8] - Stroke width in px
 * @param {string} [color] - Override fill color
 * @param {string} [label] - Center text (defaults to percentage)
 * @param {boolean} [animate=true] - Animate on mount
 */
export default function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 8,
  color,
  label,
  animate = true,
}) {
  const clamped = Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const fillColor =
    color || (clamped >= 50 ? 'var(--readiness-fill-good)' : 'var(--readiness-fill-low)');

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--readiness-track)"
          strokeWidth={strokeWidth}
        />
        {/* Animated fill */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: animate ? circumference : offset }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: animate ? 1 : 0, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>
      <span className="absolute font-mono text-2xl font-bold text-[var(--text-primary)]">
        {label ?? `${Math.round(clamped)}%`}
      </span>
    </div>
  );
}
