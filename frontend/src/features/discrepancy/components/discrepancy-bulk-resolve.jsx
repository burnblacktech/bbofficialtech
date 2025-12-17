// =====================================================
// DISCREPANCY BULK RESOLVE COMPONENT
// Bulk resolve similar discrepancies
// =====================================================

import React, { useState } from 'react';
import { CheckSquare, Square, AlertCircle } from 'lucide-react';
import Button from '../../../components/DesignSystem/components/Button';

const DiscrepancyBulkResolve = ({
  discrepancies = [],
  onBulkResolve,
  onSelectAll,
  selectedIds = [],
}) => {
  const [resolutionAction, setResolutionAction] = useState('accept_source');

  const handleSelectAll = () => {
    if (selectedIds.length === discrepancies.length) {
      onSelectAll([]);
    } else {
      onSelectAll(discrepancies.map((d) => d.id));
    }
  };

  const handleBulkResolve = () => {
    if (selectedIds.length === 0) {
      return;
    }
    onBulkResolve(selectedIds, resolutionAction);
  };

  const similarDiscrepancies = discrepancies.filter((d) => {
    // Group by field type and source
    return discrepancies.some(
      (other) =>
        other.id !== d.id &&
        other.field === d.field &&
        other.source === d.source &&
        other.severity === d.severity,
    );
  });

  if (discrepancies.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-heading-md text-gray-800">Bulk Resolve</h3>
          <p className="text-body-sm text-slate-600 mt-1">
            Select multiple discrepancies and resolve them at once
          </p>
        </div>
        <button
          onClick={handleSelectAll}
          className="flex items-center text-body-sm text-gold-600 hover:text-gold-700"
        >
          {selectedIds.length === discrepancies.length ? (
            <>
              <CheckSquare className="h-4 w-4 mr-1" />
              Deselect All
            </>
          ) : (
            <>
              <Square className="h-4 w-4 mr-1" />
              Select All
            </>
          )}
        </button>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckSquare className="h-5 w-5 text-gold-600 mr-2" />
              <span className="text-body-md font-semibold text-gold-900">
                {selectedIds.length} discrepancy(ies) selected
              </span>
            </div>
          </div>
        </div>
      )}

      {similarDiscrepancies.length > 0 && (
        <div className="bg-info-50 border border-info-200 rounded-xl p-4 mb-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-info-600 mt-0.5 mr-2" />
            <div>
              <p className="text-body-sm font-semibold text-info-900 mb-1">
                Similar Discrepancies Found
              </p>
              <p className="text-body-sm text-info-700">
                {similarDiscrepancies.length} discrepancies have similar patterns. Consider resolving
                them together.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="space-y-4">
          <div>
            <label className="block text-body-sm font-medium text-slate-700 mb-2">
              Resolution Action
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 rounded-xl border-2 border-slate-200 hover:border-gold-300 cursor-pointer">
                <input
                  type="radio"
                  name="resolutionAction"
                  value="accept_source"
                  checked={resolutionAction === 'accept_source'}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="mr-3"
                />
                <span className="text-body-md text-gray-800">
                  Accept source value for all selected
                </span>
              </label>
              <label className="flex items-center p-3 rounded-xl border-2 border-slate-200 hover:border-gold-300 cursor-pointer">
                <input
                  type="radio"
                  name="resolutionAction"
                  value="keep_manual"
                  checked={resolutionAction === 'keep_manual'}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="mr-3"
                />
                <span className="text-body-md text-gray-800">
                  Keep manual value for all selected
                </span>
              </label>
              <label className="flex items-center p-3 rounded-xl border-2 border-slate-200 hover:border-gold-300 cursor-pointer">
                <input
                  type="radio"
                  name="resolutionAction"
                  value="mark_intentional"
                  checked={resolutionAction === 'mark_intentional'}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="mr-3"
                />
                <span className="text-body-md text-gray-800">
                  Mark as intentional for all selected
                </span>
              </label>
            </div>
          </div>

          <Button onClick={handleBulkResolve} className="w-full">
            Resolve {selectedIds.length} Selected
          </Button>
        </div>
      )}
    </div>
  );
};

export default DiscrepancyBulkResolve;

