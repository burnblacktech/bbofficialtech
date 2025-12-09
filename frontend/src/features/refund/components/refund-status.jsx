// =====================================================
// REFUND STATUS COMPONENT
// Display current refund status with details
// =====================================================

import React from 'react';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard,
  Download,
} from 'lucide-react';
import { useRefund } from '../hooks/use-refund';
import Button from '../../../components/common/Button';

const RefundStatus = ({ filingId, onUpdateAccount, onReissueRequest }) => {
  const { data: refundStatus, isLoading, error } = useRefund(filingId);

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'credited':
        return <CheckCircle className="h-8 w-8 text-success-500" />;
      case 'issued':
        return <Clock className="h-8 w-8 text-info-500" />;
      case 'processing':
        return <Clock className="h-8 w-8 text-warning-500 animate-pulse" />;
      case 'failed':
        return <XCircle className="h-8 w-8 text-error-500" />;
      case 'adjusted':
        return <AlertCircle className="h-8 w-8 text-gold-500" />;
      default:
        return <Clock className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'credited':
        return 'bg-success-50 border-success-200 text-success-900';
      case 'issued':
        return 'bg-info-50 border-info-200 text-info-900';
      case 'processing':
        return 'bg-warning-50 border-warning-200 text-warning-900';
      case 'failed':
        return 'bg-error-50 border-error-200 text-error-900';
      case 'adjusted':
        return 'bg-gold-50 border-gold-200 text-gold-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !refundStatus) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <XCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
        <p className="text-body-md text-gray-600">
          {error?.message || 'Failed to load refund status'}
        </p>
      </div>
    );
  }

  const { status, expectedAmount, refundReference, interestAmount, bankAccount, statusDate } =
    refundStatus;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center">
          {getStatusIcon(status)}
          <div className="ml-4">
            <h3 className="text-heading-md text-gray-800">Refund Status</h3>
            <p className="text-body-sm text-gray-600 mt-1">
              Last updated: {statusDate ? new Date(statusDate).toLocaleDateString('en-IN') : 'N/A'}
            </p>
          </div>
        </div>
        <span
          className={`px-4 py-2 rounded-full text-body-sm font-semibold capitalize ${getStatusColor(
            status,
          )}`}
        >
          {status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-body-sm text-gray-600 mb-1">Expected Refund Amount</p>
          <p className="text-heading-lg font-semibold text-gray-800">
            {formatCurrency(expectedAmount)}
          </p>
        </div>
        {interestAmount > 0 && (
          <div>
            <p className="text-body-sm text-gray-600 mb-1">Interest on Refund</p>
            <p className="text-heading-lg font-semibold text-success-600">
              +{formatCurrency(interestAmount)}
            </p>
          </div>
        )}
        {refundReference && (
          <div>
            <p className="text-body-sm text-gray-600 mb-1">Refund Reference</p>
            <p className="text-body-md font-mono text-gray-800">{refundReference}</p>
          </div>
        )}
        {bankAccount && (
          <div>
            <p className="text-body-sm text-gray-600 mb-1">Bank Account</p>
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
              <p className="text-body-md text-gray-800">
                {bankAccount.accountNumber
                  ? `****${bankAccount.accountNumber.slice(-4)}`
                  : 'Not provided'}
              </p>
            </div>
          </div>
        )}
      </div>

      {(status === 'failed' || status === 'adjusted') && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-warning-600 mt-0.5 mr-2" />
            <div>
              <p className="text-body-md font-semibold text-warning-900">
                {status === 'failed' ? 'Refund Failed' : 'Refund Adjusted'}
              </p>
              <p className="text-body-sm text-warning-700 mt-1">
                {status === 'failed'
                  ? 'The refund could not be processed. Please update your bank account details or request a re-issue.'
                  : 'The refund amount has been adjusted against outstanding tax dues.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        {onUpdateAccount && (
          <Button variant="outline" onClick={onUpdateAccount}>
            Update Bank Account
          </Button>
        )}
        {onReissueRequest && status === 'failed' && (
          <Button variant="outline" onClick={onReissueRequest}>
            Request Re-issue
          </Button>
        )}
        <Button variant="ghost" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download Receipt
        </Button>
      </div>
    </div>
  );
};

export default RefundStatus;

