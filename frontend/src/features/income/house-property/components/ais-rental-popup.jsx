// =====================================================
// AIS RENTAL INCOME POPUP COMPONENT
// Shows AIS rental income data and allows user to accept/reject
// =====================================================

import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, TrendingUp } from 'lucide-react';
import { useAISRentalIncome, useApplyAISRentalIncome, useCompareAISWithForm } from '../hooks/use-ais-integration';
import { housePropertyAISService } from '../services/ais-integration.service';
import SourceChip from '../../../../components/UI/SourceChip/SourceChip';
import Button from '../../../../components/common/Button';

const AISRentalIncomePopup = ({ filingId, formProperties = [], onClose, onApplied }) => {
  const [selectedProperties, setSelectedProperties] = useState([]);
  const { data: aisData, isLoading } = useAISRentalIncome(filingId);
  const applyAISMutation = useApplyAISRentalIncome(filingId);
  const { data: comparison } = useCompareAISWithForm(filingId, formProperties);

  const mappedProperties = aisData?.rentalIncome
    ? housePropertyAISService.mapAISToHouseProperty(aisData)
    : [];

  const toggleProperty = (propertyId) => {
    setSelectedProperties((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId],
    );
  };

  const handleApply = async () => {
    if (selectedProperties.length === 0) {
      return;
    }

    const propertiesToApply = mappedProperties.filter((prop) =>
      selectedProperties.includes(prop.id),
    );

    try {
      await applyAISMutation.mutateAsync(propertiesToApply);
      if (onApplied) {
        onApplied(propertiesToApply);
      }
      onClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleSelectAll = () => {
    if (selectedProperties.length === mappedProperties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(mappedProperties.map((prop) => prop.id));
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

  if (!aisData || !aisData.rentalIncome || mappedProperties.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">AIS Rental Income</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 text-center">
            <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No rental income data found in AIS</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-gold-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AIS Rental Income Data</h3>
              <p className="text-sm text-gray-500">
                Found {mappedProperties.length} propert{mappedProperties.length !== 1 ? 'ies' : 'y'} in AIS
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

        {/* Properties List */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedProperties.length === mappedProperties.length && mappedProperties.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-gold-600 rounded focus:ring-2 focus:ring-gold-500"
              />
              <span className="text-sm font-medium text-gray-700">Select All</span>
            </label>
            <SourceChip source="ais" size="sm" />
          </div>

          {mappedProperties.map((property) => {
            const discrepancy = comparison?.discrepancies.find(
              (d) => d.property === property.propertyAddress,
            );
            const isSelected = selectedProperties.includes(property.id);

            return (
              <div
                key={property.id}
                className={`border rounded-lg p-4 ${
                  isSelected ? 'border-gold-500 bg-gold-50' : 'border-gray-200'
                } ${discrepancy ? 'border-yellow-300' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleProperty(property.id)}
                    className="mt-1 w-4 h-4 text-gold-600 rounded focus:ring-2 focus:ring-gold-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {property.propertyAddress || 'Property Address Not Available'}
                        </h4>
                        {property.sourceData?.pan && (
                          <p className="text-xs text-gray-500 mt-1">PAN: {property.sourceData.pan}</p>
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
                        <p className="text-xs text-gray-500">Annual Rental Income</p>
                        <p className="text-sm font-semibold text-gray-900">
                          ₹{property.annualRentalIncome?.toLocaleString('en-IN') || '0'}
                        </p>
                        {discrepancy && discrepancy.field === 'annualRentalIncome' && (
                          <p className="text-xs text-yellow-600 mt-1">
                            Form: ₹{discrepancy.formValue?.toLocaleString('en-IN') || '0'}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Municipal Taxes</p>
                        <p className="text-sm font-semibold text-gray-900">
                          ₹{property.municipalTaxes?.toLocaleString('en-IN') || '0'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">TDS Deducted</p>
                        <p className="text-sm font-semibold text-gray-900">
                          ₹{property.tdsDeducted?.toLocaleString('en-IN') || '0'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Confidence</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {((property.sourceData?.confidence || 0.9) * 100).toFixed(0)}%
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

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {selectedProperties.length} of {mappedProperties.length} propert
            {mappedProperties.length !== 1 ? 'ies' : 'y'} selected
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={selectedProperties.length === 0 || applyAISMutation.isPending}
            >
              {applyAISMutation.isPending ? 'Applying...' : `Apply ${selectedProperties.length} Propert${selectedProperties.length !== 1 ? 'ies' : 'y'}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISRentalIncomePopup;

