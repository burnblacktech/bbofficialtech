// =====================================================
// LIVE TAX SUMMARY - REAL-TIME TAX CALCULATION SIDEBAR
// Always visible sidebar with instant updates and animations
// =====================================================

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calculator, AlertCircle } from 'lucide-react';

const LiveTaxSummary = ({ filingData, onSaveDraft }) => {
  const [taxSummary, setTaxSummary] = useState({
    totalIncome: 0,
    totalDeductions: 0,
    taxableIncome: 0,
    taxDue: 0,
    taxesPaid: 0,
    refundAmount: 0,
    isRefund: true,
  });

  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate tax summary based on filing data
  useEffect(() => {
    if (!filingData) return;

    // Mock calculation - replace with actual tax computation
    const totalIncome = filingData.income?.reduce((sum, source) => sum + (source.amount || 0), 0) || 0;
    const totalDeductions = filingData.deductions?.reduce((sum, deduction) => sum + (deduction.amount || 0), 0) || 0;
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);

    // Simple tax calculation (replace with actual tax computation engine)
    let taxDue = 0;
    if (taxableIncome > 500000) {
      taxDue = (taxableIncome - 500000) * 0.2 + 12500; // 20% above 5L + 12.5K
    } else if (taxableIncome > 250000) {
      taxDue = (taxableIncome - 250000) * 0.05; // 5% above 2.5L
    }

    const taxesPaid = filingData.taxesPaid?.reduce((sum, tax) => sum + (tax.amount || 0), 0) || 0;
    const refundAmount = Math.max(0, taxesPaid - taxDue);
    const isRefund = taxesPaid > taxDue;

    const newSummary = {
      totalIncome,
      totalDeductions,
      taxableIncome,
      taxDue,
      taxesPaid,
      refundAmount,
      isRefund,
    };

    // Trigger animation if values changed
    if (JSON.stringify(newSummary) !== JSON.stringify(taxSummary)) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }

    setTaxSummary(newSummary);
  }, [filingData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-elevation-3 border border-gray-100 sticky top-4">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-heading-4 font-semibold text-slate-900 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-blue-600" />
            Live Tax Summary
          </h3>
          <div className={`w-3 h-3 rounded-full ${isAnimating ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}></div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6 space-y-4">
        {/* Total Income */}
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-body-regular font-medium text-blue-700">Total Income</span>
            <span className="text-body-large font-bold text-blue-900">
              {formatCurrency(taxSummary.totalIncome)}
            </span>
          </div>
        </div>

        {/* Total Deductions */}
        <div className="bg-green-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-body-regular font-medium text-green-700">Total Deductions</span>
            <span className="text-body-large font-bold text-green-900">
              {formatCurrency(taxSummary.totalDeductions)}
            </span>
          </div>
        </div>

        {/* Taxable Income */}
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-body-regular font-medium text-slate-700">Taxable Income</span>
            <span className="text-body-large font-bold text-slate-900">
              {formatCurrency(taxSummary.taxableIncome)}
            </span>
          </div>
        </div>

        {/* Tax Due */}
        <div className="bg-gold-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-body-regular font-medium text-gold-700">Tax Due</span>
            <span className="text-body-large font-bold text-gold-900">
              {formatCurrency(taxSummary.taxDue)}
            </span>
          </div>
        </div>

        {/* Taxes Paid */}
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-body-regular font-medium text-purple-700">Taxes Paid</span>
            <span className="text-body-large font-bold text-purple-900">
              {formatCurrency(taxSummary.taxesPaid)}
            </span>
          </div>
        </div>
      </div>

      {/* Final Result */}
      <div className="p-6 border-t border-gray-100">
        <div className={`rounded-xl p-4 ${
          taxSummary.isRefund
            ? 'bg-green-50 border border-green-200'
            : 'bg-error-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {taxSummary.isRefund ? (
                <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <TrendingDown className="w-5 h-5 text-error-600 mr-2" />
              )}
              <span className={`text-sm font-medium ${
                taxSummary.isRefund ? 'text-green-700' : 'text-error-700'
              }`}>
                {taxSummary.isRefund ? 'Refund Amount' : 'Tax Due'}
              </span>
            </div>
            <span className={`text-2xl font-bold ${
              taxSummary.isRefund ? 'text-green-900' : 'text-red-900'
            } ${isAnimating ? 'animate-pulse' : ''}`}>
              {formatCurrency(taxSummary.isRefund ? taxSummary.refundAmount : taxSummary.taxDue)}
            </span>
          </div>
        </div>
      </div>

      {/* Save Draft Button */}
      <div className="p-6 border-t border-gray-100">
        <button
          onClick={onSaveDraft}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center"
        >
          <Calculator className="w-4 h-4 mr-2" />
          Save Draft
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="p-6 border-t border-gray-100">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-body-regular">
            <span className="text-slate-600">Progress</span>
            <span className="text-slate-900 font-medium">60%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: '60%' }}></div>
          </div>
          <p className="text-body-small text-slate-500">
            Complete all sections to file your return
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveTaxSummary;
