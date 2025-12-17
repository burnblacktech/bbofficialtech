// =====================================================
// TAX HARVESTING HELPER
// Enhanced component to suggest tax harvesting strategies with visual suggestions and savings calculations
// =====================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Lightbulb, TrendingDown, ArrowRight, CheckCircle, Info, Calculator, TrendingUp, AlertCircle } from 'lucide-react';
import { capitalGainsService } from '../services/capital-gains.service';
import toast from 'react-hot-toast';

const TaxHarvestingHelper = ({ stcgEntries = [], ltcgEntries = [], lossEntries = [], onApplySuggestion }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set());
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);
  const [showSavingsPreview, setShowSavingsPreview] = useState(false);

  // Calculate suggestions using the service
  const calculatedSuggestions = useMemo(() => {
    if (stcgEntries.length === 0 && ltcgEntries.length === 0 && lossEntries.length === 0) {
      return { suggestions: [], summary: null };
    }
    return capitalGainsService.suggestTaxHarvesting(stcgEntries, ltcgEntries, lossEntries);
  }, [stcgEntries, ltcgEntries, lossEntries]);

  useEffect(() => {
    if (calculatedSuggestions.suggestions.length > 0 || calculatedSuggestions.summary) {
      setSuggestions(calculatedSuggestions.suggestions);
      setSummary(calculatedSuggestions.summary);
    }
  }, [calculatedSuggestions]);

  const handleApplySuggestion = (suggestion, index) => {
    if (onApplySuggestion) {
      try {
        onApplySuggestion(suggestion);
        setAppliedSuggestions((prev) => new Set([...prev, index]));
        toast.success('Tax harvesting suggestion applied successfully');
      } catch (error) {
        toast.error('Failed to apply suggestion: ' + error.message);
      }
    }
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
    return `₹${Math.abs(amount).toLocaleString('en-IN')}`;
  };

  const calculateTotalSavings = () => {
    return suggestions.reduce((total, suggestion) => {
      return total + (suggestion.savings || 0);
    }, 0);
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'offset':
        return <TrendingDown className="h-5 w-5 text-blue-600" />;
      case 'carryforward':
        return <ArrowRight className="h-5 w-5 text-orange-600" />;
      default:
        return <Lightbulb className="h-5 w-5 text-purple-600" />;
    }
  };

  const getSuggestionColor = (type) => {
    switch (type) {
      case 'offset':
        return 'border-blue-300 bg-blue-50';
      case 'carryforward':
        return 'border-orange-300 bg-orange-50';
      default:
        return 'border-purple-300 bg-purple-50';
    }
  };

  if (suggestions.length === 0 && !summary) {
    return null;
  }

  const totalSavings = calculateTotalSavings();

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6 shadow-elevation-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Lightbulb className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-heading-md font-semibold text-gray-800">Tax Harvesting Suggestions</h3>
            <p className="text-body-xs text-slate-600 mt-1">Optimize your capital gains tax liability</p>
          </div>
        </div>
        {totalSavings > 0 && (
          <button
            onClick={() => setShowSavingsPreview(!showSavingsPreview)}
            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium text-body-sm flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            View Savings: {formatCurrency(totalSavings)}
          </button>
        )}
      </div>

      {/* Savings Preview Modal */}
      {showSavingsPreview && totalSavings > 0 && (
        <div className="mb-4 bg-green-50 border-2 border-green-300 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-heading-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Total Potential Tax Savings
              </h4>
              <p className="text-heading-lg font-bold text-green-700 mb-2">
                {formatCurrency(totalSavings)}
              </p>
              <p className="text-body-xs text-green-700">
                By applying all suggestions, you could save this amount in taxes
              </p>
            </div>
            <button
              onClick={() => setShowSavingsPreview(false)}
              className="text-green-600 hover:text-green-700"
            >
              <AlertCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {summary && (
        <div className="bg-white rounded-xl p-4 mb-4 border-2 border-blue-200 shadow-elevation-1">
          <h4 className="text-heading-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            Capital Gains Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-body-xs text-slate-600 mb-1">Short-term Gains</p>
              <p className="text-heading-sm font-bold text-blue-700">
                {formatCurrency(summary.totalSTCG)}
              </p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-body-xs text-slate-600 mb-1">Long-term Gains</p>
              <p className="text-heading-sm font-bold text-purple-700">
                {formatCurrency(summary.totalLTCG)}
              </p>
            </div>
            <div className="bg-error-50 rounded-xl p-3">
              <p className="text-body-xs text-slate-600 mb-1">Short-term Losses</p>
              <p className="text-heading-sm font-bold text-error-700">
                {formatCurrency(summary.totalSTCL)}
              </p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-body-xs text-slate-600 mb-1">Long-term Losses</p>
              <p className="text-heading-sm font-bold text-orange-700">
                {formatCurrency(summary.totalLTCL)}
              </p>
            </div>
          </div>
          {(summary.netSTCG > 0 || summary.netLTCG > 0) && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-body-sm font-medium text-slate-700">Net Short-term Gains:</span>
                <span className="text-heading-sm font-bold text-green-700">
                  {formatCurrency(summary.netSTCG)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-sm font-medium text-slate-700">Net Long-term Gains:</span>
                <span className="text-heading-sm font-bold text-green-700">
                  {formatCurrency(summary.netLTCG)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => {
            const isExpanded = expandedSuggestion === index;
            const isApplied = appliedSuggestions.has(index);

            return (
              <div
                key={index}
                className={`bg-white rounded-xl p-5 border-2 shadow-elevation-1 transition-all ${
                  isApplied
                    ? 'border-green-400 bg-green-50'
                    : getSuggestionColor(suggestion.type)
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getSuggestionIcon(suggestion.type)}
                      <h5 className="text-heading-sm font-semibold text-gray-800">{suggestion.title}</h5>
                      {isApplied && (
                        <span className="px-2 py-1 bg-green-600 text-white text-body-xs font-medium rounded-full flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Applied
                        </span>
                      )}
                    </div>
                    <p className="text-body-sm text-slate-700 mb-3">{suggestion.description}</p>

                    {suggestion.savings > 0 && (
                      <div className="bg-green-100 rounded-xl p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-body-sm font-medium text-green-800">Potential Tax Savings:</span>
                          <span className="text-heading-sm font-bold text-green-700">
                            {formatCurrency(suggestion.savings)}
                          </span>
                        </div>
                        {suggestion.type === 'offset' && (
                          <p className="text-body-xs text-green-700 mt-1">
                            {suggestion.title.includes('Short-term')
                              ? 'STCG is taxed at 15% (or as per your tax slab)'
                              : 'LTCG above ₹1L is taxed at 10% (equity) or 20% (other assets)'}
                          </p>
                        )}
                      </div>
                    )}

                    {suggestion.type === 'carryforward' && (
                      <div className="bg-orange-100 rounded-xl p-3 mb-3">
                        <p className="text-body-xs text-orange-800">
                          <Info className="h-3 w-3 inline mr-1" />
                          Losses can be carried forward for up to 8 years and set off against future gains
                        </p>
                      </div>
                    )}

                    {isExpanded && suggestion.details && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-body-xs text-slate-600">{suggestion.details}</p>
                      </div>
                    )}
                  </div>
                  {!isApplied && (
                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => handleApplySuggestion(suggestion, index)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-body-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <ArrowRight className="h-4 w-4" />
                        {suggestion.action || 'Apply'}
                      </button>
                      {suggestion.details && (
                        <button
                          onClick={() => setExpandedSuggestion(isExpanded ? null : index)}
                          className="px-3 py-1.5 text-body-xs text-slate-600 hover:text-gray-800 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                          {isExpanded ? 'Show Less' : 'Learn More'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {suggestions.length === 0 && summary && (
        <div className="bg-white rounded-xl p-6 border-2 border-blue-200 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-body-md font-medium text-slate-700 mb-1">
            No Tax Harvesting Opportunities
          </p>
          <p className="text-body-sm text-slate-600">
            All gains and losses are already optimized. Great job!
          </p>
        </div>
      )}
    </div>
  );
};

export default TaxHarvestingHelper;

