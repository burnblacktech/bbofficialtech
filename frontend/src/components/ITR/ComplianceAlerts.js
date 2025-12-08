// =====================================================
// COMPLIANCE ALERTS COMPONENT
// Real-time validation and ITR eligibility checks
// Compact design with dismissible warnings
// =====================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XCircle, X, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

const ComplianceAlerts = ({
  alerts = [],
  onDismiss,
  className = '',
}) => {
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  const handleDismiss = (alertId) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    onDismiss?.(alertId);
  };

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  if (visibleAlerts.length === 0) return null;

  const getAlertConfig = (type) => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-error-50',
          border: 'border-error-200',
          text: 'text-error-900',
          icon: XCircle,
        };
      case 'warning':
        return {
          bg: 'bg-warning-50',
          border: 'border-warning-200',
          text: 'text-warning-900',
          icon: AlertTriangle,
        };
      default:
        return {
          bg: 'bg-info-50',
          border: 'border-info-200',
          text: 'text-info-900',
          icon: Info,
        };
    }
  };

  return (
    <div className={cn('w-full space-y-2', className)}>
      <AnimatePresence>
        {visibleAlerts.map((alert) => {
          const config = getAlertConfig(alert.type);
          const Icon = config.icon;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className={cn(
                'rounded-lg border-2 p-3 flex items-start gap-2.5',
                config.bg,
                config.border,
              )}
            >
              <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', config.text)} />
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-semibold mb-0.5', config.text)}>
                  {alert.title}
                </p>
                {alert.message && (
                  <p className={cn('text-xs', config.text, 'opacity-80')}>
                    {alert.message}
                  </p>
                )}
              </div>
              {alert.type !== 'error' && (
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className={cn('p-1 rounded hover:bg-black/5 transition-colors flex-shrink-0', config.text)}
                  aria-label="Dismiss alert"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ComplianceAlerts;

