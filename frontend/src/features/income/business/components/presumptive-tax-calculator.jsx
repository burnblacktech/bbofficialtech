// =====================================================
// PRESUMPTIVE TAX CALCULATOR
// Calculator for presumptive tax (Section 44AD/44ADA/44AE)
// =====================================================

import React, { useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import { usePresumptiveTaxCalculation } from '../hooks/use-business-income';
import Button from '../../../components/common/Button';

const PresumptiveTaxCalculator = ({ onCalculate, initialData = {} }) => {
  const [formData, setFormData] = useState({
    grossReceipts: initialData.grossReceipts || '',
    businessType: initialData.businessType || '',
    section: initialData.section || '44AD',
    isDigitalReceipts: initialData.isDigitalReceipts || false,
    numberOfVehicles: initialData.numberOfVehicles || '',
    heavyVehicles: initialData.heavyVehicles || '',
  });

  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const calculateMutation = usePresumptiveTaxCalculation();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.grossReceipts || parseFloat(formData.grossReceipts) <= 0) {
      newErrors.grossReceipts = 'Gross receipts is required and must be greater than 0';
    }

    if (formData.section === '44AE') {
      if (!formData.numberOfVehicles || parseFloat(formData.numberOfVehicles) <= 0) {
        newErrors.numberOfVehicles = 'Number of vehicles is required for Section 44AE';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = async () => {
    if (!validate()) return;

    try {
      const calculationData = {
        grossReceipts: parseFloat(formData.grossReceipts),
        businessType: formData.businessType,
        section: formData.section,
        isDigitalReceipts: formData.isDigitalReceipts,
        numberOfVehicles: formData.numberOfVehicles ? parseFloat(formData.numberOfVehicles) : null,
        heavyVehicles: formData.heavyVehicles ? parseFloat(formData.heavyVehicles) : null,
      };

      const response = await calculateMutation.mutateAsync(calculationData);

      if (response.success) {
        setResult(response);
        if (onCalculate) {
          onCalculate(response);
        }
      }
    } catch (error) {
      setErrors({ general: error.message || 'Failed to calculate presumptive tax' });
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
        <h3 className="text-heading-md text-gray-800">Presumptive Tax Calculator</h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-body-sm text-blue-800">
            <p className="font-semibold mb-1">About Presumptive Tax:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Section 44AD: 8% of gross receipts (6% for digital receipts)</li>
              <li>Section 44ADA: 50% of gross receipts for professionals</li>
              <li>Section 44AE: Fixed rates for goods carriage business</li>
              <li>Applicable if gross receipts ≤ ₹2 crores (44AD/44ADA) or ≤ ₹10 lakhs (44AE)</li>
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
          <label className="block text-body-sm font-medium text-gray-700 mb-2">Section</label>
          <select
            value={formData.section}
            onChange={(e) => handleChange('section', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="44AD">Section 44AD (Business)</option>
            <option value="44ADA">Section 44ADA (Profession)</option>
            <option value="44AE">Section 44AE (Goods Carriage)</option>
          </select>
        </div>

        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-2">Gross Receipts (₹)</label>
          <input
            type="number"
            value={formData.grossReceipts}
            onChange={(e) => handleChange('grossReceipts', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.grossReceipts ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter gross receipts"
          />
          {errors.grossReceipts && (
            <p className="text-body-sm text-red-600 mt-1">{errors.grossReceipts}</p>
          )}
        </div>

        {formData.section === '44AD' && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="digitalReceipts"
              checked={formData.isDigitalReceipts}
              onChange={(e) => handleChange('isDigitalReceipts', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="digitalReceipts" className="text-body-sm text-gray-700">
              Digital receipts (6% instead of 8%)
            </label>
          </div>
        )}

        {formData.section === '44AE' && (
          <>
            <div>
              <label className="block text-body-sm font-medium text-gray-700 mb-2">Number of Vehicles</label>
              <input
                type="number"
                value={formData.numberOfVehicles}
                onChange={(e) => handleChange('numberOfVehicles', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                  errors.numberOfVehicles ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter number of vehicles"
              />
              {errors.numberOfVehicles && (
                <p className="text-body-sm text-red-600 mt-1">{errors.numberOfVehicles}</p>
              )}
            </div>
            <div>
              <label className="block text-body-sm font-medium text-gray-700 mb-2">Heavy Vehicles (Optional)</label>
              <input
                type="number"
                value={formData.heavyVehicles}
                onChange={(e) => handleChange('heavyVehicles', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="Enter number of heavy vehicles"
              />
            </div>
          </>
        )}

        <Button
          onClick={handleCalculate}
          disabled={calculateMutation.isPending}
          className="w-full"
        >
          {calculateMutation.isPending ? 'Calculating...' : 'Calculate Presumptive Tax'}
        </Button>
      </div>

      {result && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h4 className="text-body-md font-semibold text-gray-800 mb-4">Calculation Result</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-body-sm text-gray-600">Gross Receipts:</span>
              <span className="text-body-md font-semibold text-gray-800">
                {formatCurrency(result.grossReceipts)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-body-sm text-gray-600">Presumptive Income:</span>
              <span className="text-heading-md font-bold text-green-700">
                {formatCurrency(result.presumptiveIncome)}
              </span>
            </div>
            <div className="bg-white rounded p-2 mt-2">
              <p className="text-body-xs text-gray-600">
                Section: {result.applicableSection} | {result.breakdown.calculation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresumptiveTaxCalculator;

