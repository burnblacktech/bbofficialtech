// =====================================================
// LOADING SPINNER COMPONENT
// Reusable loading spinner with optional message
// =====================================================

import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`} role="status" aria-live="polite">
      <Loader2 className={`${sizeClasses[size]} text-primary-500 animate-spin`} aria-label="Loading" />
      {message && (
        <p className="mt-4 text-body-small text-slate-600">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;

