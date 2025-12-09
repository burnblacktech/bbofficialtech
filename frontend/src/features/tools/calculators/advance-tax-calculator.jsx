// =====================================================
// ADVANCE TAX CALCULATOR
// Calculator for advance tax liability
// =====================================================

import React, { useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import Button from '../../../components/common/Button';

const AdvanceTaxCalculator = () => {
  const [formData, setFormData] = useState({
    estimatedIncome: '',
    estimatedDeductions: '',
    estimatedTax: '',
    tdsDeducted: '',
    advanceTaxPaid: '',
  });

  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.estimatedIncome || parseFloat(formData.estimatedIncome) <= 0) {
      newErrors.estimatedIncome = 'Estimated income is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateAdvanceTax = () => {
    const estimatedIncome = parseFloat(formData.estimatedIncome) || 0;
    const estimatedDeductions = parseFloat(formData.estimatedDeductions) || 0;
    const estimatedTax = parseFloat(formData.estimatedTax) || 0;
    const tdsDeducted = parseFloat(formData.tdsDeducted) || 0;
    const advanceTaxPaid = parseFloat(formData.advanceTaxPaid) || 0;

    const totalTaxLiability = estimatedTax;
    const totalTaxPaid = tdsDeducted + advanceTaxPaid;
    const advanceTaxDue = Math.max(0, totalTaxLiability - totalTaxPaid);

    // Advance tax installments (15% on 15th June, 45% on 15th Sept, 75% on 15th Dec, 100% on 15th March)
    const installments = {
      june: totalTaxLiability * 0.15,
      september: totalTaxLiability * 0.45,
      december: totalTaxLiability * 0.75,
      march: totalTaxLiability * 1.0,
    };

    return {
      totalTaxLiability,
      totalTaxPaid,
      advanceTaxDue,
      installments,
    };
  };

  const handleCalculate = () => {
    if (!validate()) return;

    const calculation = calculateAdvanceTax();
    setResult(calculation);
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="h-6 w-6 text-gold-600" />
        <h3 className="text-heading-md text-gray-800">Advance Tax Calculator</h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-body-sm text-blue-800">
            <p className="font-semibold mb-1">Advance Tax Installments:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>15% by 15th June</li>
              <li>45% by 15th September</li>
              <li>75% by 15th December</li>
              <li>100% by 15th March</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-2">Estimated Annual Income (₹)</label>
          <input
            type="number"
            value={formData.estimatedIncome}
            onChange={(e) => handleChange('estimatedIncome', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.estimatedIncome ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter estimated income"
          />
          {errors.estimatedIncome && (
            <p className="text-body-sm text-red-600 mt-1">{errors.estimatedIncome}</p>
          )}
        </div>

        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-2">Estimated Deductions (₹)</label>
          <input
            type="number"
            value={formData.estimatedDeductions}
            onChange={(e) => handleChange('estimatedDeductions', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            placeholder="Enter estimated deductions"
          />
        </div>

        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-2">Estimated Tax Liability (₹)</label>
          <input
            type="number"
            value={formData.estimatedTax}
            onChange={(e) => handleChange('estimatedTax', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            placeholder="Enter estimated tax"
          />
        </div>

        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-2">TDS Deducted (₹)</label>
          <input
            type="number"
            value={formData.tdsDeducted}
            onChange={(e) => handleChange('tdsDeducted', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            placeholder="Enter TDS deducted"
          />
        </div>

        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-2">Advance Tax Already Paid (₹)</label>
          <input
            type="number"
            value={formData.advanceTaxPaid}
            onChange={(e) => handleChange('advanceTaxPaid', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            placeholder="Enter advance tax paid"
          />
        </div>

        <Button onClick={handleCalculate} className="w-full">
          Calculate Advance Tax
        </Button>
      </div>

      {result && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h4 className="text-body-md font-semibold text-gray-800 mb-4">Calculation Result</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-body-sm text-gray-600">Total Tax Liability:</span>
              <span className="text-body-md font-semibold text-gray-800">
                {formatCurrency(result.totalTaxLiability)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-body-sm text-gray-600">Total Tax Paid:</span>
              <span className="text-body-md font-semibold text-green-700">
                {formatCurrency(result.totalTaxPaid)}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-green-200">
              <span className="text-body-md font-semibold text-gray-800">Advance Tax Due:</span>
              <span className="text-heading-md font-bold text-red-700">
                {formatCurrency(result.advanceTaxDue)}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-body-sm font-semibold text-gray-800 mb-3">Installment Schedule:</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-body-sm text-gray-600">15th June (15%):</span>
                  <span className="text-body-sm font-semibold text-gray-800">
                    {formatCurrency(result.installments.june)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body-sm text-gray-600">15th September (45%):</span>
                  <span className="text-body-sm font-semibold text-gray-800">
                    {formatCurrency(result.installments.september)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body-sm text-gray-600">15th December (75%):</span>
                  <span className="text-body-sm font-semibold text-gray-800">
                    {formatCurrency(result.installments.december)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body-sm text-gray-600">15th March (100%):</span>
                  <span className="text-body-sm font-semibold text-gray-800">
                    {formatCurrency(result.installments.march)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvanceTaxCalculator;

