// =====================================================
// ITR-4 INCOME FORM COMPONENT
// For ITR-4 forms with presumptive taxation
// Includes salary, presumptive business/professional income, house property, other income
// =====================================================

import React, { useState, useEffect } from 'react';
import { Info, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import PresumptiveIncomeForm from './PresumptiveIncomeForm';
import HousePropertyForm from '../../house-property/components/HousePropertyForm';

const ITR4IncomeForm = ({ data, onUpdate, selectedITR, fullFormData, onDataUploaded }) => {
  const [presumptiveBusiness, setPresumptiveBusiness] = useState(data?.presumptiveBusiness || {
    hasPresumptiveBusiness: false,
    grossReceipts: 0,
    presumptiveRate: 8, // Default 8% for business
    presumptiveIncome: 0,
    optedOut: false,
  });

  const [presumptiveProfessional, setPresumptiveProfessional] = useState(data?.presumptiveProfessional || {
    hasPresumptiveProfessional: false,
    grossReceipts: 0,
    presumptiveRate: 50, // Default 50% for profession
    presumptiveIncome: 0,
    optedOut: false,
  });

  // Calculate presumptive income when gross receipts or rate changes
  useEffect(() => {
    if (presumptiveBusiness.hasPresumptiveBusiness && !presumptiveBusiness.optedOut) {
      const income = (presumptiveBusiness.grossReceipts * presumptiveBusiness.presumptiveRate) / 100;
      setPresumptiveBusiness(prev => ({ ...prev, presumptiveIncome: income }));
      onUpdate({
        presumptiveBusiness: {
          ...presumptiveBusiness,
          presumptiveIncome: income,
        },
      });
    }
  }, [presumptiveBusiness.grossReceipts, presumptiveBusiness.presumptiveRate, presumptiveBusiness.hasPresumptiveBusiness, presumptiveBusiness.optedOut]);

  useEffect(() => {
    if (presumptiveProfessional.hasPresumptiveProfessional && !presumptiveProfessional.optedOut) {
      const income = (presumptiveProfessional.grossReceipts * presumptiveProfessional.presumptiveRate) / 100;
      setPresumptiveProfessional(prev => ({ ...prev, presumptiveIncome: income }));
      onUpdate({
        presumptiveProfessional: {
          ...presumptiveProfessional,
          presumptiveIncome: income,
        },
      });
    }
  }, [presumptiveProfessional.grossReceipts, presumptiveProfessional.presumptiveRate, presumptiveProfessional.hasPresumptiveProfessional, presumptiveProfessional.optedOut]);

  const handleSalaryUpdate = (value) => {
    onUpdate({ salary: parseFloat(value) || 0 });
  };

  const handleHousePropertyUpdate = (updates) => {
    onUpdate({
      houseProperty: {
        ...data.houseProperty,
        ...updates,
      },
    });
  };

  const handleOtherIncomeUpdate = (value) => {
    onUpdate({ otherIncome: parseFloat(value) || 0 });
  };

  const handlePresumptiveBusinessUpdate = (field, value) => {
    const updated = { ...presumptiveBusiness, [field]: value };
    setPresumptiveBusiness(updated);
    onUpdate({ presumptiveBusiness: updated });
  };

  const handlePresumptiveProfessionalUpdate = (field, value) => {
    const updated = { ...presumptiveProfessional, [field]: value };
    setPresumptiveProfessional(updated);
    onUpdate({ presumptiveProfessional: updated });
  };

  return (
    <div className="space-y-6">
      {/* Salary Income Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-4">Salary Income</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Salary Income (₹)</label>
          <input
            type="number"
            value={data.salary || 0}
            onChange={(e) => handleSalaryUpdate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
      </div>

      {/* Presumptive Business Income Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">Presumptive Business Income (Section 44AD)</h4>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={presumptiveBusiness.hasPresumptiveBusiness}
              onChange={(e) => handlePresumptiveBusinessUpdate('hasPresumptiveBusiness', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-gold-500"
            />
            <label className="text-sm text-gray-700">I have presumptive business income</label>
          </div>
        </div>

        {presumptiveBusiness.hasPresumptiveBusiness && (
          <div className="space-y-4 mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Presumptive Taxation (Section 44AD)</p>
                <p>Applicable for businesses with turnover up to ₹2 crores. Presumptive income is calculated at 8% of gross receipts (or 6% for digital receipts).</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={presumptiveBusiness.optedOut}
                onChange={(e) => handlePresumptiveBusinessUpdate('optedOut', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-gold-500"
              />
              <label className="text-sm text-gray-700">Opt out of presumptive scheme (declare actual profit)</label>
            </div>

            {!presumptiveBusiness.optedOut ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gross Receipts/Turnover (₹)
                    </label>
                    <input
                      type="number"
                      value={presumptiveBusiness.grossReceipts || 0}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        if (value > 20000000) {
                          toast.error('Turnover cannot exceed ₹2 crores for ITR-4. Consider ITR-3 for higher turnover.');
                          return;
                        }
                        handlePresumptiveBusinessUpdate('grossReceipts', value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum ₹2 crores for ITR-4</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Presumptive Rate (%)
                    </label>
                    <select
                      value={presumptiveBusiness.presumptiveRate}
                      onChange={(e) => handlePresumptiveBusinessUpdate('presumptiveRate', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    >
                      <option value={8}>8% (Non-digital receipts)</option>
                      <option value={6}>6% (Digital receipts)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Presumptive Income (Auto-calculated):</span>
                    <span className="text-lg font-bold text-blue-600">
                      ₹{presumptiveBusiness.presumptiveIncome.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {presumptiveBusiness.presumptiveRate}% of ₹{presumptiveBusiness.grossReceipts.toLocaleString('en-IN')}
                  </p>
                </div>
              </>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  You have opted out of presumptive scheme. Please provide actual profit/loss details in the business income section.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Presumptive Professional Income Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">Presumptive Professional Income (Section 44ADA)</h4>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={presumptiveProfessional.hasPresumptiveProfessional}
              onChange={(e) => handlePresumptiveProfessionalUpdate('hasPresumptiveProfessional', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-gold-500"
            />
            <label className="text-sm text-gray-700">I have presumptive professional income</label>
          </div>
        </div>

        {presumptiveProfessional.hasPresumptiveProfessional && (
          <div className="space-y-4 mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Presumptive Taxation (Section 44ADA)</p>
                <p>Applicable for professionals with receipts up to ₹50 lakhs. Presumptive income is calculated at 50% of gross receipts.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={presumptiveProfessional.optedOut}
                onChange={(e) => handlePresumptiveProfessionalUpdate('optedOut', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-gold-500"
              />
              <label className="text-sm text-gray-700">Opt out of presumptive scheme (declare actual income)</label>
            </div>

            {!presumptiveProfessional.optedOut ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gross Receipts (₹)
                    </label>
                    <input
                      type="number"
                      value={presumptiveProfessional.grossReceipts || 0}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        if (value > 5000000) {
                          toast.error('Receipts cannot exceed ₹50 lakhs for ITR-4. Consider ITR-3 for higher receipts.');
                          return;
                        }
                        handlePresumptiveProfessionalUpdate('grossReceipts', value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum ₹50 lakhs for ITR-4</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Presumptive Rate (%)
                    </label>
                    <input
                      type="number"
                      value={presumptiveProfessional.presumptiveRate}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Fixed at 50% for professionals</p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Presumptive Income (Auto-calculated):</span>
                    <span className="text-lg font-bold text-blue-600">
                      ₹{presumptiveProfessional.presumptiveIncome.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    50% of ₹{presumptiveProfessional.grossReceipts.toLocaleString('en-IN')}
                  </p>
                </div>
              </>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  You have opted out of presumptive scheme. Please provide actual income/expense details in the professional income section.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* House Property Form */}
      <div className="border border-gray-200 rounded-lg p-4">
        <HousePropertyForm
          data={data.houseProperty || { properties: [] }}
          onUpdate={handleHousePropertyUpdate}
          selectedITR={selectedITR}
          onDataUploaded={onDataUploaded}
        />
      </div>

      {/* Other Income Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-4">Other Income</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Other Income (₹)</label>
          <input
            type="number"
            value={data.otherIncome || 0}
            onChange={(e) => handleOtherIncomeUpdate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
          <p className="text-xs text-gray-500 mt-1">Interest, dividends, winnings, etc.</p>
        </div>
      </div>
    </div>
  );
};

export default ITR4IncomeForm;

