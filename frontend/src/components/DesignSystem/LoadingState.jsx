// =====================================================
// LOADING STATE COMPONENT
// Standardized loading indicators for async operations
// =====================================================

import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * LoadingState - Standardized loading indicator
 * @param {Object} props
 * @param {string} props.message - Optional loading message
 * @param {string} props.size - Size: 'sm' | 'md' | 'lg' (default: 'md')
 * @param {boolean} props.fullScreen - Whether to show full screen overlay
 * @param {string} props.variant - Variant: 'spinner' | 'skeleton' | 'dots' (default: 'spinner')
 */
export const LoadingState = ({
  message = 'Loading...',
  size = 'md',
  fullScreen = false,
  variant = 'spinner',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const spinner = (
    <Loader2
      className={`${sizeClasses[size]} animate-spin text-primary-500 ${className}`}
      aria-label="Loading"
    />
  );

  if (variant === 'skeleton') {
    return (
      <div className={`animate-pulse ${fullScreen ? 'fixed inset-0 bg-white/80 z-50 flex items-center justify-center' : ''}`}>
        <div className="space-y-4 w-full">
          <div className="h-4 bg-slate-200 rounded-xl w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded-xl"></div>
          <div className="h-4 bg-slate-200 rounded-xl w-5/6"></div>
        </div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`flex items-center justify-center gap-2 ${fullScreen ? 'fixed inset-0 bg-white/80 z-50' : ''}`}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-primary-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
        {message && <span className="ml-2 text-body-regular text-slate-600">{message}</span>}
      </div>
    );
  }

  // Default spinner variant
  const content = (
    <div className={`flex flex-col items-center justify-center gap-2 ${fullScreen ? 'fixed inset-0 bg-white/80 z-50' : ''}`}>
      {spinner}
      {message && <p className="text-body-regular text-slate-600">{message}</p>}
    </div>
  );

  return content;
};

/**
 * SkeletonLoader - For content placeholders
 */
export const SkeletonLoader = ({ lines = 3, className = '' }) => {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-200 rounded-xl"
          style={{ width: i === lines - 1 ? '75%' : '100%' }}
        />
      ))}
    </div>
  );
};

/**
 * InlineLoader - Small inline loading indicator
 */
export const InlineLoader = ({ size = 'sm', className = '' }) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <Loader2
      className={`${sizeClasses[size]} animate-spin text-primary-500 inline-block ${className}`}
      aria-label="Loading"
    />
  );
};

export default LoadingState;

