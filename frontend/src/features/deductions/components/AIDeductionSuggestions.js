// =====================================================
// AI DEDUCTION SUGGESTIONS COMPONENT
// Display AI-powered deduction opportunities with priority and tax savings
// =====================================================

import React from 'react';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAISuggestions } from '../hooks/use-ai-suggestions';

const AIDeductionSuggestions = ({ filingId, formData, onApplySuggestion, onDismiss }) => {
  const { data: suggestions = [], isLoading } = useAISuggestions(filingId, formData);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-5 h-5" />;
      case 'medium':
        return <TrendingUp className="w-5 h-5" />;
      case 'low':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-gold-600" />
          <h3 className="text-heading-md text-gray-900">AI-Powered Deduction Suggestions</h3>
          <span className="px-2 py-1 text-xs rounded bg-gold-100 text-gold-700 font-medium">
            {suggestions.length} suggestions
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion) => {
          const priorityColor = getPriorityColor(suggestion.priority);
          const PriorityIcon = getPriorityIcon(suggestion.priority);

          return (
            <div
              key={suggestion.id}
              className={`p-4 rounded-lg border-2 ${priorityColor} transition-all hover:shadow-md`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {PriorityIcon}
                    <h4 className="text-heading-sm font-semibold">{suggestion.title}</h4>
                    <span className="px-2 py-1 text-xs rounded bg-white/50 font-medium">
                      {suggestion.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-body-sm mb-3">{suggestion.description}</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-body-xs text-gray-600">Estimated Tax Savings</div>
                      <div className="text-heading-sm font-bold">
                        ₹{suggestion.estimatedSavings?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    {suggestion.currentAmount !== undefined && (
                      <div>
                        <div className="text-body-xs text-gray-600">Current</div>
                        <div className="text-heading-sm font-semibold">
                          ₹{suggestion.currentAmount.toLocaleString('en-IN')}
                        </div>
                      </div>
                    )}
                    {suggestion.suggestedAmount !== undefined && (
                      <div>
                        <div className="text-body-xs text-gray-600">Suggested</div>
                        <div className="text-heading-sm font-semibold">
                          ₹{suggestion.suggestedAmount.toLocaleString('en-IN')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {suggestion.actionable && onApplySuggestion && (
                    <button
                      onClick={() => onApplySuggestion(suggestion)}
                      className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 text-sm font-medium"
                    >
                      Apply
                    </button>
                  )}
                  {onDismiss && (
                    <button
                      onClick={() => onDismiss(suggestion.id)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AIDeductionSuggestions;

