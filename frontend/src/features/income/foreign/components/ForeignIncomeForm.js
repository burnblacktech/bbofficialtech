// =====================================================
// FOREIGN INCOME FORM COMPONENT
// For ITR-2 and ITR-3 forms
// Supports DTAA (Double Taxation Avoidance Agreement) claims
// =====================================================

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Globe, AlertCircle } from 'lucide-react';

const ForeignIncomeForm = ({ data, onUpdate, selectedITR }) => {
  const [hasForeignIncome, setHasForeignIncome] = useState(data?.hasForeignIncome || false);
  const [foreignIncomeDetails, setForeignIncomeDetails] = useState(data?.foreignIncomeDetails || []);

  useEffect(() => {
    // Initialize with empty array if not present
    if (!data?.foreignIncomeDetails && hasForeignIncome) {
      setForeignIncomeDetails([]);
    }
  }, [data, hasForeignIncome]);

  const handleHasForeignIncomeChange = (value) => {
    setHasForeignIncome(value);
    onUpdate({ hasForeignIncome: value });
    if (!value) {
      setForeignIncomeDetails([]);
      onUpdate({ foreignIncomeDetails: [] });
    }
  };

  const addForeignIncomeEntry = () => {
    const newEntry = {
      country: '',
      incomeType: 'salary',
      amount: 0,
      exchangeRate: 1,
      amountInr: 0,
      taxPaidAbroad: 0,
      dtaaApplicable: false,
    };
    const updated = [...foreignIncomeDetails, newEntry];
    setForeignIncomeDetails(updated);
    onUpdate({ foreignIncomeDetails: updated });
  };

  const removeForeignIncomeEntry = (index) => {
    const updated = foreignIncomeDetails.filter((_, i) => i !== index);
    setForeignIncomeDetails(updated);
    onUpdate({ foreignIncomeDetails: updated });
  };

  const updateForeignIncomeEntry = (index, field, value) => {
    const updated = [...foreignIncomeDetails];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate INR amount when foreign amount or exchange rate changes
    if (field === 'amount' || field === 'exchangeRate') {
      const amount = field === 'amount' ? parseFloat(value) || 0 : updated[index].amount || 0;
      const exchangeRate = field === 'exchangeRate' ? parseFloat(value) || 1 : updated[index].exchangeRate || 1;
      updated[index].amountInr = amount * exchangeRate;
    }

    setForeignIncomeDetails(updated);
    onUpdate({ foreignIncomeDetails: updated });
  };

  const calculateTotalForeignIncome = () => {
    return foreignIncomeDetails.reduce((sum, entry) => sum + (parseFloat(entry.amountInr) || 0), 0);
  };

  const calculateTotalTaxPaidAbroad = () => {
    return foreignIncomeDetails.reduce((sum, entry) => sum + (parseFloat(entry.taxPaidAbroad) || 0), 0);
  };

  // Common countries list
  const commonCountries = [
    'United States',
    'United Kingdom',
    'United Arab Emirates',
    'Singapore',
    'Australia',
    'Canada',
    'Germany',
    'France',
    'Japan',
    'Switzerland',
    'Other',
  ];

  if (!hasForeignIncome) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="hasForeignIncome"
              checked={hasForeignIncome === false}
              onChange={() => handleHasForeignIncomeChange(false)}
              className="mr-2"
            />
            No Foreign Income
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="hasForeignIncome"
              checked={hasForeignIncome === true}
              onChange={() => handleHasForeignIncomeChange(true)}
              className="mr-2"
            />
            Yes, I have Foreign Income
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="radio"
            name="hasForeignIncome"
            checked={hasForeignIncome === false}
            onChange={() => handleHasForeignIncomeChange(false)}
            className="mr-2"
          />
          No Foreign Income
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="hasForeignIncome"
            checked={hasForeignIncome === true}
            onChange={() => handleHasForeignIncomeChange(true)}
            className="mr-2"
          />
          Yes, I have Foreign Income
        </label>
      </div>

      {/* Foreign Income Details */}
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-gold-600" />
            <h4 className="font-semibold text-slate-900">Foreign Income Details</h4>
          </div>
          <button
            onClick={addForeignIncomeEntry}
            className="flex items-center px-3 py-1.5 text-body-regular bg-gold-500 text-white rounded-xl hover:bg-gold-600"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Entry
          </button>
        </div>

        {foreignIncomeDetails.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-slate-500 mb-4">No foreign income entries added yet</p>
            <button
              onClick={addForeignIncomeEntry}
              className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600"
            >
              Add Foreign Income Entry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {foreignIncomeDetails.map((entry, index) => (
              <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-slate-700">Entry #{index + 1}</span>
                  <button
                    onClick={() => removeForeignIncomeEntry(index)}
                    className="text-error-600 hover:text-error-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body-regular font-medium text-slate-700 mb-1">Country</label>
                    <select
                      value={entry.country || ''}
                      onChange={(e) => updateForeignIncomeEntry(index, 'country', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                    >
                      <option value="">Select Country</option>
                      {commonCountries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-body-regular font-medium text-slate-700 mb-1">Income Type</label>
                    <select
                      value={entry.incomeType || 'salary'}
                      onChange={(e) => updateForeignIncomeEntry(index, 'incomeType', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                    >
                      <option value="salary">Salary</option>
                      <option value="business">Business</option>
                      <option value="capital_gains">Capital Gains</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-body-regular font-medium text-slate-700 mb-1">
                      Amount (Foreign Currency)
                    </label>
                    <input
                      type="number"
                      value={entry.amount || 0}
                      onChange={(e) => updateForeignIncomeEntry(index, 'amount', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-body-regular font-medium text-slate-700 mb-1">Exchange Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      value={entry.exchangeRate || 1}
                      onChange={(e) => updateForeignIncomeEntry(index, 'exchangeRate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                      placeholder="1.00"
                    />
                    <p className="text-body-small text-slate-500 mt-1">Rate to convert to INR</p>
                  </div>

                  <div>
                    <label className="block text-body-regular font-medium text-slate-700 mb-1">Amount in INR (₹)</label>
                    <input
                      type="number"
                      value={entry.amountInr || 0}
                      readOnly
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-100"
                    />
                    <p className="text-body-small text-slate-500 mt-1">Auto-calculated</p>
                  </div>

                  <div>
                    <label className="block text-body-regular font-medium text-slate-700 mb-1">Tax Paid Abroad (₹)</label>
                    <input
                      type="number"
                      value={entry.taxPaidAbroad || 0}
                      onChange={(e) => updateForeignIncomeEntry(index, 'taxPaidAbroad', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                      placeholder="0"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={entry.dtaaApplicable || false}
                        onChange={(e) => updateForeignIncomeEntry(index, 'dtaaApplicable', e.target.checked)}
                        className="w-4 h-4 text-gold-600 border-slate-300 rounded focus:ring-gold-500"
                      />
                      <span className="text-body-regular font-medium text-slate-700">DTAA (Double Taxation Avoidance Agreement) Applicable</span>
                    </label>
                    {entry.dtaaApplicable && (
                      <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <div className="flex items-start">
                          <AlertCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                          <p className="text-body-small text-blue-800">
                            DTAA allows you to claim credit for tax paid abroad. Ensure you have the necessary documentation.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="border-t border-slate-300 pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-body-regular font-medium text-slate-700">Total Foreign Income (INR):</span>
                  <span className="ml-2 text-body-large font-bold text-slate-900">
                    ₹{calculateTotalForeignIncome().toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-body-regular font-medium text-slate-700">Total Tax Paid Abroad:</span>
                  <span className="ml-2 text-body-large font-bold text-slate-900">
                    ₹{calculateTotalTaxPaidAbroad().toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForeignIncomeForm;

