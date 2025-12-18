// =====================================================
// ITR-V STATUS CARD COMPONENT
// Card component showing ITR-V status with visual timeline
// =====================================================

import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle, FileText, Download, RefreshCw, Calendar } from 'lucide-react';
import { cn } from '../../utils';
import Button from '../DesignSystem/components/Button';
import StatusBadge from '../DesignSystem/StatusBadge';
import { format } from 'date-fns';

const ITRVStatusCard = ({
  itrv,
  onCheckStatus,
  onDownload,
  onVerify,
  className = '',
}) => {
  if (!itrv) {
    return null;
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircle,
          color: 'text-success-600',
          bgColor: 'bg-success-50',
          borderColor: 'border-success-200',
          label: 'Verified',
          description: 'Your ITR-V has been successfully verified.',
        };
      case 'delivered':
        return {
          icon: FileText,
          color: 'text-info-600',
          bgColor: 'bg-info-50',
          borderColor: 'border-info-200',
          label: 'Delivered',
          description: 'Your ITR-V has been delivered. Please verify it within 120 days.',
        };
      case 'processing':
        return {
          icon: Clock,
          color: 'text-warning-600',
          bgColor: 'bg-warning-50',
          borderColor: 'border-warning-200',
          label: 'Processing',
          description: 'Your ITR-V is being processed and will be delivered soon.',
        };
      case 'generated':
        return {
          icon: FileText,
          color: 'text-info-600',
          bgColor: 'bg-info-50',
          borderColor: 'border-info-200',
          label: 'Generated',
          description: 'Your ITR-V has been generated and is being processed.',
        };
      case 'expired':
        return {
          icon: XCircle,
          color: 'text-error-600',
          bgColor: 'bg-error-50',
          borderColor: 'border-error-200',
          label: 'Expired',
          description: 'Your ITR-V has expired. Please contact support for assistance.',
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-error-600',
          bgColor: 'bg-error-50',
          borderColor: 'border-error-200',
          label: 'Failed',
          description: 'There was an issue processing your ITR-V. Please contact support.',
        };
      default:
        return {
          icon: Clock,
          color: 'text-slate-600',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          label: 'Pending',
          description: 'ITR-V tracking has been initialized.',
        };
    }
  };

  const statusConfig = getStatusConfig(itrv.status);
  const StatusIcon = statusConfig.icon;
  const isExpired = itrv.isExpired || (itrv.expiryDate && new Date(itrv.expiryDate) < new Date());
  const daysUntilExpiry = itrv.daysUntilExpiry;

  return (
    <div className={cn('bg-white rounded-xl shadow-elevation-1 border', statusConfig.borderColor, className)}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className={cn('p-3 rounded-xl', statusConfig.bgColor)}>
              <StatusIcon className={cn('w-6 h-6', statusConfig.color)} />
            </div>
            <div>
              <h3 className="text-heading-4 font-semibold text-slate-900 mb-1">ITR-V Status</h3>
              <StatusBadge status={itrv.status} size="md" />
              <p className="text-body-regular text-slate-600 mt-2">{statusConfig.description}</p>
            </div>
          </div>
          {onCheckStatus && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCheckStatus}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Check Status
            </Button>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-body-small text-slate-500 mb-1">Acknowledgement Number</p>
            <p className="text-body-regular font-medium text-slate-900">{itrv.ackNumber || 'N/A'}</p>
          </div>
          {itrv.filing && (
            <div>
              <p className="text-body-small text-slate-500 mb-1">Assessment Year</p>
              <p className="text-body-regular font-medium text-slate-900">{itrv.filing.assessmentYear || 'N/A'}</p>
            </div>
          )}
          {itrv.generatedAt && (
            <div>
              <p className="text-body-small text-slate-500 mb-1">Generated On</p>
              <p className="text-body-regular font-medium text-slate-900">
                {format(new Date(itrv.generatedAt), 'dd MMM yyyy, hh:mm a')}
              </p>
            </div>
          )}
          {itrv.deliveredAt && (
            <div>
              <p className="text-body-small text-slate-500 mb-1">Delivered On</p>
              <p className="text-body-regular font-medium text-slate-900">
                {format(new Date(itrv.deliveredAt), 'dd MMM yyyy, hh:mm a')}
              </p>
            </div>
          )}
          {itrv.deliveryMethod && (
            <div>
              <p className="text-body-small text-slate-500 mb-1">Delivery Method</p>
              <p className="text-body-regular font-medium text-slate-900 capitalize">{itrv.deliveryMethod}</p>
            </div>
          )}
          {itrv.verifiedAt && (
            <div>
              <p className="text-body-small text-slate-500 mb-1">Verified On</p>
              <p className="text-body-regular font-medium text-slate-900">
                {format(new Date(itrv.verifiedAt), 'dd MMM yyyy, hh:mm a')}
              </p>
            </div>
          )}
          {itrv.verificationMethod && (
            <div>
              <p className="text-body-small text-slate-500 mb-1">Verification Method</p>
              <p className="text-body-regular font-medium text-slate-900">
                {itrv.verificationMethod.replace(/_/g, ' ')}
              </p>
            </div>
          )}
        </div>

        {/* Expiry Warning */}
        {itrv.expiryDate && !isExpired && daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
          <div className={cn('p-3 rounded-xl mb-4', daysUntilExpiry <= 7 ? 'bg-error-50 border border-error-200' : 'bg-warning-50 border border-warning-200')}>
            <div className="flex items-center gap-2">
              <AlertCircle className={cn('w-5 h-5', daysUntilExpiry <= 7 ? 'text-error-600' : 'text-warning-600')} />
              <div>
                <p className={cn('text-sm font-medium', daysUntilExpiry <= 7 ? 'text-error-900' : 'text-warning-900')}>
                  {daysUntilExpiry <= 7
                    ? `⚠️ Expiring in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}!`
                    : `Expiring in ${daysUntilExpiry} days`}
                </p>
                <p className={cn('text-xs mt-1', daysUntilExpiry <= 7 ? 'text-error-700' : 'text-warning-700')}>
                  Please verify your ITR-V before {format(new Date(itrv.expiryDate), 'dd MMM yyyy')}
                </p>
              </div>
            </div>
          </div>
        )}

        {isExpired && (
          <div className="bg-error-50 border border-error-200 p-3 rounded-xl mb-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-error-600" />
              <div>
                <p className="text-body-regular font-medium text-error-900">ITR-V Expired</p>
                <p className="text-body-small text-error-700 mt-1">
                  Expired on {format(new Date(itrv.expiryDate), 'dd MMM yyyy')}. Please contact support.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          {itrv.documentUrl && onDownload && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onDownload}
              icon={<Download className="w-4 h-4" />}
            >
              Download ITR-V
            </Button>
          )}
          {itrv.status === 'delivered' && !itrv.verifiedAt && onVerify && (
            <Button
              variant="primary"
              size="sm"
              onClick={onVerify}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Verify ITR-V
            </Button>
          )}
          {onCheckStatus && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCheckStatus}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh Status
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ITRVStatusCard;

