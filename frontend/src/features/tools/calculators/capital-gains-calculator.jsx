// =====================================================
// CAPITAL GAINS TAX CALCULATOR
// Standalone calculator for capital gains tax
// =====================================================

import React, { useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import { capitalGainsService } from '../../income/capital-gains/services/capital-gains.service';
import Button from '../../../components/common/Button';

const CapitalGainsTaxCalculator = () => {
  const [formData, setFormData] = useState({
    assetType: '',
    saleValue: '',
    purchaseValue: '',
    indexedCost: '',
    expenses: '',
    purchaseDate: '',
    saleDate: '',
    isLongTerm: false,
  });

  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));

    // Auto-determine if long-term
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
      newErrors.saleValue = 'Sale value is required';
    }
    if (!formData.saleDate) {
      newErrors.saleDate = 'Sale date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = () => {
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

      const response = capitalGainsService.calculateCapitalGains(calculationData);

      if (response.success) {
        // Calculate tax
        const gainAmount = response.gainAmount;
        let taxAmount = 0;

        if (formData.isLongTerm) {
          // LTCG: 20% with indexation or 10% without indexation (for equity)
          if (formData.assetType === 'equity_shares' || formData.assetType === 'mutual_funds') {
            taxAmount = gainAmount * 0.1; // 10% without indexation
          } else {
            taxAmount = gainAmount * 0.2; // 20% with indexation
          }
        } else {
          // STCG: As per slab rate (assuming 30% for simplicity)
          taxAmount = gainAmount * 0.3;
        }

        setResult({
          ...response,
          taxAmount,
          netGain: gainAmount - taxAmount,
        });
      }
    } catch (error) {
      setErrors({ general: error.message || 'Failed to calculate' });
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
        <h3 className="text-heading-md text-gray-800">Capital Gains Tax Calculator</h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-body-sm text-blue-800">
            <p className="font-semibold mb-1">Tax Rates:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>STCG: As per income tax slab (typically 30%)</li>
              <li>LTCG (Equity/MF): 10% without indexation (above ₹1 lakh exemption)</li>
              <li>LTCG (Other assets): 20% with indexation</li>
            </ul>
          </div>
        </div>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-body-sm text-red-800">{errors.general}</p>
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
              placeholder="Enter indexed cost"
            />
          </div>
        ) : (
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">Purchase Value (₹)</label>
            <input
              type="number"
              value={formData.purchaseValue}
              onChange={(e) => handleChange('purchaseValue', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="Enter purchase value"
            />
          </div>
        )}

        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-2">Expenses on Transfer (₹)</label>
          <input
            type="number"
            value={formData.expenses}
            onChange={(e) => handleChange('expenses', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            placeholder="Enter expenses"
          />
        </div>

        <Button onClick={handleCalculate} className="w-full">
          Calculate Tax
        </Button>
      </div>

      {result && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h4 className="text-body-md font-semibold text-gray-800 mb-4">Calculation Result</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-body-sm text-gray-600">Capital Gain:</span>
              <span className="text-body-md font-semibold text-gray-800">
                {formatCurrency(result.gainAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-body-sm text-gray-600">Tax Amount:</span>
              <span className="text-heading-md font-bold text-red-700">
                {formatCurrency(result.taxAmount)}
              </span>
            </div>
            <div className="pt-3 border-t border-green-200 flex justify-between">
              <span className="text-body-md font-semibold text-gray-800">Net Gain After Tax:</span>
              <span className="text-heading-md font-bold text-green-700">
                {formatCurrency(result.netGain)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CapitalGainsTaxCalculator;

