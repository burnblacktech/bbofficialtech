// =====================================================
// FIELD VERIFICATION COMPONENT
// Field-level verification indicator inside inputs
// Per UI.md specifications (Section 4.3, lines 7329-7370)
// =====================================================

import React from 'react';
import { CheckCircle, Clock, AlertTriangle, X, PenTool, Circle } from 'lucide-react';
import { cn } from '../../../utils';
import { motion } from 'framer-motion';

/**
 * FieldVerification Component
 * Shows verification state inside input field (right side)
 */
export const FieldVerification = ({
  state = 'unverified', // 'unverified' | 'pending' | 'verified' | 'mismatch' | 'failed' | 'manual'
  verificationSource,
  errorMessage,
  className = '',
  ...props
}) => {
  const stateConfig = {
    unverified: {
      icon: Circle,
      color: 'text-slate-400',
      label: null,
    },
    pending: {
      icon: Clock,
      color: 'text-warning-500',
      label: 'Verifying',
      animate: true,
    },
    verified: {
      icon: CheckCircle,
      color: 'text-success-600',
      label: 'Verified',
    },
    mismatch: {
      icon: AlertTriangle,
      color: 'text-warning-600',
      label: 'Mismatch',
    },
    failed: {
      icon: X,
      color: 'text-error-600',
      label: 'Failed',
    },
    manual: {
      icon: PenTool,
      color: 'text-slate-500',
      label: 'Manual',
    },
  };

  const config = stateConfig[state] || stateConfig.unverified;
  const Icon = config.icon;

  const iconElement = config.animate ? (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      className="flex items-center justify-center"
    >
      <Icon className={cn(config.color, 'w-4 h-4')} />
    </motion.div>
  ) : (
    <Icon className={cn(config.color, 'w-4 h-4')} />
  );

  return (
    <div className={cn('flex flex-col', className)} {...props}>
      {/* Status Label in Header */}
      {config.label && (
        <div className="flex items-center justify-end mb-1">
          <span
            className={cn(config.color, 'text-body-sm font-medium flex items-center gap-1')}
            style={{ fontSize: '13px', fontWeight: 500 }}
          >
            {iconElement}
            <span>{config.label}</span>
          </span>
        </div>
      )}

      {/* Icon inside input (to be positioned by parent) */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {iconElement}
      </div>

      {/* Helper Text */}
      {state === 'verified' && verificationSource && (
        <p
          className="text-body-sm text-slate-600 mt-1"
          style={{ fontSize: '13px', lineHeight: '20px' }}
        >
          Verified with {verificationSource}
        </p>
      )}
      {state === 'pending' && (
        <p
          className="text-body-sm text-slate-600 mt-1"
          style={{ fontSize: '13px', lineHeight: '20px' }}
        >
          Checking with {verificationSource || 'Income Tax Department'}...
        </p>
      )}
      {(state === 'failed' || state === 'mismatch') && errorMessage && (
        <p
          className={cn(
            'text-body-sm mt-1 flex items-center gap-1',
            state === 'failed' ? 'text-error-600' : 'text-warning-600',
          )}
          style={{ fontSize: '13px', lineHeight: '20px' }}
        >
          <span>✕</span>
          <span>{errorMessage}</span>
        </p>
      )}
    </div>
  );
};

/**
 * FieldVerificationBadge Component
 * Compact badge version for field headers
 */
export const FieldVerificationBadge = ({
  state,
  className = '',
  ...props
}) => {
  const stateConfig = {
    verified: { icon: CheckCircle, color: 'text-success-600', label: 'Verified' },
    pending: { icon: Clock, color: 'text-warning-500', label: 'Verifying' },
    failed: { icon: X, color: 'text-error-600', label: 'Failed' },
    mismatch: { icon: AlertTriangle, color: 'text-warning-600', label: 'Mismatch' },
    manual: { icon: PenTool, color: 'text-slate-500', label: 'Manual' },
    unverified: { icon: Circle, color: 'text-slate-400', label: 'Unverified' },
  };

  const config = stateConfig[state] || stateConfig.unverified;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-body-sm font-medium',
        config.color,
        className,
      )}
      style={{ fontSize: '13px', fontWeight: 500 }}
      {...props}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </span>
  );
};

export default FieldVerification;

