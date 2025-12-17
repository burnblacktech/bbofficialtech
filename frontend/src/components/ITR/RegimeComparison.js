// =====================================================
// REGIME COMPARISON COMPONENT
// Side-by-side comparison of Old vs New tax regimes
// =====================================================

import React from 'react';
import { Calculator, TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react';

const RegimeComparison = ({ comparisonData, onSelectRegime }) => {
  if (!comparisonData) {
    return (
      <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-500">
        <Calculator className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        <p>Enter income and deduction details to compare regimes</p>
      </div>
    );
  }

  const { oldRegime, newRegime, comparison } = comparisonData;
  const recommendedRegime = comparison.recommendedRegime;

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-4">
      {/* Comparison Header */}
      <div className="bg-gradient-to-r from-gold-50 to-gold-50 rounded-xl p-4 border border-gold-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Regime Comparison</h3>
            <p className="text-body-regular text-slate-600">
              {recommendedRegime === 'new' ? 'New Regime' : 'Old Regime'} saves you{' '}
              <span className="font-bold text-gold-600">
                ₹{comparison.savings.toLocaleString('en-IN')}
              </span>
            </p>
          </div>
          {recommendedRegime === 'new' ? (
            <div className="flex items-center px-3 py-1.5 bg-gold-100 text-gold-700 rounded-full text-body-regular font-medium">
              <CheckCircle className="w-4 h-4 mr-1" />
              New Regime Recommended
            </div>
          ) : (
            <div className="flex items-center px-3 py-1.5 bg-gold-100 text-gold-700 rounded-full text-body-regular font-medium">
              <CheckCircle className="w-4 h-4 mr-1" />
              Old Regime Recommended
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Old Regime */}
        <div className={`bg-white rounded-xl border-2 p-4 ${
          recommendedRegime === 'old' ? 'border-regime-old' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-900">Old Regime</h4>
            {recommendedRegime === 'old' && (
              <span className="text-body-small bg-gold-100 text-gold-700 px-2 py-1 rounded-full">
                Recommended
              </span>
            )}
          </div>

          <div className="space-y-2 text-body-regular">
            <div className="flex justify-between">
              <span className="text-slate-600">Gross Income:</span>
              <span className="font-semibold">{formatCurrency(oldRegime.grossTotalIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Deductions:</span>
              <span className="font-semibold text-success-500">
                -{formatCurrency(oldRegime.totalDeductions)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Taxable Income:</span>
              <span className="font-semibold">{formatCurrency(oldRegime.taxableIncome)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between">
              <span className="text-slate-600">Tax Liability:</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(oldRegime.finalTaxLiability)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Taxes Paid:</span>
              <span className="font-semibold">{formatCurrency(oldRegime.totalTaxesPaid)}</span>
            </div>
            <div className={`border-t border-slate-200 pt-2 flex justify-between ${
              oldRegime.isRefund ? 'text-success-500' : 'text-error-500'
            }`}>
              <span className="font-semibold">
                {oldRegime.isRefund ? 'Refund Due' : 'Tax Payable'}:
              </span>
              <span className="font-bold">
                {oldRegime.isRefund ? '+' : '-'}
                {formatCurrency(Math.abs(oldRegime.refundOrPayable))}
              </span>
            </div>
          </div>

          {recommendedRegime === 'old' && (
            <button
              onClick={() => onSelectRegime('old')}
              className="w-full mt-4 px-4 py-2 bg-regime-old text-white rounded-xl hover:opacity-90 transition-colors text-body-regular font-medium"
            >
              Select Old Regime
            </button>
          )}
        </div>

        {/* New Regime */}
        <div className={`bg-white rounded-xl border-2 p-4 ${
          recommendedRegime === 'new' ? 'border-regime-new' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-900">New Regime</h4>
            {recommendedRegime === 'new' && (
              <span className="text-body-small bg-gold-100 text-gold-700 px-2 py-1 rounded-full">
                Recommended
              </span>
            )}
          </div>

          <div className="space-y-2 text-body-regular">
            <div className="flex justify-between">
              <span className="text-slate-600">Gross Income:</span>
              <span className="font-semibold">{formatCurrency(newRegime.grossTotalIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Deductions:</span>
              <span className="font-semibold text-success-500">
                -{formatCurrency(newRegime.totalDeductions)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Taxable Income:</span>
              <span className="font-semibold">{formatCurrency(newRegime.taxableIncome)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between">
              <span className="text-slate-600">Tax Liability:</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(newRegime.finalTaxLiability)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Taxes Paid:</span>
              <span className="font-semibold">{formatCurrency(newRegime.totalTaxesPaid)}</span>
            </div>
            <div className={`border-t border-slate-200 pt-2 flex justify-between ${
              newRegime.isRefund ? 'text-success-500' : 'text-error-500'
            }`}>
              <span className="font-semibold">
                {newRegime.isRefund ? 'Refund Due' : 'Tax Payable'}:
              </span>
              <span className="font-bold">
                {newRegime.isRefund ? '+' : '-'}
                {formatCurrency(Math.abs(newRegime.refundOrPayable))}
              </span>
            </div>
          </div>

          {recommendedRegime === 'new' && (
            <button
              onClick={() => onSelectRegime('new')}
              className="w-full mt-4 px-4 py-2 bg-regime-new text-white rounded-xl hover:opacity-90 transition-colors text-body-regular font-medium"
            >
              Select New Regime
            </button>
          )}
        </div>
      </div>

      {/* Key Differences */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-3">Key Differences</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-body-regular">
          <div>
            <div className="font-medium text-slate-700 mb-2">Old Regime</div>
            <ul className="space-y-1 text-slate-600">
              <li>• All deductions available (80C, 80D, 80G, etc.)</li>
              <li>• Standard deduction ₹50,000</li>
              <li>• HRA exemption</li>
              <li>• Higher tax slabs</li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-slate-700 mb-2">New Regime</div>
            <ul className="space-y-1 text-slate-600">
              <li>• Limited deductions (standard deduction only)</li>
              <li>• Standard deduction ₹50,000</li>
              <li>• Lower tax slabs</li>
              <li>• Simplified filing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegimeComparison;

