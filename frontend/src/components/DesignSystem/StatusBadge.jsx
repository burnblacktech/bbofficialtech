// =====================================================
// ENHANCED STATUS BADGE COMPONENT
// Reusable status badge with icons, animations, and tooltips
// Supports both new API and legacy API for backward compatibility
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Info,
  AlertTriangle,
  Check,
  Loader2,
  Sparkles,
  PenTool,
  BadgeCheck,
  FileEdit,
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Legacy badge config for backward compatibility
const legacyBadgeConfig = {
  complete: {
    icon: Check,
    label: 'Complete',
    bgClass: 'bg-success-100',
    textClass: 'text-success-700',
  },
  verified: {
    icon: BadgeCheck,
    label: 'Verified',
    bgClass: 'bg-success-100',
    textClass: 'text-success-700',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    bgClass: 'bg-warning-100',
    textClass: 'text-warning-700',
  },
  error: {
    icon: XCircle,
    label: 'Error',
    bgClass: 'bg-error-100',
    textClass: 'text-error-700',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-600',
  },
  'in-progress': {
    icon: Loader2,
    label: 'In Progress',
    bgClass: 'bg-info-100',
    textClass: 'text-info-700',
    animate: true,
  },
  'auto-filled': {
    icon: Sparkles,
    label: 'Auto-filled',
    bgClass: 'bg-info-100',
    textClass: 'text-info-700',
  },
  manual: {
    icon: PenTool,
    label: 'Manual',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-600',
  },
  draft: {
    icon: FileEdit,
    label: 'Draft',
    bgClass: 'bg-yellow-100',
    textClass: 'text-yellow-700',
  },
  submitted: {
    icon: Check,
    label: 'Submitted',
    bgClass: 'bg-success-100',
    textClass: 'text-success-700',
  },
  processed: {
    icon: Check,
    label: 'Processed',
    bgClass: 'bg-success-100',
    textClass: 'text-success-700',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    bgClass: 'bg-error-100',
    textClass: 'text-error-700',
  },
  paid: {
    icon: Check,
    label: 'Paid',
    bgClass: 'bg-success-100',
    textClass: 'text-success-700',
  },
  unpaid: {
    icon: XCircle,
    label: 'Unpaid',
    bgClass: 'bg-error-100',
    textClass: 'text-error-700',
  },
  active: {
    icon: Check,
    label: 'Active',
    bgClass: 'bg-success-100',
    textClass: 'text-success-700',
  },
  inactive: {
    icon: Clock,
    label: 'Inactive',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-600',
  },
};

// New API config
const STATUS_CONFIG = {
  success: {
    icon: CheckCircle,
    colors: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      icon: 'text-emerald-600',
    },
  },
  error: {
    icon: XCircle,
    colors: {
      bg: 'bg-error-50',
      border: 'border-red-200',
      text: 'text-error-700',
      icon: 'text-error-600',
    },
  },
  warning: {
    icon: AlertTriangle,
    colors: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      icon: 'text-amber-600',
    },
  },
  info: {
    icon: Info,
    colors: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: 'text-blue-600',
    },
  },
  pending: {
    icon: Clock,
    colors: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-700',
      icon: 'text-slate-600',
    },
  },
};

