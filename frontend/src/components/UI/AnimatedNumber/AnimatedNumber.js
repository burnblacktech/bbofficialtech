// =====================================================
// ANIMATED NUMBER COMPONENT (ENHANCED)
// Smooth number transitions with color feedback
// Features: interpolation, direction colors, compact mode
// =====================================================

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import { formatIndianCurrency, formatIndianNumber } from '../../../lib/format';

/**
 * Enhanced AnimatedNumber with smooth interpolation and visual feedback
 */
const AnimatedNumber = ({
  value = 0,
  duration = 600,
  format = 'currency', // 'currency' | 'number' | 'percent' | 'compact'
  showChange = false, // Show +/- indicator on change
  colorChange = false, // Flash green/red on increase/decrease
  prefix = '',
  suffix = '',
  className = '',
  compact = false, // Use compact format (1.5L, 2.3Cr)
  decimals = 0,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [changeDirection, setChangeDirection] = useState(null); // 'up' | 'down' | null
  const prevValueRef = useRef(value);
  const animationRef = useRef(null);
  const timeoutRef = useRef(null);

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Animate value changes
  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = typeof value === 'number' ? value : parseFloat(value) || 0;

    // Determine change direction for visual feedback
    if (colorChange && startValue !== endValue) {
      setChangeDirection(endValue > startValue ? 'up' : 'down');
      // Reset direction after animation
      timeoutRef.current = setTimeout(() => setChangeDirection(null), duration + 200);
    }

    if (startValue === endValue) {
      setDisplayValue(endValue);
      prevValueRef.current = endValue;
      return;
    }

    // Skip animation if reduced motion is preferred
    if (prefersReducedMotion) {
      setDisplayValue(endValue);
      prevValueRef.current = endValue;
      return;
    }

    // Cancel any running animation
    if (animationRef.current) {
      animationRef.current.stop();
    }

    // Use framer-motion animate for smoother interpolation
    animationRef.current = animate(startValue, endValue, {
      duration: duration / 1000,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: (latest) => {
        setDisplayValue(decimals > 0 ? latest : Math.round(latest));
      },
      onComplete: () => {
        setDisplayValue(endValue);
      },
    });

    prevValueRef.current = endValue;

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, duration, prefersReducedMotion, colorChange, decimals]);

  // Format the display value
  const formattedValue = useMemo(() => {
    const numValue = typeof displayValue === 'number' ? displayValue : parseFloat(displayValue) || 0;

    if (compact) {
      return formatCompact(numValue);
    }

    switch (format) {
      case 'currency':
        return formatIndianCurrency(numValue, compact);
      case 'number':
        return formatIndianNumber(numValue);
      case 'percent':
        return `${numValue.toFixed(decimals)}%`;
      case 'compact':
        return formatCompact(numValue);
      default:
        return decimals > 0 ? numValue.toFixed(decimals) : numValue.toLocaleString('en-IN');
    }
  }, [displayValue, format, compact, decimals]);

  // Get color class based on change direction
  const colorClass = useMemo(() => {
    if (!colorChange || !changeDirection) return '';
    return changeDirection === 'up' ? 'text-emerald-600' : 'text-red-500';
  }, [colorChange, changeDirection]);

  // Change indicator
  const changeIndicator = useMemo(() => {
    if (!showChange || !changeDirection) return null;
    return changeDirection === 'up' ? '↑' : '↓';
  }, [showChange, changeDirection]);

  return (
    <motion.span
      className={`tabular-nums ${colorClass} ${className}`}
      animate={changeDirection ? {
        scale: [1, 1.05, 1],
        transition: { duration: 0.3 },
      } : {}}
      {...props}
    >
      {prefix}
      {changeIndicator && (
        <span className={`mr-0.5 ${changeDirection === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
          {changeIndicator}
        </span>
      )}
      {formattedValue}
      {suffix}
    </motion.span>
  );
};

/**
 * Format number in compact form (1.5L, 2.3Cr)
 */
function formatCompact(value) {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 10000000) {
    return `${sign}₹${(absValue / 10000000).toFixed(1)}Cr`;
  }
  if (absValue >= 100000) {
    return `${sign}₹${(absValue / 100000).toFixed(1)}L`;
  }
  if (absValue >= 1000) {
    return `${sign}₹${(absValue / 1000).toFixed(1)}K`;
  }
  return `${sign}₹${absValue.toLocaleString('en-IN')}`;
}

/**
 * Spring-based animated number (alternative implementation)
 * Uses spring physics for more natural feel
 */
export const SpringNumber = ({
  value = 0,
  format = 'currency',
  stiffness = 100,
  damping = 30,
  className = '',
  compact = false,
  ...props
}) => {
  const spring = useSpring(0, { stiffness, damping });

  useEffect(() => {
    spring.set(typeof value === 'number' ? value : parseFloat(value) || 0);
  }, [spring, value]);

  const display = useTransform(spring, (latest) => {
    if (compact) {
      return formatCompact(latest);
    }
    switch (format) {
      case 'currency':
        return formatIndianCurrency(Math.round(latest), compact);
      case 'number':
        return formatIndianNumber(Math.round(latest));
      case 'percent':
        return `${latest.toFixed(1)}%`;
      default:
        return Math.round(latest).toLocaleString('en-IN');
    }
  });

  return (
    <motion.span className={`tabular-nums ${className}`} {...props}>
      {display}
    </motion.span>
  );
};

/**
 * Currency display with trend indicator
 */
export const TrendNumber = ({
  value = 0,
  previousValue = null,
  format = 'currency',
  className = '',
  showTrend = true,
  ...props
}) => {
  const trend = useMemo(() => {
    if (previousValue === null || previousValue === value) return 'neutral';
    return value > previousValue ? 'up' : 'down';
  }, [value, previousValue]);

  const trendColor = {
    up: 'text-emerald-600',
    down: 'text-red-500',
    neutral: '',
  };

  const trendIcon = {
    up: '▲',
    down: '▼',
    neutral: '',
  };

  return (
    <span className={`inline-flex items-center gap-1 ${className}`} {...props}>
      <AnimatedNumber value={value} format={format} />
      {showTrend && trend !== 'neutral' && (
        <span className={`text-xs ${trendColor[trend]}`}>
          {trendIcon[trend]}
        </span>
      )}
    </span>
  );
};

/**
 * Comparison display (shows difference between two values)
 */
export const CompareNumber = ({
  currentValue = 0,
  compareValue = 0,
  format = 'currency',
  className = '',
  label = '',
  ...props
}) => {
  const difference = currentValue - compareValue;
  const isPositive = difference >= 0;

  return (
    <div className={`flex flex-col ${className}`} {...props}>
      <AnimatedNumber value={currentValue} format={format} className="text-lg font-bold" />
      {compareValue !== 0 && (
        <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
          {isPositive ? '+' : ''}
          <AnimatedNumber value={difference} format={format} /> vs {label}
        </span>
      )}
    </div>
  );
};

export default AnimatedNumber;
