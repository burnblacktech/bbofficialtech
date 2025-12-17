// =====================================================
// INVOICE BADGE COMPONENT
// Displays invoice status and payment status
// =====================================================

import React from 'react';
import { FileText, CheckCircle, Clock, AlertCircle, XCircle, IndianRupee } from 'lucide-react';

const InvoiceBadge = ({ invoice, showNumber = true, className = '' }) => {
  if (!invoice) {
    return null;
  }

  const getStatusConfig = (status, paymentStatus) => {
    const statusMap = {
      draft: { color: 'bg-slate-100 text-slate-700', icon: FileText, label: 'Draft' },
      sent: { color: 'bg-info-50 text-info-600', icon: Clock, label: 'Sent' },
      paid: { color: 'bg-success-50 text-success-600', icon: CheckCircle, label: 'Paid' },
      overdue: { color: 'bg-error-50 text-error-600', icon: AlertCircle, label: 'Overdue' },
      cancelled: { color: 'bg-slate-100 text-slate-500', icon: XCircle, label: 'Cancelled' },
      refunded: { color: 'bg-gold-50 text-gold-600', icon: IndianRupee, label: 'Refunded' },
    };

    // Payment status takes precedence for display
    if (paymentStatus === 'paid') {
      return { color: 'bg-success-50 text-success-600', icon: CheckCircle, label: 'Paid' };
    }
    if (paymentStatus === 'partial') {
      return { color: 'bg-warning-50 text-warning-600', icon: Clock, label: 'Partial' };
    }
    if (paymentStatus === 'failed') {
      return { color: 'bg-error-50 text-error-600', icon: XCircle, label: 'Failed' };
    }
    if (paymentStatus === 'refunded') {
      return { color: 'bg-gold-50 text-gold-600', icon: IndianRupee, label: 'Refunded' };
    }

    return statusMap[status] || statusMap.draft;
  };

  const config = getStatusConfig(invoice.status, invoice.paymentStatus);
  const Icon = config.icon;

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-xl text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </div>
      {showNumber && invoice.invoiceNumber && (
        <span className="text-body-small text-slate-600">#{invoice.invoiceNumber}</span>
      )}
      {(invoice.totalAmount || invoice.amount) && (
        <span className="text-body-small text-slate-700 font-medium">{formatCurrency(invoice.totalAmount || invoice.amount)}</span>
      )}
    </div>
  );
};

export default InvoiceBadge;

