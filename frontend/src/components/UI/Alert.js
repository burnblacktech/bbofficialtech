// =====================================================
// ALERT COMPONENT - ENHANCED
// Alert banners and inline alerts matching design system
// =====================================================

import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const Alert = ({
  type = 'info',
  variant = 'inline', // 'inline' | 'banner'
  title,
  children,
  dismissible = false,
  onDismiss,
  className = '',
  icon: Icon,
  action,
  ...props
}) => {
  const config = {
    success: {
      bg: 'bg-success-50',
      border: 'border-success-200',
      text: 'text-success-700',
      icon: CheckCircle,
      iconColor: 'text-success-500',
    },
    error: {
      bg: 'bg-error-50',
      border: 'border-error-200',
      text: 'text-error-700',
      icon: AlertCircle,
      iconColor: 'text-error-500',
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      text: 'text-warning-700',
      icon: AlertTriangle,
      iconColor: 'text-warning-500',
    },
    info: {
      bg: 'bg-info-50',
      border: 'border-info-200',
      text: 'text-info-700',
      icon: Info,
      iconColor: 'text-info-500',
    },
  };

  const alertConfig = config[type] || config.info;
  const AlertIcon = Icon || alertConfig.icon;

  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        alertConfig.bg,
        alertConfig.border,
        variant === 'banner' && 'mb-4',
        className,
      )}
      role="alert"
      {...props}
    >
      <div className="flex items-start">
        <AlertIcon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', alertConfig.iconColor)} />
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={cn('text-heading-sm font-semibold mb-1', alertConfig.text)} style={{ fontSize: '16px', fontWeight: 600 }}>
              {title}
            </h3>
          )}
          <div className={cn('text-body-md', alertConfig.text)} style={{ fontSize: '14px', lineHeight: '22px' }}>
            {children}
          </div>
          {action && (
            <div className="mt-3">
              {action}
            </div>
          )}
        </div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className={cn('ml-4 flex-shrink-0 rounded p-1 transition-colors hover:bg-opacity-20', alertConfig.text)}
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
