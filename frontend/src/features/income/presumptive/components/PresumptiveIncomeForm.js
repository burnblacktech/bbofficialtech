// =====================================================
// PRESUMPTIVE INCOME FORM COMPONENT
// =====================================================

import React, { useState } from 'react';

const PresumptiveIncomeForm = ({ data = {}, onChange, onNext, onPrevious }) => {
  const [formData, setFormData] = useState({
    businessType: data.businessType || '',
    turnover: data.turnover || '',
    presumptiveRate: data.presumptiveRate || '',
    presumptiveIncome: data.presumptiveIncome || '',
    ...data,
  });

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    if (onChange) {
      onChange(newData);
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext(formData);
    }
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Presumptive Income Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Type
            </label>
            <select
              value={formData.businessType}
              onChange={(e) => handleChange('businessType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="">Select business type</option>
              <option value="retail_trade">Retail Trade</option>
              <option value="wholesale_trade">Wholesale Trade</option>
              <option value="civil_construction">Civil Construction</option>
              <option value="transport">Transport</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annual Turnover (₹)
            </label>
            <input
              type="number"
              value={formData.turnover}
              onChange={(e) => handleChange('turnover', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="Enter annual turnover"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Presumptive Rate (%)
            </label>
            <input
              type="number"
              value={formData.presumptiveRate}
              onChange={(e) => handleChange('presumptiveRate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="Enter presumptive rate"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Presumptive Income (₹)
            </label>
            <input
              type="number"
              value={formData.presumptiveIncome}
              onChange={(e) => handleChange('presumptiveIncome', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="Enter presumptive income"
            />
          </div>
        </div>

        {(onPrevious || onNext) && (
          <div className="mt-6 flex justify-between">
            {onPrevious && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Previous
              </button>
            )}
            {onNext && (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PresumptiveIncomeForm;

