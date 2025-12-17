// =====================================================
// TAX REGIME TOGGLE COMPONENT
// Toggle between Old and New tax regimes
// =====================================================

import React from 'react';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

const TaxRegimeToggle = ({ regime, onRegimeChange, isComparing = false, comparisonData = null }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-heading-4 font-semibold text-slate-900">Tax Regime</h3>
        {comparisonData && (
          <div className="flex items-center space-x-2">
            {comparisonData.comparison.recommendedRegime === regime && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-body-small font-medium bg-gold-100 text-gold-700">
                <TrendingDown className="w-3 h-3 mr-1" />
                Recommended
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="taxRegime"
            value="old"
            checked={regime === 'old'}
            onChange={(e) => onRegimeChange(e.target.value)}
            className="sr-only"
          />
          <div className={`px-4 py-3 rounded-xl border-2 transition-all ${
            regime === 'old'
              ? 'border-regime-old bg-regime-old/10'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded-full border-2 ${
                regime === 'old'
                  ? 'border-regime-old bg-regime-old'
                  : 'border-slate-300'
              }`}>
                {regime === 'old' && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
              <div>
                <div className="font-semibold text-slate-900">Old Regime</div>
                <div className="text-body-small text-slate-500">With all deductions</div>
              </div>
            </div>
          </div>
        </label>

        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="taxRegime"
            value="new"
            checked={regime === 'new'}
            onChange={(e) => onRegimeChange(e.target.value)}
            className="sr-only"
          />
          <div className={`px-4 py-3 rounded-xl border-2 transition-all ${
            regime === 'new'
              ? 'border-regime-new bg-regime-new/10'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded-full border-2 ${
                regime === 'new'
                  ? 'border-regime-new bg-regime-new'
                  : 'border-slate-300'
              }`}>
                {regime === 'new' && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
              <div>
                <div className="font-semibold text-slate-900">New Regime</div>
                <div className="text-body-small text-slate-500">Section 115BAC</div>
              </div>
            </div>
          </div>
        </label>
      </div>

      {comparisonData && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-body-regular">
            <span className="text-slate-600">Tax Savings:</span>
            <span className={`font-semibold ${
              comparisonData.comparison.savingsType === 'new_regime'
                ? 'text-gold-600'
                : 'text-gold-600'
            }`}>
              {comparisonData.comparison.savingsType === 'new_regime' ? 'Save' : 'Save'} ₹{comparisonData.comparison.savings.toLocaleString('en-IN')} with{' '}
              {comparisonData.comparison.recommendedRegime === 'new' ? 'New' : 'Old'} Regime
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxRegimeToggle;

