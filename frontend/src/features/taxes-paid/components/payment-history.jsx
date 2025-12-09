// =====================================================
// PAYMENT HISTORY COMPONENT
// List all tax payments for a filing
// =====================================================

import React, { useState } from 'react';
import { Calendar, DollarSign, Filter, Download, Eye } from 'lucide-react';
import { usePaymentHistory } from '../hooks/use-tax-payment';
import PaymentStatus from './payment-status';

const PaymentHistory = ({ filingId, onViewPayment }) => {
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const { data, isLoading, error } = usePaymentHistory(filingId);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';
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
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      verified: 'bg-green-100 text-green-800',
      failed: 'bg-error-100 text-error-800',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${badges[status] || badges.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-error-50 border border-error-200 rounded-lg p-6">
        <p className="text-body-sm text-error-900">
          {error?.message || 'Failed to load payment history'}
        </p>
      </div>
    );
  }

  const payments = data.payments || [];
  const filteredPayments = filterType === 'all'
    ? payments
    : payments.filter(p => p.typeOfPayment === filterType);

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-heading-md text-gray-900 mb-2">No Payments Found</h3>
          <p className="text-body-sm text-gray-600">
            No tax payments have been made for this filing yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-heading-md text-gray-900">Payment History</h3>
          <p className="text-body-sm text-gray-600 mt-1">
            Total Paid: {formatCurrency(data.totalPaid || 0)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-body-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="all">All Payments</option>
            <option value="advance_tax">Advance Tax</option>
            <option value="self_assessment">Self-Assessment Tax</option>
            <option value="regular_assessment">Regular Assessment</option>
          </select>
        </div>
      </div>

      {/* Payment List */}
      <div className="space-y-3">
        {filteredPayments.map((payment) => (
          <div
            key={payment.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-body-md font-medium text-gray-900">
                    {formatCurrency(payment.amount)}
                  </h4>
                  {getStatusBadge(payment.paymentStatus)}
                </div>
                <div className="grid grid-cols-2 gap-4 text-body-xs text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(payment.createdAt)}
                  </div>
                  <div>
                    {payment.challanNumber && `Challan: ${payment.challanNumber}`}
                  </div>
                  <div className="capitalize">
                    {payment.typeOfPayment?.replace('_', ' ')}
                  </div>
                  <div className="capitalize">
                    {payment.paymentMethod?.replace('_', ' ')}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => {
                    setSelectedPaymentId(selectedPaymentId === payment.id ? null : payment.id);
                    if (onViewPayment) {
                      onViewPayment(payment);
                    }
                  }}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Expanded Payment Details */}
            {selectedPaymentId === payment.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <PaymentStatus paymentId={payment.id} />
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center py-8">
          <p className="text-body-sm text-gray-600">
            No payments found for the selected filter.
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;

