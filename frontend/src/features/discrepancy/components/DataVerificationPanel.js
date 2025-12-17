// =====================================================
// DATA VERIFICATION PANEL
// Display discrepancies between manual input and uploaded/scanned data
// =====================================================

import React, { useState, useEffect } from 'react';
import { enterpriseLogger } from '../../../utils/logger';
import { AlertTriangle, CheckCircle, Info, X, ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '../../../services/core/APIClient';
import DiscrepancyPanel from './DiscrepancyPanel';
import DiscrepancyManager from './DiscrepancyManager';
import DiscrepancyHistory from './DiscrepancyHistory';
import { useDiscrepancies, useDiscrepancySuggestions, useDiscrepancyHistory, useResolveDiscrepancy, useBulkResolveDiscrepancies } from '../hooks/useDiscrepancies';

const DataVerificationPanel = ({ formData, uploadedData, onResolve, filingId, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // Use React Query hooks if filingId is provided
  const { data: discrepanciesData, isLoading } = filingId
    ? useDiscrepancies(filingId)
    : { data: null, isLoading: false };

  const { data: suggestionsData } = filingId
    ? useDiscrepancySuggestions(filingId)
    : { data: null };

  const { data: historyData } = filingId
    ? useDiscrepancyHistory(filingId)
    : { data: null };

  const resolveMutation = useResolveDiscrepancy(filingId);
  const bulkResolveMutation = useBulkResolveDiscrepancies(filingId);

  const discrepancies = discrepanciesData?.discrepancies || [];
  const grouped = discrepanciesData?.grouped || {};
  const suggestions = suggestionsData?.suggestions || [];
  const history = historyData?.history || [];

  const handleResolve = async (discrepancy, action, resolvedValue, explanation) => {
    if (filingId && resolveMutation) {
      try {
        await resolveMutation.mutateAsync({
          discrepancyId: discrepancy.fieldPath,
          fieldPath: discrepancy.fieldPath,
          resolutionAction: action,
          resolvedValue,
          explanation,
          discrepancy,
        });
        if (onResolve) {
          onResolve(discrepancy.fieldPath, action);
        }
      } catch (error) {
        enterpriseLogger.error('Failed to resolve discrepancy', { error });
      }
    } else if (onResolve) {
      onResolve(discrepancy.fieldPath || discrepancy, action);
    }
  };

  const handleBulkResolve = async (selectedDiscrepancies, action) => {
    if (filingId && bulkResolveMutation) {
      try {
        const discrepancyIds = selectedDiscrepancies.map(d => d.fieldPath || d.id);
        await bulkResolveMutation.mutateAsync({
          discrepancyIds,
          resolutionAction: action,
        });
      } catch (error) {
        enterpriseLogger.error('Failed to bulk resolve discrepancies', { error });
      }
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-error-500" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning-500" aria-hidden="true" />;
      default:
        return <Info className="w-5 h-5 text-info-500" aria-hidden="true" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-error-50 border-error-200';
      case 'warning':
        return 'bg-warning-50 border-warning-200';
      default:
        return 'bg-info-50 border-info-200';
    }
  };

  if (!formData || !uploadedData) {
    return null;
  }

  if (discrepancies.length === 0 && !isLoading) {
    return (
      <div className="bg-success-50 border border-success-200 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-success-500" aria-hidden="true" />
          <p className="text-body-md text-success-900 font-medium">
            No discrepancies found. All data matches!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-slate-200 rounded-xl ${className}`}>
      {/* Discrepancy Banner - UI.md pattern */}
      {discrepancies.length > 0 && (
        <div className="bg-warning-50 border border-warning-200 rounded-t-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning-500" aria-hidden="true" />
              <p className="text-body-md text-warning-900">
                <span className="font-semibold">{discrepancies.length}</span> discrepancy{discrepancies.length !== 1 ? 'ies' : ''} found between your entries and AIS data.
              </p>
            </div>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-body-sm text-gold-600 hover:text-gold-700 font-medium focus:outline-none focus:ring-2 focus:ring-gold-500 rounded"
            >
              Review All →
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-200"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          {getSeverityIcon(discrepancies[0]?.severity || 'info')}
          <h3 className="text-heading-sm font-semibold text-slate-900">
            Data Verification
            {discrepancies.length > 0 && (
              <span className="ml-2 text-body-md font-normal text-slate-600">
                ({discrepancies.length} discrepancy{discrepancies.length !== 1 ? 'ies' : ''})
              </span>
            )}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {filingId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowHistory(!showHistory);
              }}
              className="text-body-sm text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-gold-500 rounded"
              aria-label={showHistory ? 'Hide history' : 'Show history'}
            >
              {showHistory ? 'Hide' : 'Show'} History
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-slate-200 p-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-body-md text-slate-600">Checking for discrepancies...</p>
            </div>
          ) : (
            <>
              {/* Enhanced Discrepancy Manager */}
              {filingId ? (
                <DiscrepancyManager
                  discrepancies={discrepancies}
                  grouped={grouped}
                  suggestions={suggestions}
                  onResolve={handleResolve}
                  onBulkResolve={handleBulkResolve}
                />
              ) : (
                // Fallback to simple display if no filingId
                discrepancies.map((discrepancy, index) => (
                  <DiscrepancyPanel
                    key={index}
                    fieldLabel={discrepancy.fieldLabel || discrepancy.fieldPath}
                    manualValue={discrepancy.manualValue}
                    uploadedValue={discrepancy.uploadedValue}
                    source={discrepancy.source}
                    onAcceptManual={() => handleResolve(discrepancy, 'accept_manual', discrepancy.manualValue)}
                    onAcceptUploaded={() => handleResolve(discrepancy, 'accept_source', discrepancy.uploadedValue)}
                    onExplain={(explanation) => {
                      handleResolve(discrepancy, 'explained', null, explanation);
                    }}
                    explanation={discrepancy.explanation}
                    className={getSeverityColor(discrepancy.severity)}
                  />
                ))
              )}

              {/* Resolution History */}
              {showHistory && filingId && history.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <DiscrepancyHistory
                    history={history}
                    onExport={() => {
                      // Export functionality
                      console.log('Export discrepancy history');
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DataVerificationPanel;

