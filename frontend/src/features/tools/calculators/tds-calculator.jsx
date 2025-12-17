// =====================================================
// TDS CALCULATOR
// Calculator for TDS deduction
// =====================================================

import React, { useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import Button from '../../../components/DesignSystem/components/Button';

const TDSCalculator = () => {
  const [formData, setFormData] = useState({
    incomeType: '',
    amount: '',
    tdsRate: '',
    panProvided: true,
  });

  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const tdsRates = {
    salary: 0,
    interest: 0.1, // 10%
    dividend: 0.1, // 10%
    rent: 0.1, // 10%
    professional: 0.1, // 10%
    commission: 0.1, // 10%
    other: 0.1, // 10%
  };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-set TDS rate based on income type
      if (field === 'incomeType' && tdsRates[value] !== undefined) {
        updated.tdsRate = (tdsRates[value] * 100).toString();
      }

      return updated;
    });
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.incomeType) {
      newErrors.incomeType = 'Income type is required';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount is required and must be greater than 0';
    }
    if (!formData.tdsRate || parseFloat(formData.tdsRate) < 0) {
      newErrors.tdsRate = 'TDS rate is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = () => {
    if (!validate()) return;

    const amount = parseFloat(formData.amount);
    const tdsRate = parseFloat(formData.tdsRate) / 100;

    let tdsAmount = amount * tdsRate;

    // Higher rate if PAN not provided
    if (!formData.panProvided) {
      tdsAmount = amount * 0.2; // 20% if PAN not provided
    }

    // TDS threshold exemptions
    const thresholds = {
      interest: 40000, // ₹40,000 for interest
      rent: 240000, // ₹2,40,000 for rent
    };

    const threshold = thresholds[formData.incomeType] || 0;
    const isExempt = amount <= threshold;

    setResult({
      amount,
      tdsRate: tdsRate * 100,
      tdsAmount: isExempt ? 0 : tdsAmount,
      netAmount: isExempt ? amount : amount - tdsAmount,
      isExempt,
      threshold,
      panProvided: formData.panProvided,
    });
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="h-6 w-6 text-gold-600" />
        <h3 className="text-heading-md text-gray-800">TDS Calculator</h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-body-sm text-blue-800">
            <p className="font-semibold mb-1">TDS Rates:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Interest: 10% (exempt if ≤ ₹40,000)</li>
              <li>Rent: 10% (exempt if ≤ ₹2,40,000)</li>
              <li>Professional/Commission: 10%</li>
              <li>20% if PAN not provided</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-body-sm font-medium text-slate-700 mb-2">Income Type</label>
          <select
            value={formData.incomeType}
            onChange={(e) => handleChange('incomeType', e.target.value)}
            className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.incomeType ? 'border-error-300' : 'border-slate-300'
            }`}
          >
            <option value="">Select Income Type</option>
            <option value="salary">Salary</option>
            <option value="interest">Interest</option>
            <option value="dividend">Dividend</option>
            <option value="rent">Rent</option>
            <option value="professional">Professional Fees</option>
            <option value="commission">Commission</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-body-sm font-medium text-slate-700 mb-2">Amount (₹)</label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.amount ? 'border-error-300' : 'border-slate-300'
            }`}
            placeholder="Enter amount"
          />
          {errors.amount && (
            <p className="text-body-sm text-error-600 mt-1">{errors.amount}</p>
          )}
        </div>

        <div>
          <label className="block text-body-sm font-medium text-slate-700 mb-2">TDS Rate (%)</label>
          <input
            type="number"
            step="0.01"
            value={formData.tdsRate}
            onChange={(e) => handleChange('tdsRate', e.target.value)}
            className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.tdsRate ? 'border-error-300' : 'border-slate-300'
            }`}
            placeholder="Enter TDS rate"
          />
          {errors.tdsRate && (
            <p className="text-body-sm text-error-600 mt-1">{errors.tdsRate}</p>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="panProvided"
            checked={formData.panProvided}
            onChange={(e) => handleChange('panProvided', e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="panProvided" className="text-body-sm text-slate-700">
            PAN Provided (20% rate if not provided)
          </label>
        </div>

        <Button onClick={handleCalculate} className="w-full">
          Calculate TDS
        </Button>
      </div>

      {result && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
          <h4 className="text-body-md font-semibold text-gray-800 mb-4">Calculation Result</h4>
          <div className="space-y-3">
            {result.isExempt && (
              <div className="bg-blue-100 border border-blue-300 rounded-xl p-3 mb-3">
                <p className="text-body-sm text-blue-800 font-semibold">
                  TDS Exempt: Amount is below threshold of {formatCurrency(result.threshold)}
                </p>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-body-sm text-slate-600">Gross Amount:</span>
              <span className="text-body-md font-semibold text-gray-800">
                {formatCurrency(result.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-body-sm text-slate-600">TDS Rate:</span>
              <span className="text-body-md font-semibold text-gray-800">
                {result.tdsRate}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-body-sm text-slate-600">TDS Amount:</span>
              <span className="text-heading-md font-bold text-error-700">
                {formatCurrency(result.tdsAmount)}
              </span>
            </div>
            <div className="pt-3 border-t border-green-200 flex justify-between">
              <span className="text-body-md font-semibold text-gray-800">Net Amount:</span>
              <span className="text-heading-md font-bold text-green-700">
                {formatCurrency(result.netAmount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TDSCalculator;

