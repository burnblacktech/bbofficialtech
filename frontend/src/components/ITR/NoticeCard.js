// =====================================================
// NOTICE CARD COMPONENT
// Card component showing assessment notice details
// =====================================================

import React from 'react';
import { AlertCircle, Calendar, FileText, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils';
import Button from '../DesignSystem/components/Button';
import StatusBadge from '../DesignSystem/StatusBadge';
import { format } from 'date-fns';

const NoticeCard = ({
  notice,
  onView,
  onRespond,
  onUpdateStatus,
  className = '',
}) => {
  if (!notice) {
    return null;
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return {
          icon: CheckCircle,
          color: 'text-success-600',
          bgColor: 'bg-success-50',
          borderColor: 'border-success-200',
        };
      case 'responded':
        return {
          icon: CheckCircle,
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

  const statusConfig = getStatusConfig(notice.status);
  const StatusIcon = statusConfig.icon;
  const isOverdue = notice.isOverdue;
  const daysUntilDue = notice.daysUntilDue;

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
              <h3 className="text-heading-4 font-semibold text-slate-900">{notice.subject}</h3>
              <StatusBadge status={notice.status} size="sm" />
            </div>
            <div className="flex flex-wrap gap-4 text-body-regular text-slate-600">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{notice.noticeNumber}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Type:</span>
                <span>{notice.noticeType}</span>
              </div>
              {notice.assessmentYear && (
                <div>
                  <span className="font-medium">AY:</span> {notice.assessmentYear}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {notice.description && (
        <p className="text-body-regular text-slate-600 mb-4 line-clamp-2">{notice.description}</p>
      )}

      {/* Amount */}
      {notice.amount && (
        <div className="mb-4">
          <p className="text-body-small text-slate-500 mb-1">Amount</p>
          <p className="text-body-large font-semibold text-slate-900">
            ₹{notice.amount.toLocaleString('en-IN')}
          </p>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-body-small text-slate-500 mb-1">Received Date</p>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            <p className="text-body-regular font-medium text-slate-900">
              {format(new Date(notice.receivedDate), 'dd MMM yyyy')}
            </p>
          </div>
        </div>
        {notice.dueDate && (
          <div>
            <p className="text-body-small text-slate-500 mb-1">Due Date</p>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-slate-400" />
              <p className={cn(
                'text-sm font-medium',
                isOverdue ? 'text-error-600' : daysUntilDue !== null && daysUntilDue <= 7 ? 'text-warning-600' : 'text-slate-900',
              )}>
                {format(new Date(notice.dueDate), 'dd MMM yyyy')}
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
                Overdue by {Math.abs(notice.daysUntilDue || 0)} day{Math.abs(notice.daysUntilDue || 0) !== 1 ? 's' : ''}
              </p>
              <p className="text-body-small text-error-700 mt-1">
                Please respond to this notice immediately
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
                Please respond before the due date
              </p>
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
            onClick={() => onView(notice)}
          >
            View Details
          </Button>
        )}
        {notice.status !== 'responded' && notice.status !== 'resolved' && notice.status !== 'closed' && onRespond && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onRespond(notice)}
            disabled={isOverdue && notice.status === 'pending'}
          >
            {notice.status === 'acknowledged' ? 'Submit Response' : 'Respond'}
          </Button>
        )}
        {notice.documentUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(notice.documentUrl, '_blank')}
            icon={<FileText className="w-4 h-4" />}
          >
            View Document
          </Button>
        )}
      </div>
    </div>
  );
};

export default NoticeCard;

