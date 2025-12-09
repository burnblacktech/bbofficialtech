// =====================================================
// AIS PROFESSIONAL INCOME POPUP COMPONENT
// Shows AIS professional income data and allows user to accept/reject
// =====================================================

import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, Briefcase } from 'lucide-react';
import { useAISProfessionalIncome, useApplyAISProfessionalIncome, useCompareAISWithForm } from '../hooks/use-ais-integration';
import { professionalIncomeAISService } from '../services/ais-integration.service';
import SourceChip from '../../../../components/UI/SourceChip/SourceChip';
import Button from '../../../../components/common/Button';

const AISProfessionalPopup = ({ filingId, formProfessions = [], onClose, onApplied }) => {
  const [selectedProfessions, setSelectedProfessions] = useState([]);
  const { data: aisData, isLoading } = useAISProfessionalIncome(filingId);
  const applyAISMutation = useApplyAISProfessionalIncome(filingId);
  const { comparison } = useCompareAISWithForm(filingId, formProfessions);

  const mappedData = aisData?.professionalIncome
    ? professionalIncomeAISService.mapAISToProfessionalIncome(aisData)
    : [];

  const toggleProfession = (professionId) => {
    setSelectedProfessions((prev) =>
      prev.includes(professionId)
        ? prev.filter((id) => id !== professionId)
        : [...prev, professionId],
    );
  };

  const handleApply = async () => {
    if (selectedProfessions.length === 0) {
      return;
    }

    const professionsToApply = mappedData.filter((profession) =>
      selectedProfessions.includes(profession.id),
    );

    try {
      await applyAISMutation.mutateAsync(professionsToApply);
      if (onApplied) {
        onApplied({ professions: professionsToApply });
      }
      onClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleSelectAll = () => {
    if (selectedProfessions.length === mappedData.length) {
      setSelectedProfessions([]);
    } else {
      setSelectedProfessions(mappedData.map((profession) => profession.id));
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

  if (!aisData || !aisData.professionalIncome || mappedData.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">AIS Professional Income</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 text-center">
            <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No professional income data found in AIS</p>
            <p className="text-sm text-gray-500 mt-2">
              Professional income from Section 194J (TDS on professional fees) will appear here
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalSelected = selectedProfessions.length;
  const totalProfessions = mappedData.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-gold-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AIS Professional Income Data</h3>
              <p className="text-sm text-gray-500">
                Found {totalProfessions} profession{totalProfessions !== 1 ? 's' : ''} in AIS
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Summary */}
        {comparison && (comparison.conflicts.length > 0 || comparison.newEntries.length > 0) && (
          <div className="p-4 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">
                  {comparison.summary.newCount} new profession{comparison.summary.newCount !== 1 ? 's' : ''} found
                  {comparison.summary.conflictCount > 0 && `, ${comparison.summary.conflictCount} conflict${comparison.summary.conflictCount !== 1 ? 's' : ''}`}
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Review the data below before applying to your form.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Selection Controls */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedProfessions.length === mappedData.length && mappedData.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-gold-600 border-gray-300 rounded focus:ring-gold-500"
              />
              <span className="text-sm font-medium text-gray-700">Select All</span>
            </label>
            <span className="text-sm text-gray-500">
              {totalSelected} of {totalProfessions} selected
            </span>
          </div>
        </div>

        {/* Profession List */}
        <div className="p-4 space-y-4">
          {mappedData.map((profession) => {
            const isSelected = selectedProfessions.includes(profession.id);
            const isNew = comparison?.newEntries.some((e) => e.id === profession.id);
            const conflict = comparison?.conflicts.find((c) => c.ais.id === profession.id);

            return (
              <div
                key={profession.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-gold-500 bg-gold-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleProfession(profession.id)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleProfession(profession.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 w-4 h-4 text-gold-600 border-gray-300 rounded focus:ring-gold-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{profession.professionName}</h4>
                          {isNew && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                              New
                            </span>
                          )}
                          {conflict && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                              Conflict
                            </span>
                          )}
                          <SourceChip source="ais" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Professional Fees:</span>
                            <p className="font-medium text-gray-900">
                              ₹{profession.pnl.professionalFees.toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">TDS Deducted:</span>
                            <p className="font-medium text-gray-900">
                              ₹{profession.pnl.tdsDeducted.toLocaleString('en-IN')}
                            </p>
                          </div>
                          {profession.professionType && (
                            <div>
                              <span className="text-gray-500">Type:</span>
                              <p className="font-medium text-gray-900">{profession.professionType}</p>
                            </div>
                          )}
                          {profession.registrationNumber && (
                            <div>
                              <span className="text-gray-500">Registration:</span>
                              <p className="font-medium text-gray-900">{profession.registrationNumber}</p>
                            </div>
                          )}
                        </div>
                        {profession.entries && profession.entries.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-2">
                              {profession.entries.length} TDS entr{profession.entries.length !== 1 ? 'ies' : 'y'} from Section 194J
                            </p>
                            <div className="space-y-1">
                              {profession.entries.slice(0, 3).map((entry, idx) => (
                                <div key={idx} className="text-xs text-gray-600 flex items-center justify-between">
                                  <span>
                                    {entry.date ? new Date(entry.date).toLocaleDateString('en-IN') : 'N/A'}
                                  </span>
                                  <span className="font-medium">
                                    ₹{entry.amount.toLocaleString('en-IN')} (TDS: ₹{entry.tds.toLocaleString('en-IN')})
                                  </span>
                                </div>
                              ))}
                              {profession.entries.length > 3 && (
                                <p className="text-xs text-gray-500">
                                  +{profession.entries.length - 3} more entr{profession.entries.length - 3 !== 1 ? 'ies' : 'y'}
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
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                          <div className="flex-1 text-xs">
                            <p className="font-medium text-yellow-900 mb-1">Amount Mismatch</p>
                            <p className="text-yellow-700">
                              AIS: ₹{conflict.ais.pnl.professionalFees.toLocaleString('en-IN')} |
                              Form: ₹{conflict.form.pnl?.professionalFees?.toLocaleString('en-IN') || '0'}
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
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {totalSelected > 0 && (
              <span>
                {totalSelected} profession{totalSelected !== 1 ? 's' : ''} selected
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
              {applyAISMutation.isPending ? 'Applying...' : `Apply ${totalSelected} Profession${totalSelected !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISProfessionalPopup;

