// =====================================================
// VERIFICATION STATE COMPONENT
// Visual indicators for verification states
// Per UI.md specifications (Section 4.3, lines 7307-7415)
// =====================================================

import React from 'react';
import { CheckCircle, Clock, AlertTriangle, X, PenTool, Circle } from 'lucide-react';
import { cn } from '../../../utils';
import { motion } from 'framer-motion';

/**
 * VerificationState Component
 * Displays verification state with appropriate icon and styling
 */
export const VerificationState = ({
  state = 'unverified', // 'unverified' | 'pending' | 'verified' | 'mismatch' | 'failed' | 'manual'
  size = 'md', // 'sm' | 'md' | 'lg'
  showLabel = true,
  className = '',
  ...props
}) => {
  const stateConfig = {
    unverified: {
      icon: Circle,
      color: 'text-slate-400',
      bgColor: 'bg-slate-50',
      label: 'Unverified',
      animate: false,
    },
    pending: {
      icon: Clock,
      color: 'text-warning-500',
      bgColor: 'bg-warning-50',
      label: 'Verifying',
      animate: true,
    },
    verified: {
      icon: CheckCircle,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
      label: 'Verified',
      animate: false,
    },
    mismatch: {
      icon: AlertTriangle,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
      label: 'Mismatch',
      animate: false,
    },
    failed: {
      icon: X,
      color: 'text-error-600',
      bgColor: 'bg-error-50',
      label: 'Failed',
      animate: false,
    },
    manual: {
      icon: PenTool,
      color: 'text-slate-500',
      bgColor: 'bg-slate-50',
      label: 'Manual',
      animate: false,
    },
  };

  const config = stateConfig[state] || stateConfig.unverified;
  const Icon = config.icon;

  const sizeClasses = {
    sm: { icon: 12, text: 'text-body-xs' },
    md: { icon: 16, text: 'text-body-sm' },
    lg: { icon: 20, text: 'text-body-md' },
  };

  const iconElement = config.animate ? (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
    >
      <Icon className={cn(config.color, sizeClasses[size].text)} size={sizeClasses[size].icon} />
    </motion.div>
  ) : (
    <Icon className={cn(config.color, sizeClasses[size].text)} size={sizeClasses[size].icon} />
  );

  return (
    <div
      className={cn('inline-flex items-center gap-2', className)}
      {...props}
    >
      {iconElement}
      {showLabel && (
        <span
          className={cn(config.color, sizeClasses[size].text, 'font-medium')}
          style={{
            fontSize: size === 'sm' ? '12px' : size === 'md' ? '13px' : '14px',
            fontWeight: 500,
          }}
        >
          {config.label}
        </span>
      )}
    </div>
  );
};

export default VerificationState;

