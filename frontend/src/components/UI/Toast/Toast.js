// =====================================================
// TOAST COMPONENT
// Toast notifications with auto-dismiss and stacking
// =====================================================

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../../utils';

const Toast = ({
  id,
  type = 'info',
  message,
  action,
  duration = 5000,
  onDismiss,
  ...props
}) => {
  const [progress, setProgress] = useState(100);

  const config = {
    success: {
      icon: CheckCircle,
      borderColor: 'border-l-success-500',
      iconColor: 'text-success-500',
      actionColor: 'text-success-600 hover:text-success-700',
    },
    error: {
      icon: AlertCircle,
      borderColor: 'border-l-error-500',
      iconColor: 'text-error-500',
      actionColor: 'text-error-600 hover:text-error-700',
    },
    warning: {
      icon: AlertTriangle,
      borderColor: 'border-l-warning-500',
      iconColor: 'text-warning-500',
      actionColor: 'text-warning-600 hover:text-warning-700',
    },
    info: {
      icon: Info,
      borderColor: 'border-l-info-500',
      iconColor: 'text-info-500',
      actionColor: 'text-info-600 hover:text-info-700',
    },
  };

  const toastConfig = config[type] || config.info;
  const Icon = toastConfig.icon;
  const autoDismiss = duration;

  useEffect(() => {
    if (!autoDismiss) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / autoDismiss) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        onDismiss(id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [id, autoDismiss, onDismiss]);

  return (
    <div
      className={cn(
        'relative bg-white rounded-xl shadow-floating border-l-4 overflow-hidden w-full max-w-[400px] animate-toast-enter',
        toastConfig.borderColor,
      )}
      role="alert"
      aria-live="polite"
      {...props}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', toastConfig.iconColor)} />

        <p className="flex-1 text-body-md text-slate-700" style={{ fontSize: '14px', lineHeight: '22px' }}>
          {message}
        </p>

        {action && (
          <button
            onClick={action.onClick}
            className={cn('text-body-md font-medium', toastConfig.actionColor)}
            style={{ fontSize: '14px', fontWeight: 500 }}
          >
            {action.label}
          </button>
        )}

        <button
          onClick={() => onDismiss(id)}
          className="text-slate-400 hover:text-slate-600 flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      {autoDismiss && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100">
          <div
            className={cn('h-full transition-all', {
              'bg-success-500': type === 'success',
              'bg-error-500': type === 'error',
              'bg-warning-500': type === 'warning',
              'bg-info-500': type === 'info',
            })}
            style={{ width: `${progress}%`, transition: 'width 0.05s linear' }}
          />
        </div>
      )}
    </div>
  );
};

export const ToastContainer = ({ toasts = [], onDismiss }) => {
  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[400px]"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.slice(0, 3).map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default Toast;

