// =====================================================
// DEMAND PAYMENT FORM COMPONENT
// Form for recording payments against tax demands
// =====================================================

import React, { useState } from 'react';
import { IndianRupee, CreditCard, Building2, Wallet } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../DesignSystem/components/Button';
import toast from 'react-hot-toast';
import { formatIndianCurrency } from '../../lib/format';

const DemandPaymentForm = ({
  demand,
  onSubmit,
  onCancel,
  className = '',
}) => {
  const [amount, setAmount] = useState(demand?.outstandingAmount || 0);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [transactionId, setTransactionId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (amount > demand.outstandingAmount) {
      toast.error(`Payment amount cannot exceed outstanding amount of ${formatIndianCurrency(demand.outstandingAmount)}`);
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        amount: parseFloat(amount),
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        paymentDate: paymentDate || undefined,
      });
    } catch (error) {
      toast.error('Failed to record payment');
      console.error('Payment error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const paymentMethods = [
    { value: 'razorpay', label: 'Razorpay (Online)', icon: CreditCard },
    { value: 'netbanking', label: 'Net Banking', icon: Building2 },
    { value: 'upi', label: 'UPI', icon: Wallet },
    { value: 'cheque', label: 'Cheque', icon: IndianRupee },
    { value: 'dd', label: 'Demand Draft', icon: IndianRupee },
    { value: 'cash', label: 'Cash', icon: IndianRupee },
    { value: 'other', label: 'Other', icon: IndianRupee },
  ];

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {/* Outstanding Amount Info */}
      <div className="bg-info-50 border border-info-200 p-4 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-body-regular text-slate-600">Outstanding Amount</p>
            <p className="text-heading-2 font-bold text-slate-900">
              {formatIndianCurrency(demand?.outstandingAmount || 0)}
            </p>
          </div>
          {demand?.totalAmount && (
            <div className="text-right">
              <p className="text-body-regular text-slate-600">Total Demand</p>
              <p className="text-body-large font-semibold text-slate-700">
                {formatIndianCurrency(demand.totalAmount)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Amount */}
      <div>
        <label htmlFor="amount" className="block text-body-regular font-medium text-slate-700 mb-2">
          Payment Amount <span className="text-error-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IndianRupee className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            max={demand?.outstandingAmount || 0}
            step="0.01"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter payment amount"
            required
          />
        </div>
        <p className="mt-1 text-body-small text-slate-500">
          Maximum: {formatIndianCurrency(demand?.outstandingAmount || 0)}
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setAmount(demand?.outstandingAmount || 0)}
            className="text-body-small text-primary-600 hover:text-primary-700 underline"
          >
            Pay Full Amount
          </button>
          {demand?.outstandingAmount && demand.outstandingAmount > 0 && (
            <>
              <span className="text-body-small text-slate-400">|</span>
              <button
                type="button"
                onClick={() => setAmount(Math.ceil(demand.outstandingAmount / 2))}
                className="text-body-small text-primary-600 hover:text-primary-700 underline"
              >
                Pay Half
              </button>
            </>
          )}
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-body-regular font-medium text-slate-700 mb-2">
          Payment Method <span className="text-error-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.value}
                type="button"
                onClick={() => setPaymentMethod(method.value)}
                className={cn(
                  'flex items-center gap-2 p-3 border rounded-xl text-left transition-colors',
                  paymentMethod === method.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-300 hover:border-gray-400',
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-body-regular font-medium">{method.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Transaction ID (Optional) */}
      <div>
        <label htmlFor="transactionId" className="block text-body-regular font-medium text-slate-700 mb-2">
          Transaction ID / Reference Number (Optional)
        </label>
        <input
          type="text"
          id="transactionId"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          placeholder="Enter transaction ID if available"
        />
      </div>

      {/* Payment Date */}
      <div>
        <label htmlFor="paymentDate" className="block text-body-regular font-medium text-slate-700 mb-2">
          Payment Date
        </label>
        <input
          type="date"
          id="paymentDate"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={submitting || !amount || amount <= 0 || amount > (demand?.outstandingAmount || 0)}
          icon={<IndianRupee className="w-4 h-4" />}
        >
          {submitting ? 'Recording Payment...' : 'Record Payment'}
        </Button>
      </div>
    </form>
  );
};

export default DemandPaymentForm;

