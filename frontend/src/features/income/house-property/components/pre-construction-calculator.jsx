// =====================================================
// PRE-CONSTRUCTION INTEREST CALCULATOR
// Calculator for pre-construction interest deduction
// =====================================================

import React, { useState } from 'react';
import { Calculator, Info, AlertCircle } from 'lucide-react';
import { usePreConstructionInterest } from '../hooks/use-house-property';
import Button from '../../../../components/common/Button';

const PreConstructionCalculator = ({ onCalculate, initialData = {} }) => {
  const [formData, setFormData] = useState({
    loanAmount: initialData.loanAmount || '',
    interestRate: initialData.interestRate || '',
    constructionStartDate: initialData.constructionStartDate || '',
    constructionEndDate: initialData.constructionEndDate || '',
    possessionDate: initialData.possessionDate || '',
  });

  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const calculateMutation = usePreConstructionInterest();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.loanAmount || parseFloat(formData.loanAmount) <= 0) {
      newErrors.loanAmount = 'Loan amount is required and must be greater than 0';
    }

    if (!formData.interestRate || parseFloat(formData.interestRate) <= 0) {
      newErrors.interestRate = 'Interest rate is required and must be greater than 0';
    }

    if (!formData.constructionStartDate) {
      newErrors.constructionStartDate = 'Construction start date is required';
    }

    if (!formData.possessionDate) {
      newErrors.possessionDate = 'Possession date is required';
    }

    if (formData.constructionStartDate && formData.possessionDate) {
      const start = new Date(formData.constructionStartDate);
      const possession = new Date(formData.possessionDate);
      if (possession <= start) {
        newErrors.possessionDate = 'Possession date must be after construction start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = async () => {
    if (!validate()) return;

    try {
      const calculationData = {
        loanAmount: parseFloat(formData.loanAmount),
        interestRate: parseFloat(formData.interestRate),
        constructionStartDate: formData.constructionStartDate,
        constructionEndDate: formData.constructionEndDate || null,
        possessionDate: formData.possessionDate,
      };

      const response = await calculateMutation.mutateAsync(calculationData);

      if (response.success) {
        setResult(response);
        if (onCalculate) {
          onCalculate(response);
        }
      }
    } catch (error) {
      setErrors({ general: error.message || 'Failed to calculate pre-construction interest' });
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
        <h3 className="text-heading-md text-gray-800">Pre-construction Interest Calculator</h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-body-sm text-blue-800">
            <p className="font-semibold mb-1">About Pre-construction Interest:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Deduction is available for interest paid during construction period</li>
              <li>Maximum deduction: ₹2,00,000 per year for self-occupied property</li>
              <li>Deduction is spread over 5 years in equal installments from possession year</li>
              <li>For let-out properties, full interest is deductible</li>
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
          <label className="block text-body-sm font-medium text-gray-700 mb-2">
            Loan Amount (₹)
          </label>
          <input
            type="number"
            value={formData.loanAmount}
            onChange={(e) => handleChange('loanAmount', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.loanAmount ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter loan amount"
          />
          {errors.loanAmount && (
            <p className="text-body-sm text-red-600 mt-1">{errors.loanAmount}</p>
          )}
        </div>

        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-2">
            Interest Rate (% per annum)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.interestRate}
            onChange={(e) => handleChange('interestRate', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.interestRate ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter interest rate"
          />
          {errors.interestRate && (
            <p className="text-body-sm text-red-600 mt-1">{errors.interestRate}</p>
          )}
        </div>

        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-2">
            Construction Start Date
          </label>
          <input
            type="date"
            value={formData.constructionStartDate}
            onChange={(e) => handleChange('constructionStartDate', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.constructionStartDate ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.constructionStartDate && (
            <p className="text-body-sm text-red-600 mt-1">{errors.constructionStartDate}</p>
          )}
        </div>

        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-2">
            Construction End Date (Optional)
          </label>
          <input
            type="date"
            value={formData.constructionEndDate}
            onChange={(e) => handleChange('constructionEndDate', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>

        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-2">
            Possession Date
          </label>
          <input
            type="date"
            value={formData.possessionDate}
            onChange={(e) => handleChange('possessionDate', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.possessionDate ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.possessionDate && (
            <p className="text-body-sm text-red-600 mt-1">{errors.possessionDate}</p>
          )}
        </div>

        <Button
          onClick={handleCalculate}
          disabled={calculateMutation.isPending}
          className="w-full"
        >
          {calculateMutation.isPending ? 'Calculating...' : 'Calculate Deduction'}
        </Button>
      </div>

      {result && (
        <div className="mt-6 space-y-4">
          {/* Summary Card */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h4 className="text-heading-sm font-semibold text-gray-800 mb-4">Calculation Summary</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-body-xs text-gray-600 block mb-1">Total Pre-construction Interest</span>
                <span className="text-heading-md font-semibold text-gray-900">
                  {formatCurrency(result.totalPreConstructionInterest)}
                </span>
              </div>
              <div>
                <span className="text-body-xs text-gray-600 block mb-1">Annual Deduction (5 years)</span>
                <span className="text-heading-md font-semibold text-green-700">
                  {formatCurrency(result.annualDeduction)}
                </span>
              </div>
              <div>
                <span className="text-body-xs text-gray-600 block mb-1">Years Remaining</span>
                <span className="text-heading-md font-semibold text-gray-900">
                  {result.yearsRemaining || 5} years
                </span>
              </div>
            </div>
            {result.breakdown && (
              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-body-sm font-medium text-gray-700 mb-2">Details:</p>
                <div className="grid grid-cols-2 gap-3 text-body-sm text-gray-600">
                  <div>Pre-construction Months: <span className="font-semibold text-gray-900">{result.breakdown.preConstructionMonths}</span></div>
                  <div>Annual Interest: <span className="font-semibold text-gray-900">{formatCurrency(result.breakdown.annualInterest)}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Year-wise Breakdown */}
          {result.annualDeduction && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-heading-sm font-semibold text-gray-800 mb-4">Year-wise Deduction Schedule</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-body-sm font-semibold text-gray-700">Year</th>
                      <th className="text-right py-3 px-4 text-body-sm font-semibold text-gray-700">Deduction Amount</th>
                      <th className="text-right py-3 px-4 text-body-sm font-semibold text-gray-700">Cumulative</th>
                      <th className="text-center py-3 px-4 text-body-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const possessionYear = formData.possessionDate
                        ? new Date(formData.possessionDate).getFullYear()
                        : new Date().getFullYear();
                      const years = [];
                      const totalInterest = result.totalPreConstructionInterest || 0;
                      const annualDeduction = result.annualDeduction || totalInterest / 5;
                      let cumulative = 0;

                      for (let i = 0; i < 5; i++) {
                        const year = possessionYear + i;
                        cumulative += annualDeduction;
                        const isCurrentYear = year === new Date().getFullYear();
                        const isPastYear = year < new Date().getFullYear();

                        years.push(
                          <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-body-sm text-gray-900">
                              {year}-{String(year + 1).slice(-2)}
                            </td>
                            <td className="py-3 px-4 text-body-sm font-semibold text-gray-900 text-right">
                              {formatCurrency(annualDeduction)}
                            </td>
                            <td className="py-3 px-4 text-body-sm text-gray-600 text-right">
                              {formatCurrency(cumulative)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isPastYear ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-body-xs font-medium bg-gray-100 text-gray-700">
                                  Past
                                </span>
                              ) : isCurrentYear ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-body-xs font-medium bg-blue-100 text-blue-700">
                                  Current
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-body-xs font-medium bg-green-100 text-green-700">
                                  Upcoming
                                </span>
                              )}
                            </td>
                          </tr>,
                        );
                      }
                      return years;
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Amortization Schedule */}
          {result.breakdown && formData.constructionStartDate && formData.possessionDate && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-heading-sm font-semibold text-gray-800 mb-4">Amortization Schedule</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-body-xs text-gray-600 block mb-1">Construction Period</span>
                    <span className="text-body-sm font-semibold text-gray-900">
                      {(() => {
                        const start = new Date(formData.constructionStartDate);
                        const end = new Date(formData.possessionDate);
                        const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));
                        return `${months} months`;
                      })()}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-body-xs text-gray-600 block mb-1">Monthly Interest</span>
                    <span className="text-body-sm font-semibold text-gray-900">
                      {formatCurrency(
                        (result.breakdown.annualInterest || 0) / 12,
                      )}
                    </span>
                  </div>
                </div>
                <div className="bg-info-50 border border-info-200 rounded-lg p-3">
                  <p className="text-body-xs text-info-800">
                    <strong>Note:</strong> Pre-construction interest is amortized over 5 years starting from the
                    year of possession. Each year, you can claim 1/5th of the total pre-construction interest
                    as deduction under Section 24(b).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PreConstructionCalculator;

