// =====================================================
// DEMAND CARD COMPONENT
// Card component showing tax demand details
// =====================================================

import React from 'react';
import { AlertCircle, Calendar, FileText, Clock, CheckCircle, XCircle, AlertTriangle, IndianRupee } from 'lucide-react';
import { cn } from '../../utils';
import Button from '../DesignSystem/components/Button';
import StatusBadge from '../DesignSystem/StatusBadge';
import { format } from 'date-fns';
import { formatIndianCurrency } from '../../lib/format';

const DemandCard = ({
  demand,
  onView,
  onPay,
  onDispute,
  className = '',
}) => {
  if (!demand) {
    return null;
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'paid':
      case 'closed':
        return {
          icon: CheckCircle,
          color: 'text-success-600',
          bgColor: 'bg-success-50',
          borderColor: 'border-success-200',
        };
      case 'partially_paid':
        return {
          icon: Clock,
          color: 'text-info-600',
          bgColor: 'bg-info-50',
          borderColor: 'border-info-200',
        };
      case 'disputed':
        return {
          icon: AlertTriangle,
          color: 'text-warning-600',
          bgColor: 'bg-warning-50',
          borderColor: 'border-warning-200',
        };
      case 'acknowledged':
        return {
          icon: Clock,
          color: 'text-info-600',
          bgColor: 'bg-info-50',
          borderColor: 'border-info-200',
        };
      case 'pending':
      default:
        return {
          icon: AlertCircle,
          color: 'text-warning-600',
          bgColor: 'bg-warning-50',
          borderColor: 'border-warning-200',
        };
    }
  };

  const statusConfig = getStatusConfig(demand.status);
  const StatusIcon = statusConfig.icon;
  const isOverdue = demand.isOverdue;
  const daysUntilDue = demand.daysUntilDue;
  const paymentProgress = demand.totalAmount > 0
    ? (demand.paidAmount / demand.totalAmount) * 100
    : 0;

  return (
    <div className={cn(
      'bg-white rounded-xl shadow-elevation-1 border p-6',
      isOverdue ? 'border-error-300' : statusConfig.borderColor,
      className,
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className={cn('p-3 rounded-xl', statusConfig.bgColor)}>
            <StatusIcon className={cn('w-6 h-6', statusConfig.color)} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-heading-4 font-semibold text-slate-900">{demand.subject}</h3>
              <StatusBadge status={demand.status} size="sm" />
            </div>
            <div className="flex flex-wrap gap-4 text-body-regular text-slate-600">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{demand.demandNumber}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Type:</span>
                <span className="capitalize">{demand.demandType.replace(/_/g, ' ')}</span>
              </div>
              {demand.assessmentYear && (
                <div>
                  <span className="font-medium">AY:</span> {demand.assessmentYear}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Amount Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-body-small text-slate-500 mb-1">Total Amount</p>
          <p className="text-body-large font-semibold text-slate-900">
            {formatIndianCurrency(demand.totalAmount)}
          </p>
        </div>
        <div>
          <p className="text-body-small text-slate-500 mb-1">Paid Amount</p>
          <p className="text-body-large font-semibold text-success-600">
            {formatIndianCurrency(demand.paidAmount)}
          </p>
        </div>
        <div>
          <p className="text-body-small text-slate-500 mb-1">Outstanding</p>
          <p className={cn(
            'text-lg font-semibold',
            demand.outstandingAmount > 0 ? 'text-error-600' : 'text-success-600',
          )}>
            {formatIndianCurrency(demand.outstandingAmount)}
          </p>
        </div>
      </div>

      {/* Payment Progress */}
      {demand.status === 'partially_paid' && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-body-small text-slate-600 mb-1">
            <span>Payment Progress</span>
            <span>{paymentProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-success-600 h-2 rounded-full transition-all"
              style={{ width: `${paymentProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-body-small text-slate-500 mb-1">Received Date</p>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            <p className="text-body-regular font-medium text-slate-900">
              {format(new Date(demand.receivedDate), 'dd MMM yyyy')}
            </p>
          </div>
        </div>
        {demand.dueDate && (
          <div>
            <p className="text-body-small text-slate-500 mb-1">Due Date</p>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-slate-400" />
              <p className={cn(
                'text-sm font-medium',
                isOverdue ? 'text-error-600' : daysUntilDue !== null && daysUntilDue <= 7 ? 'text-warning-600' : 'text-slate-900',
              )}>
                {format(new Date(demand.dueDate), 'dd MMM yyyy')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Overdue Warning */}
      {isOverdue && (
        <div className="bg-error-50 border border-error-200 p-3 rounded-xl mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-error-600" />
            <div>
              <p className="text-body-regular font-medium text-error-900">
                Overdue by {Math.abs(demand.daysUntilDue || 0)} day{Math.abs(demand.daysUntilDue || 0) !== 1 ? 's' : ''}
              </p>
              <p className="text-body-small text-error-700 mt-1">
                Please pay the outstanding amount immediately
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Due Soon Warning */}
      {!isOverdue && daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue > 0 && (
        <div className="bg-warning-50 border border-warning-200 p-3 rounded-xl mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning-600" />
            <div>
              <p className="text-body-regular font-medium text-warning-900">
                Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
              </p>
              <p className="text-body-small text-warning-700 mt-1">
                Please pay before the due date
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Status */}
      {demand.status === 'disputed' && demand.disputeStatus && (
        <div className="bg-info-50 border border-info-200 p-3 rounded-xl mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-info-600" />
            <div>
              <p className="text-body-regular font-medium text-info-900">
                Dispute Status: {demand.disputeStatus.replace(/_/g, ' ').toUpperCase()}
              </p>
              {demand.disputeReason && (
                <p className="text-body-small text-info-700 mt-1 line-clamp-2">
                  {demand.disputeReason}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {onView && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onView(demand)}
          >
            View Details
          </Button>
        )}
        {demand.outstandingAmount > 0 && demand.status !== 'disputed' && onPay && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onPay(demand)}
            icon={<IndianRupee className="w-4 h-4" />}
          >
            Pay Now
          </Button>
        )}
        {demand.status !== 'paid' && demand.status !== 'closed' && demand.status !== 'disputed' && onDispute && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onDispute(demand)}
            icon={<AlertTriangle className="w-4 h-4" />}
          >
            Dispute
          </Button>
        )}
        {demand.documentUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(demand.documentUrl, '_blank')}
            icon={<FileText className="w-4 h-4" />}
          >
            View Document
          </Button>
        )}
      </div>
    </div>
  );
};

export default DemandCard;

