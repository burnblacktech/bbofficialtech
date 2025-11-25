// =====================================================
// TAX CALCULATOR COMPONENT - REAL-TIME TAX COMPUTATION
// Enterprise-grade tax calculation with FY 2024-25 slabs
// =====================================================

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

const TaxCalculator = ({
  filingData,
  updateFilingData,
  validationResults,
  aiSuggestions,
  onValidate,
  isValidating,
}) => {
  const [taxBreakdown, setTaxBreakdown] = useState(null);

  // Tax slabs for FY 2024-25
  const taxSlabs = [
    { min: 0, max: 250000, rate: 0, label: '0 - ₹2.5L' },
    { min: 250000, max: 500000, rate: 0.05, label: '₹2.5L - ₹5L' },
    { min: 500000, max: 1000000, rate: 0.20, label: '₹5L - ₹10L' },
    { min: 1000000, max: Infinity, rate: 0.30, label: 'Above ₹10L' },
  ];

  // Calculate total income
  const calculateTotalIncome = () => {
    let totalIncome = 0;

    // Salary income
    if (filingData.income.salary) {
      const { basicSalary = 0, hra = 0, allowances = 0 } = filingData.income.salary;
      totalIncome += basicSalary + hra + allowances;
    }

    // House property income
    if (filingData.income.houseProperty) {
      const { annualValue = 0, municipalTaxes = 0, interestOnLoan = 0, isSelfOccupied = false } = filingData.income.houseProperty;
      const netAnnualValue = annualValue - municipalTaxes;

      if (isSelfOccupied) {
        totalIncome += Math.max(-200000, -interestOnLoan);
      } else {
        totalIncome += netAnnualValue - interestOnLoan;
      }
    }

    // Other income
    if (filingData.income.otherIncome) {
      const { bankInterest = 0, fdInterest = 0, dividendIncome = 0, otherSources = 0 } = filingData.income.otherIncome;
      totalIncome += bankInterest + fdInterest + dividendIncome + otherSources;
    }

    return Math.max(0, totalIncome);
  };

  // Calculate total deductions
  const calculateTotalDeductions = () => {
    let totalDeductions = 0;

    // Section 80C
    if (filingData.deductions.section80C) {
      const section80C = filingData.deductions.section80C;
      const total80C = (section80C.licPremium || 0) +
                       (section80C.ppfContribution || 0) +
                       (section80C.pfContribution || 0) +
                       (section80C.elssInvestment || 0) +
                       (section80C.tuitionFees || 0) +
                       (section80C.homeLoanPrincipal || 0);
      totalDeductions += Math.min(150000, total80C);
    }

    // Section 80D
    if (filingData.deductions.section80D) {
      const section80D = filingData.deductions.section80D;
      const total80D = (section80D.medicalInsurance || 0) + (section80D.preventiveHealth || 0);
      totalDeductions += Math.min(25000, total80D);
    }

    // HRA
    if (filingData.deductions.hra) {
      totalDeductions += filingData.deductions.hra.claimedExemption || 0;
    }

    // Section 80G
    if (filingData.deductions.section80G) {
      totalDeductions += filingData.deductions.section80G.donations || 0;
    }

    return totalDeductions;
  };

  // Calculate taxable income
  const calculateTaxableIncome = () => {
    const totalIncome = calculateTotalIncome();
    const totalDeductions = calculateTotalDeductions();
    return Math.max(0, totalIncome - totalDeductions);
  };

  // Calculate tax computation
  const calculateTaxComputation = () => {
    const taxableIncome = calculateTaxableIncome();
    const slabCalculations = [];

    let remainingIncome = taxableIncome;
    let totalTax = 0;

    taxSlabs.forEach((slab, index) => {
      const slabIncome = Math.min(remainingIncome, slab.max - slab.min);
      const slabTax = slabIncome * slab.rate;

      slabCalculations.push({
        ...slab,
        income: slabIncome,
        tax: slabTax,
        index: index + 1,
      });

      totalTax += slabTax;
      remainingIncome -= slabIncome;

      if (remainingIncome <= 0) return;
    });

    // Calculate rebate 87A
    let rebate87A = 0;
    if (taxableIncome <= 500000) {
      rebate87A = Math.min(12500, totalTax);
    }

    // Calculate surcharge (for high income)
    let surcharge = 0;
    const totalIncome = calculateTotalIncome();
    if (totalIncome > 5000000) {
      surcharge = totalTax * 0.10;
    }

    // Calculate cess (4%)
    const taxAfterRebateAndSurcharge = Math.max(0, totalTax - rebate87A + surcharge);
    const cess = taxAfterRebateAndSurcharge * 0.04;

    const finalTax = taxAfterRebateAndSurcharge + cess;

    // Calculate net payable/refund
    const tdsDeducted = filingData.income.salary?.tdsDeducted || 0;
    const advanceTax = filingData.income.advanceTax || 0;
    const totalTaxPaid = tdsDeducted + advanceTax;

    let netRefund = 0;
    let netPayable = 0;

    if (totalTaxPaid > finalTax) {
      netRefund = totalTaxPaid - finalTax;
    } else {
      netPayable = finalTax - totalTaxPaid;
    }

    const computation = {
      totalIncome: calculateTotalIncome(),
      totalDeductions: calculateTotalDeductions(),
      taxableIncome,
      slabCalculations,
      totalTax,
      rebate87A,
      surcharge,
      cess,
      finalTax,
      tdsDeducted,
      advanceTax,
      totalTaxPaid,
      netRefund,
      netPayable,
    };

    setTaxBreakdown(computation);

    // Update filing data with tax computation
    updateFilingData({
      taxComputation: {
        totalIncome: computation.totalIncome,
        taxableIncome: computation.taxableIncome,
        totalTax: computation.finalTax,
        tdsDeducted: computation.tdsDeducted,
        advanceTax: computation.advanceTax,
        netRefund: computation.netRefund,
        netPayable: computation.netPayable,
      },
    });

    return computation;
  };

  // Auto-calculate when data changes
  useEffect(() => {
    calculateTaxComputation();
  }, [filingData.income, filingData.deductions, calculateTaxComputation]);

  const totalIncome = calculateTotalIncome();
  const totalDeductions = calculateTotalDeductions();
  const taxableIncome = calculateTaxableIncome();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dashboard-card-burnblack p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-lg bg-burnblack-gold bg-opacity-20">
            <Calculator className="h-6 w-6 text-burnblack-gold" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-burnblack-black">Tax Computation</h2>
            <p className="text-sm text-neutral-500">
              Real-time tax calculation with FY 2024-25 slabs
            </p>
          </div>
        </div>

        {/* Recalculate Button */}
        <button
          onClick={calculateTaxComputation}
          className="flex items-center space-x-2 px-4 py-2 bg-burnblack-gold text-white rounded-lg hover:bg-burnblack-gold-dark transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Recalculate</span>
        </button>
      </div>

      {/* Income Summary */}
      <div className="dashboard-card-burnblack p-4">
        <h3 className="text-lg font-semibold text-burnblack-black mb-4">Income Summary</h3>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-neutral-600">Total Income</span>
            <span className="text-sm font-semibold text-burnblack-black">
              ₹{totalIncome.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-neutral-600">Total Deductions</span>
            <span className="text-sm font-semibold text-burnblack-black">
              ₹{totalDeductions.toLocaleString()}
            </span>
          </div>

          <div className="border-t border-neutral-200 pt-3">
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-burnblack-black">Taxable Income</span>
              <span className="text-lg font-bold text-burnblack-gold">
                ₹{taxableIncome.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Slabs Breakdown */}
      {taxBreakdown && (
        <div className="dashboard-card-burnblack p-4">
          <h3 className="text-lg font-semibold text-burnblack-black mb-4">Tax Slabs Breakdown</h3>

          <div className="space-y-3">
            {taxBreakdown.slabCalculations.map((slab, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-neutral-600">{slab.label}</span>
                  <p className="text-xs text-neutral-500">
                    {slab.rate * 100}% on ₹{slab.income.toLocaleString()}
                  </p>
                </div>
                <span className="text-sm font-semibold text-burnblack-black">
                  ₹{slab.tax.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tax Calculation Details */}
      {taxBreakdown && (
        <div className="dashboard-card-burnblack p-4">
          <h3 className="text-lg font-semibold text-burnblack-black mb-4">Tax Calculation</h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Basic Tax</span>
              <span className="text-sm font-semibold text-burnblack-black">
                ₹{taxBreakdown.totalTax.toLocaleString()}
              </span>
            </div>

            {taxBreakdown.rebate87A > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Rebate 87A</span>
                <span className="text-sm font-semibold text-success-600">
                  -₹{taxBreakdown.rebate87A.toLocaleString()}
                </span>
              </div>
            )}

            {taxBreakdown.surcharge > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Surcharge</span>
                <span className="text-sm font-semibold text-burnblack-black">
                  ₹{taxBreakdown.surcharge.toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Cess (4%)</span>
              <span className="text-sm font-semibold text-burnblack-black">
                ₹{taxBreakdown.cess.toLocaleString()}
              </span>
            </div>

            <div className="border-t border-neutral-200 pt-3">
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-burnblack-black">Total Tax</span>
                <span className="text-lg font-bold text-burnblack-gold">
                  ₹{taxBreakdown.finalTax.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TDS and Advance Tax */}
      {taxBreakdown && (
        <div className="dashboard-card-burnblack p-4">
          <h3 className="text-lg font-semibold text-burnblack-black mb-4">Tax Already Paid</h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">TDS Deducted</span>
              <span className="text-sm font-semibold text-burnblack-black">
                ₹{taxBreakdown.tdsDeducted.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Advance Tax</span>
              <span className="text-sm font-semibold text-burnblack-black">
                ₹{taxBreakdown.advanceTax.toLocaleString()}
              </span>
            </div>

            <div className="border-t border-neutral-200 pt-3">
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-burnblack-black">Total Tax Paid</span>
                <span className="text-sm font-semibold text-burnblack-black">
                  ₹{taxBreakdown.totalTaxPaid.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Final Result */}
      {taxBreakdown && (
        <div className="dashboard-card-burnblack p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {taxBreakdown.netRefund > 0 ? (
                <CheckCircle className="h-6 w-6 text-success-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-error-600" />
              )}
              <span className="text-lg font-semibold text-burnblack-black">
                {taxBreakdown.netRefund > 0 ? 'Refund Due' : 'Tax Payable'}
              </span>
            </div>
            <span className={`text-2xl font-bold ${
              taxBreakdown.netRefund > 0 ? 'text-success-600' : 'text-error-600'
            }`}>
              ₹{Math.abs(taxBreakdown.netRefund || taxBreakdown.netPayable).toLocaleString()}
            </span>
          </div>

          {taxBreakdown.netRefund > 0 && (
            <p className="text-sm text-neutral-500 mt-2">
              Refund will be processed within 15-30 days after filing
            </p>
          )}

          {taxBreakdown.netPayable > 0 && (
            <p className="text-sm text-neutral-500 mt-2">
              Pay the tax before filing your return
            </p>
          )}
        </div>
      )}

      {/* Validation Summary */}
      {validationResults.length > 0 && (
        <div className="dashboard-card-burnblack p-4">
          <h3 className="text-sm font-semibold text-burnblack-black mb-3">Validation Results</h3>
          <div className="space-y-2">
            {validationResults.map((result, index) => (
              <div key={index} className={`flex items-center space-x-2 text-sm ${
                result.severity === 'error' ? 'text-error-600' : 'text-warning-600'
              }`}>
                {result.severity === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span>{result.error}</span>
                {result.suggestion && (
                  <span className="text-neutral-500">- {result.suggestion}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <div className="dashboard-card-burnblack p-4">
          <h3 className="text-sm font-semibold text-burnblack-black mb-3">AI Suggestions</h3>
          <div className="space-y-3">
            {aiSuggestions.map((suggestion, index) => (
              <div key={index} className="p-3 bg-burnblack-gold bg-opacity-10 rounded-lg">
                <p className="text-sm text-burnblack-black">{suggestion.message}</p>
                {suggestion.suggestion && (
                  <p className="text-xs text-neutral-600 mt-1">{suggestion.suggestion}</p>
                )}
                {suggestion.action && (
                  <button className="text-xs text-burnblack-gold font-medium mt-2 hover:underline">
                    {suggestion.action}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxCalculator;
