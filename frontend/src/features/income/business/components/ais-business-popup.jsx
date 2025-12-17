// =====================================================
// AIS BUSINESS INCOME POPUP COMPONENT
// Shows AIS business income data and allows user to accept/reject
// =====================================================

import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, Building2 } from 'lucide-react';
import { useAISBusinessIncome, useApplyAISBusinessIncome, useCompareAISWithForm } from '../hooks/use-ais-integration';
import { businessIncomeAISService } from '../services/ais-integration.service';
import SourceChip from '../../../../components/UI/SourceChip/SourceChip';
import Button from '../../../../components/DesignSystem/components/Button';

const AISBusinessPopup = ({ filingId, formBusinesses = [], onClose, onApplied }) => {
  const [selectedBusinesses, setSelectedBusinesses] = useState([]);
  const { data: aisData, isLoading } = useAISBusinessIncome(filingId);
  const applyAISMutation = useApplyAISBusinessIncome(filingId);
  const { comparison } = useCompareAISWithForm(filingId, formBusinesses);

  const mappedData = aisData?.businessIncome
    ? businessIncomeAISService.mapAISToBusinessIncome(aisData)
    : [];

  const toggleBusiness = (businessId) => {
    setSelectedBusinesses((prev) =>
      prev.includes(businessId)
        ? prev.filter((id) => id !== businessId)
        : [...prev, businessId],
    );
  };

  const handleApply = async () => {
    if (selectedBusinesses.length === 0) {
      return;
    }

    const businessesToApply = mappedData.filter((business) =>
      selectedBusinesses.includes(business.id),
    );

    try {
      await applyAISMutation.mutateAsync(businessesToApply);
      if (onApplied) {
        onApplied({ businesses: businessesToApply });
      }
      onClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleSelectAll = () => {
    if (selectedBusinesses.length === mappedData.length) {
      setSelectedBusinesses([]);
    } else {
      setSelectedBusinesses(mappedData.map((business) => business.id));
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading AIS data...</p>
        </div>
      </div>
    );
  }

  if (!aisData || !aisData.businessIncome || mappedData.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
            <h3 className="text-heading-4 font-semibold text-slate-900">AIS Business Income</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 text-center">
            <Info className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No business income data found in AIS</p>
            <p className="text-body-regular text-slate-500 mt-2">
              Business income from Section 194C (TDS on contractors) will appear here
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalSelected = selectedBusinesses.length;
  const totalBusinesses = mappedData.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-gold-600" />
            <div>
              <h3 className="text-heading-4 font-semibold text-slate-900">AIS Business Income Data</h3>
              <p className="text-body-regular text-slate-500">
                Found {totalBusinesses} business{totalBusinesses !== 1 ? 'es' : ''} in AIS
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Summary */}
        {comparison && (comparison.conflicts.length > 0 || comparison.newEntries.length > 0) && (
          <div className="p-4 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-body-regular font-medium text-yellow-900">
                  {comparison.summary.newCount} new business{comparison.summary.newCount !== 1 ? 'es' : ''} found
                  {comparison.summary.conflictCount > 0 && `, ${comparison.summary.conflictCount} conflict${comparison.summary.conflictCount !== 1 ? 's' : ''}`}
                </p>
                <p className="text-body-small text-yellow-700 mt-1">
                  Review the data below before applying to your form.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Selection Controls */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedBusinesses.length === mappedData.length && mappedData.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-gold-600 border-slate-300 rounded focus:ring-gold-500"
              />
              <span className="text-body-regular font-medium text-slate-700">Select All</span>
            </label>
            <span className="text-body-regular text-slate-500">
              {totalSelected} of {totalBusinesses} selected
            </span>
          </div>
        </div>

        {/* Business List */}
        <div className="p-4 space-y-4">
          {mappedData.map((business) => {
            const isSelected = selectedBusinesses.includes(business.id);
            const isNew = comparison?.newEntries.some((e) => e.id === business.id);
            const conflict = comparison?.conflicts.find((c) => c.ais.id === business.id);

            return (
              <div
                key={business.id}
                className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-gold-500 bg-gold-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => toggleBusiness(business.id)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleBusiness(business.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 w-4 h-4 text-gold-600 border-slate-300 rounded focus:ring-gold-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-slate-900">{business.businessName}</h4>
                          {isNew && (
                            <span className="px-2 py-0.5 text-body-small font-medium bg-green-100 text-green-800 rounded">
                              New
                            </span>
                          )}
                          {conflict && (
                            <span className="px-2 py-0.5 text-body-small font-medium bg-yellow-100 text-yellow-800 rounded">
                              Conflict
                            </span>
                          )}
                          <SourceChip source="ais" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-body-regular">
                          <div>
                            <span className="text-slate-500">Gross Receipts:</span>
                            <p className="font-medium text-slate-900">
                              ₹{business.pnl.grossReceipts.toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">TDS Deducted:</span>
                            <p className="font-medium text-slate-900">
                              ₹{business.pnl.tdsDeducted.toLocaleString('en-IN')}
                            </p>
                          </div>
                          {business.businessPAN && (
                            <div>
                              <span className="text-slate-500">PAN:</span>
                              <p className="font-medium text-slate-900">{business.businessPAN}</p>
                            </div>
                          )}
                          {business.gstNumber && (
                            <div>
                              <span className="text-slate-500">GST:</span>
                              <p className="font-medium text-slate-900">{business.gstNumber}</p>
                            </div>
                          )}
                        </div>
                        {business.businessNature && (
                          <p className="text-body-regular text-slate-500 mt-2">
                            Nature: {business.businessNature}
                          </p>
                        )}
                        {business.entries && business.entries.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-body-small text-slate-500 mb-2">
                              {business.entries.length} TDS entr{business.entries.length !== 1 ? 'ies' : 'y'} from Section 194C
                            </p>
                            <div className="space-y-1">
                              {business.entries.slice(0, 3).map((entry, idx) => (
                                <div key={idx} className="text-body-small text-slate-600 flex items-center justify-between">
                                  <span>
                                    {entry.date ? new Date(entry.date).toLocaleDateString('en-IN') : 'N/A'}
                                  </span>
                                  <span className="font-medium">
                                    ₹{entry.amount.toLocaleString('en-IN')} (TDS: ₹{entry.tds.toLocaleString('en-IN')})
                                  </span>
                                </div>
                              ))}
                              {business.entries.length > 3 && (
                                <p className="text-body-small text-slate-500">
                                  +{business.entries.length - 3} more entr{business.entries.length - 3 !== 1 ? 'ies' : 'y'}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-gold-600 flex-shrink-0" />
                      )}
                    </div>
                    {conflict && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                          <div className="flex-1 text-body-small">
                            <p className="font-medium text-yellow-900 mb-1">Amount Mismatch</p>
                            <p className="text-yellow-700">
                              AIS: ₹{conflict.ais.pnl.grossReceipts.toLocaleString('en-IN')} |
                              Form: ₹{conflict.form.pnl?.grossReceipts?.toLocaleString('en-IN') || '0'}
                            </p>
                            <p className="text-yellow-600 mt-1">
                              Difference: ₹{conflict.difference.toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex items-center justify-between">
          <div className="text-body-regular text-slate-600">
            {totalSelected > 0 && (
              <span>
                {totalSelected} business{totalSelected !== 1 ? 'es' : ''} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={totalSelected === 0 || applyAISMutation.isPending}
              className="px-4 py-2"
            >
              {applyAISMutation.isPending ? 'Applying...' : `Apply ${totalSelected} Business${totalSelected !== 1 ? 'es' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISBusinessPopup;

