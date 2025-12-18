// =====================================================
// DISCREPANCY PANEL COMPONENT
// Side-by-side comparison of manual vs uploaded data
// =====================================================

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import Button from '../../../components/DesignSystem/components/Button';
import { formatIndianCurrency } from '../../../lib/format';
import { cn } from '../../../utils';
import SourceChip from '../../../components/UI/SourceChip/SourceChip';

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
  const [selectedResolution, setSelectedResolution] = useState(null);

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
    <div className={cn('bg-warning-50 border border-warning-200 rounded-xl p-4', className)}>
      <div className="flex items-start gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <h4 className="text-heading-sm font-semibold text-warning-900 mb-1">
            ⚠ DISCREPANCY DETECTED
          </h4>
          <p className="text-body-md text-warning-800">
            {fieldLabel || 'This field'} doesn't match AIS data.
          </p>
        </div>
      </div>

      {/* Comparison Table - UI.md pattern: YOUR ENTRY | AIS DATA | DIFFERENCE */}
      <div className="mb-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-4 py-2 text-left text-label-md font-medium text-slate-700">YOUR ENTRY</th>
              <th className="px-4 py-2 text-left text-label-md font-medium text-slate-700">AIS DATA</th>
              <th className="px-4 py-2 text-left text-label-md font-medium text-slate-700">DIFFERENCE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-3">
                <div className="text-number-md font-semibold tabular-nums text-slate-900">
                  {formatIndianCurrency(manualValue)}
                </div>
                <SourceChip source="manual" size="sm" className="mt-1" />
              </td>
              <td className="px-4 py-3">
                <div className="text-number-md font-semibold tabular-nums text-slate-900">
                  {formatIndianCurrency(uploadedValue)}
                </div>
                <SourceChip source={source || 'ais'} size="sm" className="mt-1" />
              </td>
              <td className="px-4 py-3">
                <div className="text-number-md font-semibold tabular-nums text-warning-700">
                  {formatIndianCurrency(difference)}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Resolution Options - Radio button group per UI.md */}
      <div className="mb-4">
        <p className="text-body-md font-medium text-slate-900 mb-3">What would you like to do?</p>
        <div className="space-y-2">
          <label className={cn(
            'flex items-start p-3 rounded-xl border-2 cursor-pointer transition-colors',
            'hover:bg-gold-50',
            selectedResolution === 'accept_source'
              ? 'bg-gold-100 border-gold-500'
              : 'border-slate-200 bg-white',
          )}>
            <input
              type="radio"
              name={`resolution_${fieldLabel}`}
              value="accept_source"
              checked={selectedResolution === 'accept_source'}
              onChange={() => {
                setSelectedResolution('accept_source');
                if (onAcceptUploaded) onAcceptUploaded();
              }}
              className="mt-1 mr-3 text-gold-500 focus:ring-2 focus:ring-gold-500"
              aria-label="Use AIS value"
            />
            <div className="flex-1">
              <div className="text-body-md font-medium text-slate-900">
                ○ Use AIS value ({formatIndianCurrency(uploadedValue)})
              </div>
              <div className="text-body-sm text-slate-600 mt-1">
                Recommended if you have no additional documentation
              </div>
            </div>
          </label>

          <label className={cn(
            'flex items-start p-3 rounded-xl border-2 cursor-pointer transition-colors',
            'hover:bg-gold-50',
            selectedResolution === 'accept_manual'
              ? 'bg-gold-100 border-gold-500'
              : 'border-slate-200 bg-white',
          )}>
            <input
              type="radio"
              name={`resolution_${fieldLabel}`}
              value="accept_manual"
              checked={selectedResolution === 'accept_manual'}
              onChange={() => {
                setSelectedResolution('accept_manual');
                if (onAcceptManual) onAcceptManual();
              }}
              className="mt-1 mr-3 text-gold-500 focus:ring-2 focus:ring-gold-500"
              aria-label="Keep my value"
            />
            <div className="flex-1">
              <div className="text-body-md font-medium text-slate-900">
                ○ Keep my value ({formatIndianCurrency(manualValue)})
              </div>
              <div className="text-body-sm text-slate-600 mt-1">
                You may need to provide explanation during assessment
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Explanation Field - Optional textarea per UI.md */}
      {onExplain && (
        <div className="mb-4">
          <label className="block text-label-md font-medium text-slate-700 mb-2">
            Add explanation (optional):
          </label>
          <textarea
            value={explanationText}
            onChange={(e) => setExplanationText(e.target.value)}
            placeholder="Difference is due to..."
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            rows={3}
            aria-label="Explanation for discrepancy"
          />
        </div>
      )}

      {/* Primary CTA - Resolve Discrepancy */}
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowExplanation(false);
            setExplanationText(explanation || '');
          }}
          className="text-body-md"
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (onAcceptUploaded) {
              onAcceptUploaded();
            } else if (onAcceptManual) {
              onAcceptManual();
            }
            if (onExplain && explanationText.trim()) {
              onExplain(explanationText);
            }
          }}
          className="bg-gold-500 hover:bg-gold-600 text-white text-body-md"
          size="sm"
        >
          Resolve Discrepancy
        </Button>
      </div>
    </div>
  );
};

export default DiscrepancyPanel;

