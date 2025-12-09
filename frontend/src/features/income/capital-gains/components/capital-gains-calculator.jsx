// =====================================================
// CAPITAL GAINS CALCULATOR
// Calculator for capital gains computation
// =====================================================

import React, { useState } from 'react';
import { Calculator, Info, AlertCircle } from 'lucide-react';
import { useCalculateCapitalGains } from '../hooks/use-capital-gains';
import Button from '../../../../components/common/Button';

const CapitalGainsCalculator = ({ onCalculate, initialData = {} }) => {
  const [formData, setFormData] = useState({
    assetType: initialData.assetType || '',
    saleValue: initialData.saleValue || '',
    purchaseValue: initialData.purchaseValue || '',
    indexedCost: initialData.indexedCost || '',
    expenses: initialData.expenses || '',
    purchaseDate: initialData.purchaseDate || '',
    saleDate: initialData.saleDate || '',
    isLongTerm: initialData.isLongTerm || false,
  });

  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const calculateMutation = useCalculateCapitalGains();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));

    // Auto-determine if long-term based on dates
    if (field === 'purchaseDate' || field === 'saleDate') {
      if (formData.purchaseDate && formData.saleDate) {
        const purchase = new Date(formData.purchaseDate);
        const sale = new Date(formData.saleDate);
        const monthsDiff = (sale.getFullYear() - purchase.getFullYear()) * 12 + (sale.getMonth() - purchase.getMonth());
        setFormData((prev) => ({ ...prev, isLongTerm: monthsDiff >= 24 }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.assetType) {
      newErrors.assetType = 'Asset type is required';
    }

    if (!formData.saleValue || parseFloat(formData.saleValue) <= 0) {
      newErrors.saleValue = 'Sale value is required and must be greater than 0';
    }

    if (formData.isLongTerm) {
      if (!formData.indexedCost && (!formData.purchaseValue || parseFloat(formData.purchaseValue) <= 0)) {
        newErrors.purchaseValue = 'Purchase value or indexed cost is required for long-term gains';
      }
    } else {
      if (!formData.purchaseValue || parseFloat(formData.purchaseValue) <= 0) {
        newErrors.purchaseValue = 'Purchase value is required';
      }
    }

    if (!formData.saleDate) {
      newErrors.saleDate = 'Sale date is required';
    }

    if (formData.purchaseDate && formData.saleDate) {
      const purchase = new Date(formData.purchaseDate);
      const sale = new Date(formData.saleDate);
      if (sale <= purchase) {
        newErrors.saleDate = 'Sale date must be after purchase date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = async () => {
    if (!validate()) return;

    try {
      const calculationData = {
        assetType: formData.assetType,
        saleValue: parseFloat(formData.saleValue),
        purchaseValue: parseFloat(formData.purchaseValue) || 0,
        indexedCost: formData.indexedCost ? parseFloat(formData.indexedCost) : null,
        expenses: parseFloat(formData.expenses) || 0,
        purchaseDate: formData.purchaseDate,
        saleDate: formData.saleDate,
        isLongTerm: formData.isLongTerm,
      };

      const response = await calculateMutation.mutateAsync(calculationData);

      if (response.success) {
        setResult(response);
        if (onCalculate) {
          onCalculate(response);
        }
      }
    } catch (error) {
      setErrors({ general: error.message || 'Failed to calculate capital gains' });
    }
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="h-6 w-6 text-gold-600" />
        <h3 className="text-heading-md text-gray-800">Capital Gains Calculator</h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-body-sm text-blue-800">
            <p className="font-semibold mb-1">About Capital Gains:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Short-term: Assets held for less than 24 months (12 months for equity/MF)</li>
              <li>Long-term: Assets held for 24+ months (12+ months for equity/MF)</li>
              <li>LTCG uses indexed cost of acquisition for calculation</li>
              <li>STCG is taxed at slab rate, LTCG at 20% (with indexation) or 10% (without indexation for equity)</li>
            </ul>
          </div>
        </div>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-body-sm text-red-800">{errors.general}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-2">Asset Type</label>
          <select
            value={formData.assetType}
            onChange={(e) => handleChange('assetType', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.assetType ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select Asset Type</option>
            <option value="equity_shares">Equity Shares</option>
            <option value="mutual_funds">Mutual Funds</option>
            <option value="property">Property</option>
            <option value="bonds">Bonds</option>
            <option value="other">Other</option>
          </select>
          {errors.assetType && (
            <p className="text-body-sm text-red-600 mt-1">{errors.assetType}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">Purchase Date</label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => handleChange('purchaseDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">Sale Date</label>
            <input
              type="date"
              value={formData.saleDate}
              onChange={(e) => handleChange('saleDate', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                errors.saleDate ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.saleDate && (
              <p className="text-body-sm text-red-600 mt-1">{errors.saleDate}</p>
            )}
          </div>
        </div>

        {formData.purchaseDate && formData.saleDate && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-body-sm text-gray-700">
              <span className="font-semibold">Holding Period:</span>{' '}
              {formData.isLongTerm ? (
                <span className="text-green-700">Long-term (24+ months)</span>
              ) : (
                <span className="text-gold-700">Short-term (less than 24 months)</span>
              )}
            </p>
          </div>
        )}

        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-2">Sale Value (₹)</label>
          <input
            type="number"
            value={formData.saleValue}
            onChange={(e) => handleChange('saleValue', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.saleValue ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter sale value"
          />
          {errors.saleValue && (
            <p className="text-body-sm text-red-600 mt-1">{errors.saleValue}</p>
          )}
        </div>

        {formData.isLongTerm ? (
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              Indexed Cost of Acquisition (₹)
            </label>
            <input
              type="number"
              value={formData.indexedCost}
              onChange={(e) => handleChange('indexedCost', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="Enter indexed cost (or leave blank to calculate)"
            />
            <p className="text-body-xs text-gray-500 mt-1">
              If not provided, will be calculated from purchase value using CII
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">Purchase Value (₹)</label>
            <input
              type="number"
              value={formData.purchaseValue}
              onChange={(e) => handleChange('purchaseValue', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                errors.purchaseValue ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter purchase value"
            />
            {errors.purchaseValue && (
              <p className="text-body-sm text-red-600 mt-1">{errors.purchaseValue}</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-2">Expenses on Transfer (₹)</label>
          <input
            type="number"
            value={formData.expenses}
            onChange={(e) => handleChange('expenses', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            placeholder="Enter expenses (brokerage, stamp duty, etc.)"
          />
        </div>

        <Button
          onClick={handleCalculate}
          disabled={calculateMutation.isPending}
          className="w-full"
        >
          {calculateMutation.isPending ? 'Calculating...' : 'Calculate Capital Gains'}
        </Button>
      </div>

      {result && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h4 className="text-body-md font-semibold text-gray-800 mb-4">Calculation Result</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-body-sm text-gray-600">Sale Value:</span>
              <span className="text-body-md font-semibold text-gray-800">
                {formatCurrency(result.saleValue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-body-sm text-gray-600">Cost of Acquisition:</span>
              <span className="text-body-md font-semibold text-gray-800">
                {formatCurrency(result.costOfAcquisition)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-body-sm text-gray-600">Expenses:</span>
              <span className="text-body-md font-semibold text-gray-800">
                {formatCurrency(result.expenses)}
              </span>
            </div>
            <div className="pt-3 border-t border-green-200 flex justify-between">
              <span className="text-body-md font-semibold text-gray-800">Capital Gain:</span>
              <span className="text-heading-md font-bold text-green-700">
                {formatCurrency(result.gainAmount)}
              </span>
            </div>
            <div className="bg-white rounded p-2 mt-2">
              <p className="text-body-xs text-gray-600">
                Type: {result.isLongTerm ? 'Long-term' : 'Short-term'} | Tax Rate:{' '}
                {result.isLongTerm ? '20% (with indexation)' : 'As per slab rate'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CapitalGainsCalculator;

