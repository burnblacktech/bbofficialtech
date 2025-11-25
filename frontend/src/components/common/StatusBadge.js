// =====================================================
// STATUS BADGE COMPONENT
// =====================================================

import React from 'react';

const StatusBadge = ({
  status,
  color = 'gray',
  size = 'medium',
  className = '',
  children,
}) => {
  const getStatusConfig = (status, color) => {
    const statusConfigs = {
      // Filing statuses
      draft: { label: 'Draft', color: 'blue', icon: '📝' },
      submitted: { label: 'Submitted', color: 'green', icon: '✅' },
      processed: { label: 'Processed', color: 'green', icon: '✅' },
      rejected: { label: 'Rejected', color: 'red', icon: '❌' },
      pending: { label: 'Pending', color: 'yellow', icon: '⏳' },
      // eslint-disable-next-line camelcase
      in_progress: { label: 'In Progress', color: 'blue', icon: '🔄' },

      // Payment statuses
      paid: { label: 'Paid', color: 'green', icon: '💰' },
      unpaid: { label: 'Unpaid', color: 'red', icon: '💳' },
      partial: { label: 'Partial', color: 'yellow', icon: '💰' },
      failed: { label: 'Failed', color: 'red', icon: '❌' },
      refunded: { label: 'Refunded', color: 'purple', icon: '↩️' },

      // User statuses
      active: { label: 'Active', color: 'green', icon: '✓' },
      inactive: { label: 'Inactive', color: 'gray', icon: '⏸️' },
      suspended: { label: 'Suspended', color: 'red', icon: '🚫' },
      verified: { label: 'Verified', color: 'green', icon: '✓' },
      unverified: { label: 'Unverified', color: 'yellow', icon: '⚠️' },

      // Ticket statuses
      open: { label: 'Open', color: 'blue', icon: '📋' },
      closed: { label: 'Closed', color: 'gray', icon: '📋' },
      cancelled: { label: 'Cancelled', color: 'red', icon: '❌' },

      // Priority levels
      low: { label: 'Low', color: 'gray', icon: '🔽' },
      medium: { label: 'Medium', color: 'yellow', icon: '🔼' },
      high: { label: 'High', color: 'orange', icon: '🔺' },
      urgent: { label: 'Urgent', color: 'red', icon: '🚨' },
    };

    const config = statusConfigs[status];
    if (config) {
      return {
        ...config,
        color: color || config.color,
      };
    }

    // Fallback for unknown status
    return {
      label: status || 'Unknown',
      color: color || 'gray',
      icon: '❓',
    };
  };

  const config = getStatusConfig(status, color);

  const sizeClasses = {
    small: 'status-badge-small',
    medium: 'status-badge-medium',
    large: 'status-badge-large',
  };

  const colorClasses = {
    blue: 'status-badge-blue',
    green: 'status-badge-green',
    yellow: 'status-badge-yellow',
    orange: 'status-badge-orange',
    red: 'status-badge-red',
    purple: 'status-badge-purple',
    gray: 'status-badge-gray',
  };

  const badgeClasses = [
    'status-badge',
    sizeClasses[size],
    colorClasses[config.color],
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={badgeClasses}>
      <span className="status-icon">{config.icon}</span>
      <span className="status-label">
        {children || config.label}
      </span>
    </span>
  );
};

export default StatusBadge;
