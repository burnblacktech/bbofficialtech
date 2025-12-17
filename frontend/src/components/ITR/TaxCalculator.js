// =====================================================
// TAX CALCULATOR COMPONENT
// Real-time tax computation for ITR
// With null-safe currency formatting
// =====================================================

import { useEffect, useState, useCallback } from 'react';
import { Calculator, TrendingUp, TrendingDown, IndianRupee, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../services/core/APIClient';

// Safe currency formatter - handles null, undefined, NaN
const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return Number(value).toLocaleString('en-IN');
};

// Stat card component for consistent styling
const StatCard = ({ label, value, icon: Icon, colorScheme = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 text-blue-600',
    green: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 text-emerald-600',
    purple: 'bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-200 text-violet-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-4 border ${colorClasses[colorScheme]} shadow-elevation-1 hover:shadow-elevation-2 transition-shadow`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-body-regular font-medium text-slate-600">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorClasses[colorScheme].split(' ')[0]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-heading-2 font-bold text-slate-900 tabular-nums">
        ₹{formatCurrency(value)}
      </p>
    </motion.div>
  );
};

const TaxCalculator = ({ formData, onComputed, regime = 'old', assessmentYear = '2024-25' }) => {
  const [taxBreakdown, setTaxBreakdown] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState(null);

  const calculateTax = useCallback(async () => {
    if (!formData) return;

    setIsCalculating(true);
    setError(null);

    try {
      // Call backend tax computation API
      const response = await apiClient.post('/itr/compute-tax', {
        formData,
        regime,
        assessmentYear,
      });

      if (response.data.success) {
        const breakdown = response.data.data;
        setTaxBreakdown(breakdown);
        onComputed?.(breakdown);
      } else {
        throw new Error(response.data.error || 'Tax calculation failed');
      }
    } catch (apiError) {
      // Fallback to client-side calculation if API fails
      try {
        const income = formData?.income || {};
        const deductions = formData?.deductions || {};
        const taxesPaid = formData?.taxesPaid || {};

        // Calculate capital gains from structured data (ITR-2) or simple number
        let capitalGainsTotal = 0;
        if (income.capitalGains) {
          if (typeof income.capitalGains === 'object' && income.capitalGains.stcgDetails && income.capitalGains.ltcgDetails) {
            const stcgTotal = (income.capitalGains.stcgDetails || []).reduce(
              (sum, entry) => sum + (parseFloat(entry.gainAmount) || 0),
              0,
            );
            const ltcgTotal = (income.capitalGains.ltcgDetails || []).reduce(
              (sum, entry) => sum + (parseFloat(entry.gainAmount) || 0),
              0,
            );
            capitalGainsTotal = stcgTotal + ltcgTotal;
          } else {
            capitalGainsTotal = parseFloat(income.capitalGains) || 0;
          }
        }

        // Calculate house property income
        let housePropertyTotal = 0;
        if (income.houseProperty) {
          if (Array.isArray(income.houseProperty)) {
            housePropertyTotal = income.houseProperty.reduce((sum, prop) => {
              return sum + (parseFloat(prop.netRentalIncome) || 0);
            }, 0);
          } else if (income.houseProperty.properties && Array.isArray(income.houseProperty.properties)) {
            housePropertyTotal = income.houseProperty.properties.reduce((sum, prop) => {
              const rentalIncome = parseFloat(prop.annualRentalIncome) || 0;
              const municipalTaxes = parseFloat(prop.municipalTaxes) || 0;
              const interestOnLoan = parseFloat(prop.interestOnLoan) || 0;
              const netIncome = Math.max(0, rentalIncome - municipalTaxes - interestOnLoan);
              return sum + netIncome;
            }, 0);
          } else {
            housePropertyTotal = parseFloat(income.houseProperty) || 0;
          }
        }

        // Calculate foreign income total
        let foreignIncomeTotal = 0;
        if (income.foreignIncome?.foreignIncomeDetails) {
          foreignIncomeTotal = (income.foreignIncome.foreignIncomeDetails || []).reduce(
            (sum, entry) => sum + (parseFloat(entry.amountInr) || 0),
            0,
          );
        }

        // Calculate director/partner income
        const directorPartnerIncome =
          (parseFloat(income.directorPartner?.directorIncome) || 0) +
          (parseFloat(income.directorPartner?.partnerIncome) || 0);

        // Calculate business/professional income
        let businessIncome = 0;
        if (typeof income.businessIncome === 'object' && income.businessIncome?.businesses) {
          businessIncome = (income.businessIncome.businesses || []).reduce(
            (sum, b) => sum + (parseFloat(b.pnl?.netProfit || b.netProfit) || 0),
            0,
          );
        } else {
          businessIncome = parseFloat(income.businessIncome) || 0;
        }

        let professionalIncome = 0;
        if (typeof income.professionalIncome === 'object' && income.professionalIncome?.professions) {
          professionalIncome = (income.professionalIncome.professions || []).reduce(
            (sum, p) => sum + (parseFloat(p.pnl?.netIncome || p.netIncome || p.netProfit) || 0),
            0,
          );
        } else {
          professionalIncome = parseFloat(income.professionalIncome) || 0;
        }

        const grossTotalIncome =
          (parseFloat(income.salary) || 0) +
          businessIncome +
          professionalIncome +
          capitalGainsTotal +
          housePropertyTotal +
          foreignIncomeTotal +
          directorPartnerIncome +
          (parseFloat(income.otherIncome) || 0);

        const totalDeductions = regime === 'new'
          ? 50000
          : Math.min(parseFloat(deductions.section80C) || 0, 150000) +
            Math.min(parseFloat(deductions.section80D) || 0, 25000) +
            (parseFloat(deductions.section80G) || 0) +
            (parseFloat(deductions.section80TTA) || 0) +
            (parseFloat(deductions.section80TTB) || 0) +
            50000;

        const taxableIncome = Math.max(0, grossTotalIncome - totalDeductions);

        // Tax calculation based on regime
        let taxLiability = 0;
        if (regime === 'new') {
          // New regime slabs (FY 2023-24)
          if (taxableIncome <= 300000) {
            taxLiability = 0;
          } else if (taxableIncome <= 600000) {
            taxLiability = (taxableIncome - 300000) * 0.05;
          } else if (taxableIncome <= 900000) {
            taxLiability = 15000 + (taxableIncome - 600000) * 0.10;
          } else if (taxableIncome <= 1200000) {
            taxLiability = 45000 + (taxableIncome - 900000) * 0.15;
          } else if (taxableIncome <= 1500000) {
            taxLiability = 90000 + (taxableIncome - 1200000) * 0.20;
          } else {
            taxLiability = 150000 + (taxableIncome - 1500000) * 0.30;
          }
        } else {
          // Old regime slabs
          if (taxableIncome <= 250000) {
            taxLiability = 0;
          } else if (taxableIncome <= 500000) {
            taxLiability = (taxableIncome - 250000) * 0.05;
          } else if (taxableIncome <= 1000000) {
            taxLiability = 12500 + (taxableIncome - 500000) * 0.20;
          } else {
            taxLiability = 112500 + (taxableIncome - 1000000) * 0.30;
          }
        }

        // Rebate u/s 87A
        let rebate87A = 0;
        if (regime === 'new' && taxableIncome <= 700000) {
          rebate87A = Math.min(taxLiability, 25000);
        } else if (regime === 'old' && taxableIncome <= 500000) {
          rebate87A = Math.min(taxLiability, 12500);
        }

        const taxAfterRebate = Math.max(0, taxLiability - rebate87A);
        const cess = taxAfterRebate * 0.04;
        const totalTaxLiability = taxAfterRebate + cess;

        const totalTaxesPaid =
          (parseFloat(taxesPaid.tds) || 0) +
          (parseFloat(taxesPaid.advanceTax) || 0) +
          (parseFloat(taxesPaid.selfAssessmentTax) || 0);

        const refundOrPayable = totalTaxesPaid - totalTaxLiability;

        const breakdown = {
          grossTotalIncome,
          totalDeductions,
          taxableIncome,
          taxLiability,
          rebate87A,
          taxAfterRebate,
          cess,
          totalTaxLiability,
          totalTaxesPaid,
          refundOrPayable,
          isRefund: refundOrPayable > 0,
          regime,
        };

        setTaxBreakdown(breakdown);
        onComputed?.(breakdown);
      } catch (calcError) {
        setError('Failed to calculate tax. Please check your inputs.');
        console.error('Tax calculation error:', calcError);
      }
    } finally {
      setIsCalculating(false);
    }
  }, [formData, regime, assessmentYear, onComputed]);

  useEffect(() => {
    calculateTax();
  }, [calculateTax]);

  // Loading state
  if (isCalculating) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-3">
            <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
          </div>
          <p className="text-body-regular font-medium text-slate-600">Calculating tax...</p>
          <p className="text-body-small text-slate-400 mt-1">This may take a moment</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-12 h-12 rounded-full bg-error-50 flex items-center justify-center mx-auto mb-3">
          <Calculator className="w-6 h-6 text-error-500" />
        </div>
        <p className="text-body-regular text-error-600 font-medium">{error}</p>
        <button
          onClick={calculateTax}
          className="mt-3 text-body-regular text-primary-600 hover:text-primary-700 font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  // Empty state
  if (!taxBreakdown) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <Calculator className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-body-regular text-slate-600 font-medium">No tax data available</p>
        <p className="text-body-small text-slate-400 mt-1">Enter income and deduction details to calculate tax</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Gross Total Income"
          value={taxBreakdown.grossTotalIncome}
          icon={IndianRupee}
          colorScheme="blue"
        />
        <StatCard
          label="Total Deductions"
          value={taxBreakdown.totalDeductions}
          icon={TrendingDown}
          colorScheme="green"
        />
        <StatCard
          label="Taxable Income"
          value={taxBreakdown.taxableIncome}
          icon={Calculator}
          colorScheme="purple"
        />
      </div>

      {/* Tax Breakdown */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-5 border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-slate-600" />
          Tax Breakdown ({taxBreakdown.regime === 'new' ? 'New Regime' : 'Old Regime'})
        </h4>

        <div className="space-y-3">
          <div className="flex justify-between text-body-regular">
            <span className="text-slate-600">Tax on Income</span>
            <span className="font-semibold text-slate-900 tabular-nums">
              ₹{formatCurrency(taxBreakdown.taxLiability)}
            </span>
          </div>

          {taxBreakdown.rebate87A > 0 && (
            <div className="flex justify-between text-body-regular">
              <span className="text-slate-600">Less: Rebate u/s 87A</span>
              <span className="font-semibold text-emerald-600 tabular-nums">
                -₹{formatCurrency(taxBreakdown.rebate87A)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-body-regular">
            <span className="text-slate-600">Health & Education Cess (4%)</span>
            <span className="font-semibold text-slate-900 tabular-nums">
              ₹{formatCurrency(taxBreakdown.cess)}
            </span>
          </div>

          <div className="border-t border-slate-300 pt-3 flex justify-between">
            <span className="font-semibold text-slate-900">Total Tax Liability</span>
            <span className="font-bold text-slate-900 tabular-nums text-body-large">
              ₹{formatCurrency(taxBreakdown.totalTaxLiability)}
            </span>
          </div>

          <div className="flex justify-between text-body-regular pt-2">
            <span className="text-slate-600">Less: Taxes Already Paid (TDS/Advance)</span>
            <span className="font-semibold text-blue-600 tabular-nums">
              -₹{formatCurrency(taxBreakdown.totalTaxesPaid)}
            </span>
          </div>
        </div>
      </div>

      {/* Refund/Payable Result */}
      <AnimatePresence mode="wait">
        <motion.div
          key={taxBreakdown.isRefund ? 'refund' : 'payable'}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`rounded-xl p-5 border-2 ${
            taxBreakdown.isRefund
              ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300'
              : taxBreakdown.refundOrPayable === 0
              ? 'bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-300'
              : 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                taxBreakdown.isRefund
                  ? 'bg-emerald-100'
                  : taxBreakdown.refundOrPayable === 0
                  ? 'bg-slate-100'
                  : 'bg-amber-100'
              }`}>
                {taxBreakdown.isRefund ? (
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {taxBreakdown.isRefund ? 'Refund Due' : taxBreakdown.refundOrPayable === 0 ? 'No Tax Due' : 'Tax Payable'}
                </p>
                <p className="text-body-small text-slate-500">
                  {taxBreakdown.isRefund ? 'You will receive this amount' : 'Amount to be paid'}
                </p>
              </div>
            </div>
            <span className={`text-2xl font-bold tabular-nums ${
              taxBreakdown.isRefund
                ? 'text-emerald-700'
                : taxBreakdown.refundOrPayable === 0
                ? 'text-slate-700'
                : 'text-amber-700'
            }`}>
              {taxBreakdown.isRefund ? '+' : taxBreakdown.refundOrPayable < 0 ? '' : ''}₹{formatCurrency(Math.abs(taxBreakdown.refundOrPayable))}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default TaxCalculator;
