// =====================================================
// AIS CAPITAL GAINS POPUP COMPONENT
// Shows AIS capital gains data and allows user to accept/reject
// =====================================================

import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, TrendingUp } from 'lucide-react';
import { useAISCapitalGains, useApplyAISCapitalGains, useCompareAISWithForm } from '../hooks/use-ais-integration';
import { capitalGainsAISService } from '../services/ais-integration.service';
import SourceChip from '../../../../components/UI/SourceChip/SourceChip';
import Button from '../../../../components/common/Button';

const AISCapitalGainsPopup = ({ filingId, formSTCG = [], formLTCG = [], onClose, onApplied }) => {
  const [selectedSTCG, setSelectedSTCG] = useState([]);
  const [selectedLTCG, setSelectedLTCG] = useState([]);
  const { data: aisData, isLoading } = useAISCapitalGains(filingId);
  const applyAISMutation = useApplyAISCapitalGains(filingId);
  const { data: comparison } = useCompareAISWithForm(filingId, formSTCG, formLTCG);

  const mappedData = aisData?.capitalGains
    ? capitalGainsAISService.mapAISToCapitalGains(aisData)
    : { stcgEntries: [], ltcgEntries: [] };

  const toggleSTCG = (entryId) => {
    setSelectedSTCG((prev) =>
      prev.includes(entryId)
        ? prev.filter((id) => id !== entryId)
        : [...prev, entryId],
    );
  };

  const toggleLTCG = (entryId) => {
    setSelectedLTCG((prev) =>
      prev.includes(entryId)
        ? prev.filter((id) => id !== entryId)
        : [...prev, entryId],
    );
  };

  const handleApply = async () => {
    if (selectedSTCG.length === 0 && selectedLTCG.length === 0) {
      return;
    }

    const stcgToApply = mappedData.stcgEntries.filter((entry) =>
      selectedSTCG.includes(entry.id),
    );
    const ltcgToApply = mappedData.ltcgEntries.filter((entry) =>
      selectedLTCG.includes(entry.id),
    );

    try {
      await applyAISMutation.mutateAsync({
        stcgEntries: stcgToApply,
        ltcgEntries: ltcgToApply,
      });
      if (onApplied) {
        onApplied({ stcgEntries: stcgToApply, ltcgEntries: ltcgToApply });
      }
      onClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleSelectAll = (type) => {
    if (type === 'STCG') {
      if (selectedSTCG.length === mappedData.stcgEntries.length) {
        setSelectedSTCG([]);
      } else {
        setSelectedSTCG(mappedData.stcgEntries.map((entry) => entry.id));
      }
    } else {
      if (selectedLTCG.length === mappedData.ltcgEntries.length) {
        setSelectedLTCG([]);
      } else {
        setSelectedLTCG(mappedData.ltcgEntries.map((entry) => entry.id));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading AIS data...</p>
        </div>
      </div>
    );
  }

  if (!aisData || !aisData.capitalGains || (mappedData.stcgEntries.length === 0 && mappedData.ltcgEntries.length === 0)) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">AIS Capital Gains</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 text-center">
            <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No capital gains data found in AIS</p>
          </div>
        </div>
      </div>
    );
  }

  const totalSelected = selectedSTCG.length + selectedLTCG.length;
  const totalEntries = mappedData.stcgEntries.length + mappedData.ltcgEntries.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-gold-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AIS Capital Gains Data</h3>
              <p className="text-sm text-gray-500">
                Found {totalEntries} transaction{totalEntries !== 1 ? 's' : ''} in AIS
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Summary */}
        {comparison && comparison.discrepancies.length > 0 && (
          <div className="p-4 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">
                  {comparison.discrepancies.length} discrepanc{comparison.discrepancies.length !== 1 ? 'ies' : 'y'} found
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Some AIS values differ from your form data. Please review before applying.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STCG Section */}
        {mappedData.stcgEntries.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">Short-term Capital Gains (STCG)</h4>
                <p className="text-sm text-gray-500">{mappedData.stcgEntries.length} entr{mappedData.stcgEntries.length !== 1 ? 'ies' : 'y'}</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSTCG.length === mappedData.stcgEntries.length && mappedData.stcgEntries.length > 0}
                    onChange={() => handleSelectAll('STCG')}
                    className="w-4 h-4 text-gold-600 rounded focus:ring-2 focus:ring-gold-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Select All</span>
                </label>
                <SourceChip source="ais" size="sm" />
              </div>
            </div>

            <div className="space-y-3">
              {mappedData.stcgEntries.map((entry) => {
                const discrepancy = comparison?.discrepancies.find(
                  (d) => d.type === 'STCG' && d.assetType === entry.assetType,
                );
                const isSelected = selectedSTCG.includes(entry.id);

                return (
                  <div
                    key={entry.id}
                    className={`border rounded-lg p-4 ${
                      isSelected ? 'border-gold-500 bg-gold-50' : 'border-gray-200'
                    } ${discrepancy ? 'border-yellow-300' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSTCG(entry.id)}
                        className="mt-1 w-4 h-4 text-gold-600 rounded focus:ring-2 focus:ring-gold-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-semibold text-gray-900">
                              {entry.assetType?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Unknown Asset'}
                            </h5>
                            {entry.sourceData?.pan && (
                              <p className="text-xs text-gray-500 mt-1">PAN: {entry.sourceData.pan}</p>
                            )}
                          </div>
                          {discrepancy && (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
                              Discrepancy
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                          <div>
                            <p className="text-xs text-gray-500">Sale Value</p>
                            <p className="text-sm font-semibold text-gray-900">
                              ₹{entry.saleValue?.toLocaleString('en-IN') || '0'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Purchase Value</p>
                            <p className="text-sm font-semibold text-gray-900">
                              ₹{entry.purchaseValue?.toLocaleString('en-IN') || '0'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Gain Amount</p>
                            <p className="text-sm font-semibold text-gray-900">
                              ₹{entry.gainAmount?.toLocaleString('en-IN') || '0'}
                            </p>
                            {discrepancy && discrepancy.field === 'gainAmount' && (
                              <p className="text-xs text-yellow-600 mt-1">
                                Form: ₹{discrepancy.formValue?.toLocaleString('en-IN') || '0'}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Confidence</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {((entry.sourceData?.confidence || 0.9) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>

                        {discrepancy && (
                          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            <p>
                              <strong>Difference:</strong> ₹{discrepancy.difference?.toLocaleString('en-IN')}
                              {' - '}
                              {discrepancy.severity === 'critical'
                                ? 'Critical difference'
                                : discrepancy.severity === 'warning'
                                ? 'Significant difference'
                                : 'Minor difference'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LTCG Section */}
        {mappedData.ltcgEntries.length > 0 && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">Long-term Capital Gains (LTCG)</h4>
                <p className="text-sm text-gray-500">{mappedData.ltcgEntries.length} entr{mappedData.ltcgEntries.length !== 1 ? 'ies' : 'y'}</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLTCG.length === mappedData.ltcgEntries.length && mappedData.ltcgEntries.length > 0}
                    onChange={() => handleSelectAll('LTCG')}
                    className="w-4 h-4 text-gold-600 rounded focus:ring-2 focus:ring-gold-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Select All</span>
                </label>
                <SourceChip source="ais" size="sm" />
              </div>
            </div>

            <div className="space-y-3">
              {mappedData.ltcgEntries.map((entry) => {
                const discrepancy = comparison?.discrepancies.find(
                  (d) => d.type === 'LTCG' && d.assetType === entry.assetType,
                );
                const isSelected = selectedLTCG.includes(entry.id);

                return (
                  <div
                    key={entry.id}
                    className={`border rounded-lg p-4 ${
                      isSelected ? 'border-gold-500 bg-gold-50' : 'border-gray-200'
                    } ${discrepancy ? 'border-yellow-300' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleLTCG(entry.id)}
                        className="mt-1 w-4 h-4 text-gold-600 rounded focus:ring-2 focus:ring-gold-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-semibold text-gray-900">
                              {entry.assetType?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Unknown Asset'}
                            </h5>
                            {entry.sourceData?.pan && (
                              <p className="text-xs text-gray-500 mt-1">PAN: {entry.sourceData.pan}</p>
                            )}
                          </div>
                          {discrepancy && (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
                              Discrepancy
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                          <div>
                            <p className="text-xs text-gray-500">Sale Value</p>
                            <p className="text-sm font-semibold text-gray-900">
                              ₹{entry.saleValue?.toLocaleString('en-IN') || '0'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Indexed Cost</p>
                            <p className="text-sm font-semibold text-gray-900">
                              ₹{entry.indexedCost?.toLocaleString('en-IN') || '0'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Gain Amount</p>
                            <p className="text-sm font-semibold text-gray-900">
                              ₹{entry.gainAmount?.toLocaleString('en-IN') || '0'}
                            </p>
                            {discrepancy && discrepancy.field === 'gainAmount' && (
                              <p className="text-xs text-yellow-600 mt-1">
                                Form: ₹{discrepancy.formValue?.toLocaleString('en-IN') || '0'}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Confidence</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {((entry.sourceData?.confidence || 0.9) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>

                        {discrepancy && (
                          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            <p>
                              <strong>Difference:</strong> ₹{discrepancy.difference?.toLocaleString('en-IN')}
                              {' - '}
                              {discrepancy.severity === 'critical'
                                ? 'Critical difference'
                                : discrepancy.severity === 'warning'
                                ? 'Significant difference'
                                : 'Minor difference'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {totalSelected} of {totalEntries} transaction{totalEntries !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={totalSelected === 0 || applyAISMutation.isPending}
            >
              {applyAISMutation.isPending ? 'Applying...' : `Apply ${totalSelected} Transaction${totalSelected !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISCapitalGainsPopup;

