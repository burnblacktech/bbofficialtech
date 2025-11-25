import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
} from 'lucide-react';

const LiveComputation = ({ taxCalculation, filingData, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!taxCalculation) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="h-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const {
    totalIncome,
    totalDeductions,
    taxableIncome,
    totalTaxLiability,
    totalTaxesPaid,
    refund,
    taxDue,
    breakdown,
  } = taxCalculation;

  const hasRefund = refund > 0;
  const hasTaxDue = taxDue > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Tax Summary</h3>
          </div>
          {isLoading && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Calculating...</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Summary */}
      <div className="p-6">
        {/* Income Summary */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Income</span>
            <span className="text-sm font-medium text-gray-900">
              ₹{totalIncome?.toLocaleString() || 0}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Deductions</span>
            <span className="text-sm font-medium text-green-600">
              - ₹{totalDeductions?.toLocaleString() || 0}
            </span>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Taxable Income</span>
              <span className="text-sm font-semibold text-gray-900">
                ₹{taxableIncome?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Tax Calculation */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Tax on Income</span>
            <span className="text-sm font-medium text-gray-900">
              ₹{breakdown?.taxBreakdown?.slab1 + breakdown?.taxBreakdown?.slab2 + breakdown?.taxBreakdown?.slab3 + breakdown?.taxBreakdown?.slab4 || 0}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Health & Education Cess</span>
            <span className="text-sm font-medium text-gray-900">
              ₹{breakdown?.taxBreakdown?.cess?.toLocaleString() || 0}
            </span>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Tax Liability</span>
              <span className="text-sm font-semibold text-gray-900">
                ₹{totalTaxLiability?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Taxes Paid */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Taxes Already Paid</span>
            <span className="text-sm font-medium text-blue-600">
              - ₹{totalTaxesPaid?.toLocaleString() || 0}
            </span>
          </div>
        </div>

        {/* Final Result */}
        <div className="border-t border-gray-200 pt-4">
          {hasRefund ? (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Refund Due</span>
                </div>
                <span className="text-xl font-bold text-green-600">
                  ₹{refund?.toLocaleString() || 0}
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                You will receive this refund after processing
              </p>
            </motion.div>
          ) : hasTaxDue ? (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-orange-50 border border-orange-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Tax Due</span>
                </div>
                <span className="text-xl font-bold text-orange-600">
                  ₹{taxDue?.toLocaleString() || 0}
                </span>
              </div>
              <p className="text-xs text-orange-600 mt-1">
                Pay this amount to complete your filing
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">No Tax Due</span>
                </div>
                <span className="text-xl font-bold text-gray-600">₹0</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Your tax liability is fully covered
              </p>
            </motion.div>
          )}
        </div>

        {/* Expandable Breakdown */}
        <div className="mt-6">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full flex items-center justify-between p-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span>View Detailed Breakdown</span>
            {showBreakdown ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <AnimatePresence>
            {showBreakdown && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 space-y-4"
              >
                {/* Income Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Income Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Salary</span>
                      <span className="text-gray-900">₹{breakdown?.incomeBreakdown?.salary?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Other Sources</span>
                      <span className="text-gray-900">₹{breakdown?.incomeBreakdown?.otherSources?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium border-t border-gray-200 pt-2">
                      <span className="text-gray-700">Total</span>
                      <span className="text-gray-900">₹{breakdown?.incomeBreakdown?.total?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Deduction Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Deduction Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Section 80C</span>
                      <span className="text-gray-900">₹{breakdown?.deductionBreakdown?.section80C?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Section 80D</span>
                      <span className="text-gray-900">₹{breakdown?.deductionBreakdown?.section80D?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Section 80TTA</span>
                      <span className="text-gray-900">₹{breakdown?.deductionBreakdown?.section80TTA?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium border-t border-gray-200 pt-2">
                      <span className="text-gray-700">Total</span>
                      <span className="text-gray-900">₹{breakdown?.deductionBreakdown?.total?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Tax Slab Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Tax Slab Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">0 - ₹2,50,000 (0%)</span>
                      <span className="text-gray-900">₹{breakdown?.taxBreakdown?.slab1?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">₹2,50,001 - ₹5,00,000 (5%)</span>
                      <span className="text-gray-900">₹{breakdown?.taxBreakdown?.slab2?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">₹5,00,001 - ₹10,00,000 (20%)</span>
                      <span className="text-gray-900">₹{breakdown?.taxBreakdown?.slab3?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">₹10,00,001+ (30%)</span>
                      <span className="text-gray-900">₹{breakdown?.taxBreakdown?.slab4?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Health & Education Cess (4%)</span>
                      <span className="text-gray-900">₹{breakdown?.taxBreakdown?.cess?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Insights */}
        {filingData && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-800 font-medium">AI Insight</p>
                <p className="text-blue-700 mt-1">
                  {hasRefund
                    ? "Great! You're getting a refund. Consider investing it in tax-saving instruments for next year."
                    : hasTaxDue
                    ? 'You have tax due. Consider making advance tax payments to avoid interest charges.'
                    : 'Your tax planning looks good. Consider maximizing deductions to optimize your tax liability.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveComputation;
