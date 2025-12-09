// =====================================================
// DISCREPANCY PANEL COMPONENT
// Side-by-side comparison of manual vs uploaded data
// =====================================================

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import Button from '../../common/Button';
import { formatIndianCurrency } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import SourceChip from '../../ui/SourceChip/SourceChip';

const DiscrepancyPanel = ({
  fieldLabel,
  manualValue,
  uploadedValue,
  source,
  onAcceptManual,
  onAcceptUploaded,
  onExplain,
  explanation,
  className = '',
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanationText, setExplanationText] = useState(explanation || '');

  const hasDiscrepancy = manualValue !== uploadedValue;
  const difference = Math.abs(manualValue - uploadedValue);

  if (!hasDiscrepancy) {
    return null;
  }

  const handleExplain = () => {
    if (explanationText.trim()) {
      onExplain(explanationText);
      setShowExplanation(false);
    }
  };

  return (
    <div className={cn('border-2 border-warning-300 bg-warning-50 rounded-lg p-4', className)}>
      <div className="flex items-start space-x-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-heading-sm font-semibold text-warning-800 mb-1" style={{ fontSize: '16px', fontWeight: 600 }}>
            Discrepancy Detected
          </h4>
          <p className="text-body-sm text-warning-700" style={{ fontSize: '13px', lineHeight: '20px' }}>
            Your manual entry differs from the uploaded document by {formatIndianCurrency(difference)}
          </p>
        </div>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Manual Entry */}
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-label-md font-medium text-gray-700" style={{ fontSize: '13px', fontWeight: 500 }}>
              Your Entry
            </span>
            <SourceChip source="manual" size="sm" />
          </div>
          <div className="text-number-md font-semibold text-gray-900" style={{ fontSize: '18px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {formatIndianCurrency(manualValue)}
          </div>
        </div>

        {/* Uploaded Value */}
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-label-md font-medium text-gray-700" style={{ fontSize: '13px', fontWeight: 500 }}>
              From Document
            </span>
            <SourceChip source={source} size="sm" />
          </div>
          <div className="text-number-md font-semibold text-gray-900" style={{ fontSize: '18px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {formatIndianCurrency(uploadedValue)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="primary"
          onClick={onAcceptManual}
          className="flex-1 flex items-center justify-center"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Keep My Entry
        </Button>
        <Button
          variant="secondary"
          onClick={onAcceptUploaded}
          className="flex-1 flex items-center justify-center"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Use Document Value
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex-1"
        >
          Explain Difference
        </Button>
      </div>

      {/* Explanation Input */}
      {showExplanation && (
        <div className="mt-4 pt-4 border-t border-warning-200">
          <label className="block text-label-md font-medium text-gray-700 mb-2" style={{ fontSize: '13px', fontWeight: 500 }}>
            Explain the difference
          </label>
          <textarea
            value={explanationText}
            onChange={(e) => setExplanationText(e.target.value)}
            placeholder="e.g., Document shows gross salary, but I'm entering net salary after deductions..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-body-md focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500 focus:ring-offset-1"
            style={{ fontSize: '14px', lineHeight: '22px', minHeight: '80px' }}
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <Button variant="primary" onClick={handleExplain} disabled={!explanationText.trim()}>
              Save Explanation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscrepancyPanel;