const StatusBadge = ({
  // New API props
  status: statusProp,
  label,
  size: sizeProp = 'md',
  showIcon = true,
  animated = true,
  tooltip,
  className = '',
  onClick,
  // Legacy API props (for backward compatibility)
  color,
  children,
  count,
  showLabel = true,
  pulse = false,
}) => {
  // Detect if using legacy API
  const isLegacyAPI = color !== undefined || children !== undefined || count !== undefined;

  if (isLegacyAPI) {
    // Legacy API handling
    const normalizedStatus = statusProp?.toLowerCase().replace(/_/g, '-') || 'pending';
    const config = legacyBadgeConfig[normalizedStatus] || {
      icon: Clock,
      label: statusProp || 'Unknown',
      bgClass: color === 'green' ? 'bg-success-100' : color === 'red' ? 'bg-error-100' : color === 'yellow' ? 'bg-warning-100' : color === 'blue' ? 'bg-info-100' : 'bg-slate-100',
      textClass: color === 'green' ? 'text-success-700' : color === 'red' ? 'text-error-700' : color === 'yellow' ? 'text-warning-700' : color === 'blue' ? 'text-info-700' : 'text-slate-600',
    };

    const Icon = config.icon;
    const hasAnimation = config.animate || pulse;

    const sizeClasses = {
      small: 'px-2 py-0.5 text-label-sm',
      medium: 'px-2.5 py-1 text-label-md',
      large: 'px-3 py-1.5 text-label-lg',
    };

    const size = sizeProp === 'sm' ? 'small' : sizeProp === 'lg' ? 'large' : 'medium';

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium',
          config.bgClass,
          config.textClass,
          sizeClasses[size],
          pulse && 'relative',
          className,
        )}
        role="status"
        aria-label={showLabel ? (children || config.label) : undefined}
      >
        <Icon
          className={cn(
            hasAnimation && 'animate-spin',
            size === 'small' ? 'w-3 h-3' : size === 'medium' ? 'w-3.5 h-3.5' : 'w-4 h-4',
          )}
          aria-hidden="true"
        />
        {showLabel && (
          <span>
            {children || config.label}
            {count !== undefined && count > 0 && ` (${count})`}
          </span>
        )}
        {!showLabel && count !== undefined && count > 0 && <span>{count}</span>}
        {pulse && (
          <span
            className={cn(
              'absolute inset-0 rounded-full animate-ping opacity-75',
              config.bgClass,
            )}
            aria-hidden="true"
          />
        )}
      </span>
    );
  }

  // New API handling
  const config = STATUS_CONFIG[statusProp] || STATUS_CONFIG.info;
  const Icon = config.icon;
  const colors = config.colors;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const badgeContent = (
    <motion.div
      className={`
        inline-flex items-center
        ${sizeClasses[sizeProp]}
        ${colors.bg}
        ${colors.border}
        ${colors.text}
        border rounded-xl font-medium
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
        ${className}
      `}
      whileHover={onClick && animated ? { scale: 1.05 } : {}}
      whileTap={onClick && animated ? { scale: 0.95 } : {}}
      initial={animated ? { opacity: 0, scale: 0.9 } : {}}
      animate={animated ? { opacity: 1, scale: 1 } : {}}
      transition={animated ? { duration: 0.2 } : {}}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {showIcon && (
        <motion.div
          className={iconSizes[sizeProp]}
          animate={statusProp === 'pending' && animated ? { rotate: 360 } : {}}
          transition={
            statusProp === 'pending' && animated
              ? { duration: 2, repeat: Infinity, ease: 'linear' }
              : {}
          }
        >
          <Icon className={`w-full h-full ${colors.icon}`} />
        </motion.div>
      )}
      {label && <span>{label}</span>}
    </motion.div>
  );

  if (tooltip) {
    return (
      <div className="relative group">
        {badgeContent}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-body-small rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
        </div>
      </div>
    );
  }

  return badgeContent;
};

// Dot Indicator (Minimal) - for backward compatibility
export const StatusDot = ({ status, pulse = false }) => {
  const colors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    pending: 'bg-slate-300',
  };

  return (
    <span className="relative inline-flex" role="status" aria-label={`Status: ${status}`}>
      <span className={`w-2 h-2 rounded-full ${colors[status] || colors.pending}`} />
      {pulse && (
        <span
          className={`absolute inset-0 rounded-full animate-ping opacity-75 ${colors[status] || colors.pending}`}
          aria-hidden="true"
        />
      )}
    </span>
  );
};

export default StatusBadge;
