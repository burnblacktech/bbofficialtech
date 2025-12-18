// =====================================================
// VERIFICATION BADGE COMPONENT
// Visual indicator for data verification status
// =====================================================

import React from 'react';
import { CheckCircle, Clock, AlertTriangle, PenTool } from 'lucide-react';
import { cn } from '../../../utils';

const VerificationBadge = ({
  status = 'pending', // 'verified' | 'pending' | 'discrepancy' | 'manual'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  ...props
}) => {
  const config = {
    verified: {
      icon: CheckCircle,
      bg: 'bg-success-100',
      text: 'text-success-600',
      iconColor: 'text-success-500',
      label: 'Verified',
    },
    pending: {
      icon: Clock,
      bg: 'bg-warning-100',
      text: 'text-warning-600',
      iconColor: 'text-warning-500',
      label: 'Pending',
    },
    discrepancy: {
      icon: AlertTriangle,
      bg: 'bg-error-100',
      text: 'text-error-600',
      iconColor: 'text-error-500',
      label: 'Discrepancy',
    },
    manual: {
      icon: PenTool,
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      iconColor: 'text-slate-500',
      label: 'Manual',
    },
  };

  const badgeConfig = config[status] || config.pending;
  const Icon = badgeConfig.icon;

  const sizeClasses = {
    sm: { icon: 12, text: 'text-label-sm', padding: 'px-2 py-0.5' },
    md: { icon: 16, text: 'text-label-md', padding: 'px-2.5 py-1' },
    lg: { icon: 20, text: 'text-label-lg', padding: 'px-3 py-1.5' },
  };

  const sizeConfig = sizeClasses[size];

  return (
    <span
      className={cn(
        'inline-flex items-center space-x-1.5 rounded-full font-medium',
        badgeConfig.bg,
        badgeConfig.text,
        sizeConfig.padding,
        className,
      )}
      {...props}
    >
      <Icon className={cn(badgeConfig.iconColor)} size={sizeConfig.icon} />
      <span className={sizeConfig.text} style={{ fontSize: size === 'sm' ? '11px' : size === 'md' ? '13px' : '14px', fontWeight: 500 }}>
        {badgeConfig.label}
      </span>
    </span>
  );
};

export default VerificationBadge;

