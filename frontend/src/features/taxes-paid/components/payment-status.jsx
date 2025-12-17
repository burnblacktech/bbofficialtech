// =====================================================
// PAYMENT STATUS COMPONENT
// Display tax payment status and details
// =====================================================

import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle, FileText, Download, ExternalLink } from 'lucide-react';
import { useTaxPayment, useVerifyVia26AS } from '../hooks/use-tax-payment';
import Button from '../../../components/DesignSystem/components/Button';

const PaymentStatus = ({ paymentId, onRetry }) => {
  const { data: payment, isLoading, error } = useTaxPayment(paymentId);
  const verifyVia26AS = useVerifyVia26AS();

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        label: 'Pending',
      },
      processing: {
        icon: Clock,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: 'Processing',
      },
      completed: {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'Completed',
      },
      verified: {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'Verified',
      },
      failed: {
        icon: XCircle,
        color: 'text-error-600',
        bgColor: 'bg-error-50',
        borderColor: 'border-error-200',
        label: 'Failed',
      },
    };

    return configs[status] || configs.pending;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="bg-error-50 border border-error-200 rounded-xl p-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-error-600 mr-2" />
          <p className="text-body-sm text-error-900">
            {error?.message || 'Failed to load payment status'}
          </p>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(payment.paymentStatus);
  const StatusIcon = statusConfig.icon;

  const handleVerify26AS = async () => {
    try {
      await verifyVia26AS.mutateAsync(paymentId);
    } catch (error) {
      console.error('Failed to verify via 26AS:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      {/* Status Header */}
      <div className={`${statusConfig.bgColor} ${statusConfig.borderColor} border rounded-xl p-4 mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <StatusIcon className={`h-6 w-6 ${statusConfig.color} mr-3`} />
            <div>
              <h3 className="text-heading-md text-slate-900">Payment {statusConfig.label}</h3>
              <p className="text-body-sm text-slate-600">
                {payment.challanNumber && `Challan: ${payment.challanNumber}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-body-xs text-slate-600 mb-1">Amount</p>
            <p className="text-heading-md font-semibold text-slate-900">
              {formatCurrency(payment.amount)}
            </p>
          </div>
          <div>
            <p className="text-body-xs text-slate-600 mb-1">Payment Method</p>
            <p className="text-body-sm font-medium text-slate-900 capitalize">
              {payment.paymentMethod?.replace('_', ' ')}
            </p>
          </div>
          <div>
            <p className="text-body-xs text-slate-600 mb-1">Type of Payment</p>
            <p className="text-body-sm font-medium text-slate-900 capitalize">
              {payment.typeOfPayment?.replace('_', ' ')}
            </p>
          </div>
          <div>
            <p className="text-body-xs text-slate-600 mb-1">Assessment Year</p>
            <p className="text-body-sm font-medium text-slate-900">{payment.assessmentYear}</p>
          </div>
        </div>

        {payment.verifiedAt && (
          <div className="pt-4 border-t border-slate-200">
            <p className="text-body-xs text-slate-600 mb-1">Verified At</p>
            <p className="text-body-sm text-slate-900">{formatDate(payment.verifiedAt)}</p>
            {payment.verificationMethod && (
              <p className="text-body-xs text-slate-500 mt-1">
                Verified via {payment.verificationMethod === 'auto_26as' ? 'Form 26AS' : 'Manual Upload'}
              </p>
            )}
          </div>
        )}

        {payment.paymentProofUrl && (
          <div className="pt-4 border-t border-slate-200">
            <p className="text-body-xs text-slate-600 mb-2">Payment Proof</p>
            <a
              href={payment.paymentProofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-body-sm text-gold-600 hover:text-gold-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Proof
            </a>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        {payment.paymentStatus === 'failed' && onRetry && (
          <Button onClick={onRetry} variant="outline" className="flex-1">
            Retry Payment
          </Button>
        )}
        {payment.paymentStatus === 'completed' && !payment.verifiedAt && (
          <Button
            onClick={handleVerify26AS}
            loading={verifyVia26AS.isPending}
            className="flex-1"
          >
            Verify via Form 26AS
          </Button>
        )}
        {payment.paymentProofUrl && (
          <Button
            onClick={() => window.open(payment.paymentProofUrl, '_blank')}
            variant="outline"
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;

