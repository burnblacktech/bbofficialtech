// =====================================================
// DISCREPANCY GROUP COMPONENT
// Component for grouped discrepancies display
// =====================================================

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';
import DiscrepancyPanel from './DiscrepancyPanel';
import { cn } from '../../../utils';
import Button from '../../../components/DesignSystem/components/Button';

const DiscrepancyGroup = ({
  section,
  discrepancies = [],
  selectedIndices = new Set(),
  onSelect,
  onResolve,
  onBulkResolve,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const criticalCount = discrepancies.filter(d => d.severity === 'critical').length;
  const warningCount = discrepancies.filter(d => d.severity === 'warning').length;
  const infoCount = discrepancies.filter(d => d.severity === 'info').length;

  const getSeverityColor = () => {
    if (criticalCount > 0) return 'border-error-200 bg-error-50';
    if (warningCount > 0) return 'border-warning-200 bg-warning-50';
    return 'border-info-200 bg-info-50';
  };

  const allSelected = discrepancies.every((_, index) => selectedIndices.has(index));
  const someSelected = discrepancies.some((_, index) => selectedIndices.has(index));

  return (
    <div className={cn('rounded-xl border', getSeverityColor())}>
      {/* Group Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-opacity-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              discrepancies.forEach((_, index) => {
                if (onSelect) {
                  onSelect(index);
                }
              });
            }}
            className="text-slate-600 hover:text-slate-900"
          >
            {allSelected ? (
              <CheckSquare className="h-5 w-5" />
            ) : someSelected ? (
              <Square className="h-5 w-5 border-2" />
            ) : (
              <Square className="h-5 w-5" />
            )}
          </button>
          <div>
            <h4 className="text-heading-sm font-semibold text-slate-900 capitalize">
              {section.replace(/_/g, ' ')}
            </h4>
            <p className="text-body-md text-slate-600 mt-1">
              {discrepancies.length} discrepancy{discrepancies.length !== 1 ? 'ies' : ''}
              {criticalCount > 0 && ` • ${criticalCount} critical`}
              {warningCount > 0 && ` • ${warningCount} warning`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {someSelected && onBulkResolve && (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                onClick={() => onBulkResolve('accept_source')}
                size="sm"
                variant="outline"
              >
                Accept All Source
              </Button>
              <Button
                onClick={() => onBulkResolve('accept_manual')}
                size="sm"
                variant="outline"
              >
                Keep All Manual
              </Button>
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </div>

      {/* Group Content */}
      {isExpanded && (
        <div className="border-t border-current border-opacity-20 p-4 space-y-3">
          {discrepancies.map((discrepancy, index) => (
            <div key={index} className="flex items-start gap-2">
              <button
                onClick={() => {
                  if (onSelect) {
                    onSelect(index);
                  }
                }}
                className="mt-1 text-slate-600 hover:text-slate-900"
              >
                {selectedIndices.has(index) ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
              <div className="flex-1">
                <DiscrepancyPanel
                  fieldLabel={discrepancy.fieldLabel || discrepancy.fieldName || discrepancy.fieldPath}
                  manualValue={discrepancy.manualValue}
                  uploadedValue={discrepancy.uploadedValue || discrepancy.sourceValue}
                  source={discrepancy.source}
                  onAcceptManual={() => {
                    if (onResolve) {
                      onResolve(discrepancy, 'accept_manual', discrepancy.manualValue);
                    }
                  }}
                  onAcceptUploaded={() => {
                    if (onResolve) {
                      onResolve(discrepancy, 'accept_source', discrepancy.uploadedValue || discrepancy.sourceValue);
                    }
                  }}
                  onExplain={(explanation) => {
                    if (onResolve) {
                      onResolve(discrepancy, 'explained', null, explanation);
                    }
                  }}
                  explanation={discrepancy.explanation}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscrepancyGroup;

