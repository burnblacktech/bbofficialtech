// =====================================================
// REFUND STATUS CARD COMPONENT
// Card component showing refund status with visual timeline
// =====================================================

import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle, TrendingUp, Building2 } from 'lucide-react';
import { formatIndianCurrency } from '../../lib/format';
import { cn } from '../../lib/utils';
import Button from '../DesignSystem/components/Button';

const RefundStatusCard = ({
  refund,
  onUpdateAccount,
  onReissueRequest,
  className = '',
}) => {
  if (!refund) {
    return null;
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'credited':
        return <CheckCircle className="h-6 w-6 text-success-500" aria-hidden="true" />;
      case 'issued':
        return <TrendingUp className="h-6 w-6 text-info-500" aria-hidden="true" />;
      case 'processing':
        return <Clock className="h-6 w-6 text-warning-500" aria-hidden="true" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-error-500" aria-hidden="true" />;
      case 'adjusted':
        return <AlertCircle className="h-6 w-6 text-gold-500" aria-hidden="true" />;
      default:
        return <Clock className="h-6 w-6 text-slate-600" aria-hidden="true" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'credited':
        return 'bg-success-50 border-success-200 text-slate-900';
      case 'issued':
        return 'bg-info-50 border-info-200 text-slate-900';
      case 'processing':
        return 'bg-warning-50 border-warning-200 text-slate-900';
      case 'failed':
        return 'bg-error-50 border-error-200 text-slate-900';
      case 'adjusted':
        return 'bg-gold-50 border-gold-200 text-slate-900';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-900';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'credited':
        return 'Refund Credited';
      case 'issued':
        return 'Refund Issued';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Refund Failed';
      case 'adjusted':
        return 'Refund Adjusted';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={cn('rounded-xl border p-6', getStatusColor(refund.status), className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon(refund.status)}
          <div>
            <h3 className="text-heading-sm font-semibold">{getStatusLabel(refund.status)}</h3>
            <p className="text-body-md text-slate-600 mt-1">
              Expected Amount: <span className="text-number-md tabular-nums">{formatIndianCurrency(refund.expectedAmount)}</span>
            </p>
          </div>
        </div>
        {refund.refundReference && (
          <div className="text-right">
            <p className="text-label-sm text-slate-500">Reference</p>
            <p className="text-body-md font-medium">{refund.refundReference}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      {refund.timeline && refund.timeline.length > 0 && (
        <div className="mb-4">
          <h4 className="text-label-md font-semibold mb-2">Timeline</h4>
          <div className="space-y-2">
            {refund.timeline.slice(-5).reverse().map((entry, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-current mt-1.5 opacity-50" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-body-md font-medium">{entry.message || entry.status}</p>
                  <p className="text-body-sm text-slate-600 mt-1">
                    {new Date(entry.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bank Account */}
      {refund.bankAccount && (
        <div className="mb-4 p-3 bg-white bg-opacity-50 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4" aria-hidden="true" />
            <p className="text-label-md font-semibold">Refund Account</p>
          </div>
          <p className="text-body-md">
            {refund.bankAccount.bankName} - {refund.bankAccount.accountNumber?.slice(-4)}
          </p>
          <p className="text-body-sm text-slate-600 mt-1">IFSC: {refund.bankAccount.ifscCode}</p>
        </div>
      )}

      {/* Interest */}
      {refund.interestAmount > 0 && (
        <div className="mb-4 p-3 bg-white bg-opacity-50 rounded-xl">
          <p className="text-label-md font-semibold mb-1">Interest on Refund</p>
          <p className="text-number-lg font-bold tabular-nums">{formatIndianCurrency(refund.interestAmount)}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {refund.status === 'failed' && (
          <>
            {onUpdateAccount && (
              <Button
                onClick={onUpdateAccount}
                className="bg-white text-current border border-current hover:bg-opacity-20"
                size="sm"
              >
                Update Account
              </Button>
            )}
            {onReissueRequest && (
              <Button
                onClick={onReissueRequest}
                className="bg-white text-current border border-current hover:bg-opacity-20"
                size="sm"
              >
                Request Re-issue
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RefundStatusCard;

