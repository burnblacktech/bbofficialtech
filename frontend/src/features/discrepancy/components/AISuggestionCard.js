// =====================================================
// AI SUGGESTION CARD COMPONENT
// Component showing AI-powered resolution suggestions
// =====================================================

import React from 'react';
import { Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { formatIndianCurrency } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import Button from '../../../components/DesignSystem/components/Button';

const AISuggestionCard = ({
  suggestion,
  onApply,
  className = '',
}) => {
  if (!suggestion || !suggestion.suggestion) {
    return null;
  }

  const { discrepancy, suggestion: sug } = suggestion;
  const confidence = Math.round(sug.confidence * 100);

  const getConfidenceColor = () => {
    if (confidence >= 80) return 'text-success-600';
    if (confidence >= 60) return 'text-warning-600';
    return 'text-gold-600';
  };

  const getConfidenceBg = () => {
    if (confidence >= 80) return 'bg-success-50 border-success-200';
    if (confidence >= 60) return 'bg-warning-50 border-warning-200';
    return 'bg-gold-50 border-gold-200';
  };

  return (
    <div className={cn('rounded-xl border p-4', getConfidenceBg(), className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold-500" aria-hidden="true" />
          <h4 className="text-heading-sm font-semibold text-slate-900">AI Suggestion</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-label-md font-medium', getConfidenceColor())}>
            {confidence}% confidence
          </span>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-body-md text-slate-700 mb-2">
          <span className="font-medium">{discrepancy.fieldName || discrepancy.fieldPath}:</span>
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-body-sm text-slate-600">Your Value</p>
            <p className="text-number-md font-medium tabular-nums">
              {typeof discrepancy.manualValue === 'number'
                ? formatIndianCurrency(discrepancy.manualValue)
                : discrepancy.manualValue}
            </p>
          </div>
          <div>
            <p className="text-body-sm text-slate-600">Source Value</p>
            <p className="text-number-md font-medium tabular-nums">
              {typeof discrepancy.uploadedValue === 'number'
                ? formatIndianCurrency(discrepancy.uploadedValue)
                : discrepancy.uploadedValue}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-3 p-3 bg-white bg-opacity-50 rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-4 w-4 text-gold-500" aria-hidden="true" />
          <p className="text-label-md font-medium text-slate-900">Recommended Value</p>
        </div>
        <p className="text-number-md font-bold tabular-nums text-slate-900">
          {typeof sug.suggestedValue === 'number'
            ? formatIndianCurrency(sug.suggestedValue)
            : sug.suggestedValue}
        </p>
        <p className="text-body-sm text-slate-600 mt-1">{sug.reasoning}</p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => {
            if (onApply) {
              onApply();
            }
          }}
          className="flex-1 bg-gold-500 hover:bg-gold-600 text-white"
          size="sm"
        >
          Apply Suggestion
        </Button>
        {sug.alternativeValue !== null && (
          <Button
            onClick={() => {
              if (onApply) {
                // Apply alternative
                onApply();
              }
            }}
            variant="outline"
            size="sm"
          >
            Use Manual Value
          </Button>
        )}
      </div>
    </div>
  );
};

export default AISuggestionCard;

