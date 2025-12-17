// =====================================================
// FILING STATUS BADGE COMPONENT
// Displays filing status with appropriate colors and styling
// =====================================================

import React from 'react';
import { FileText, Clock, CheckCircle, AlertCircle, XCircle, Pause } from 'lucide-react';
import InvoiceBadge from './InvoiceBadge';

const FilingStatusBadge = ({ filing, showInvoice = true, showLastUpdated = false, className = '' }) => {
  if (!filing) {
    return null;
  }

  const getStatusConfig = (status) => {
    const statusMap = {
      draft: {
        color: 'bg-slate-100 text-slate-700 border-slate-300',
        icon: FileText,
        label: 'Draft',
      },
      paused: {
        color: 'bg-warning-50 text-warning-600 border-warning-100',
        icon: Pause,
        label: 'Paused',
      },
      submitted: {
        color: 'bg-info-50 text-info-600 border-info-100',
        icon: Clock,
        label: 'Submitted',
      },
      acknowledged: {
        color: 'bg-orange-50 text-orange-600 border-orange-100',
        icon: CheckCircle,
        label: 'Acknowledged',
      },
      processed: {
        color: 'bg-success-50 text-success-600 border-success-100',
        icon: CheckCircle,
        label: 'Processed',
      },
      rejected: {
        color: 'bg-error-50 text-error-600 border-error-100',
        icon: XCircle,
        label: 'Rejected',
      },
    };

    return statusMap[status] || statusMap.draft;
  };

  const config = getStatusConfig(filing.status);
  const Icon = config.icon;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        <span>{config.label}</span>
        {filing.status === 'paused' && filing.pausedAt && (
          <span className="text-body-small opacity-75">
            ({formatDate(filing.pausedAt)})
          </span>
        )}
      </div>
      {showLastUpdated && filing.updatedAt && (
        <span className="text-body-small text-slate-500">
          Last updated: {formatDate(filing.updatedAt)}
        </span>
      )}
      {showInvoice && filing.invoice && (
        <InvoiceBadge invoice={filing.invoice} />
      )}
    </div>
  );
};

export default FilingStatusBadge;

