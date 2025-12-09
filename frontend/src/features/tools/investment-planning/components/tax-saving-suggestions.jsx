// =====================================================
// TAX SAVING SUGGESTIONS COMPONENT
// Displays AI-powered tax saving recommendations
// =====================================================

import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

const TaxSavingSuggestions = ({
  recommendations = [],
  taxSavings = null,
  isLoading = false,
  isError = false,
  availableAmount = null,
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading recommendations...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">Failed to load recommendations. Please try again.</p>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No recommendations available at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tax Savings Summary */}
      {taxSavings && (
        <div className="bg-gradient-to-r from-gold-50 to-gold-100 border border-gold-200 rounded-lg p-6">
          <h3 className="font-semibold text-gold-900 mb-4">Potential Tax Savings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Deduction</p>
              <p className="text-2xl font-bold text-gold-600">
                ₹{taxSavings.totalDeduction?.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">Tax Savings</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{taxSavings.totalSavings?.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">Effective Tax Rate</p>
              <p className="text-2xl font-bold text-blue-600">{taxSavings.effectiveTaxRate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gold-600" />
          Recommended Investments
        </h3>
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:border-gold-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{rec.type}</h4>
                <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>Investment: ₹{rec.investmentAmount?.toLocaleString('en-IN')}</span>
                  <span>Deduction: ₹{rec.deductionAmount?.toLocaleString('en-IN')}</span>
                  <span>Lock-in: {rec.lockInPeriod} years</span>
                  <span>Returns: {rec.expectedReturns}%</span>
                  <span className={`px-2 py-1 rounded ${
                    rec.risk === 'low' ? 'bg-green-100 text-green-800' :
                    rec.risk === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {rec.risk} risk
                  </span>
                </div>
                {rec.benefits && rec.benefits.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {rec.benefits.map((benefit, idx) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total Investment Required */}
      {availableAmount && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">Total Investment Required:</span>
            <span className="font-bold text-blue-900">
              ₹{recommendations.reduce((sum, rec) => sum + (rec.investmentAmount || 0), 0).toLocaleString('en-IN')}
            </span>
          </div>
          {availableAmount < recommendations.reduce((sum, rec) => sum + (rec.investmentAmount || 0), 0) && (
            <p className="text-xs text-red-600 mt-2">
              Note: Required investment exceeds available amount
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TaxSavingSuggestions;

