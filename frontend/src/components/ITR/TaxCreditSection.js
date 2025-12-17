// =====================================================
// TAX CREDIT AND PAYMENT SECTION
// Displays TDS credit, self-assessment tax, and final payable/refundable
// Compact design matching ITR-specific dashboard specification
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ArrowDown, ArrowUp, CheckCircle } from 'lucide-react';
import { formatIndianCurrency } from '../../lib/format';
import { cn } from '../../lib/utils';

const TaxCreditSection = ({
  tdsCredit = 0,
  selfAssessmentTax = 0,
  totalTaxCredit = 0,
  taxPayable = 0,
  isRefund = false,
  className = '',
}) => {
  const finalAmount = Math.abs(taxPayable);

  return (
    <div className={cn('w-full', className)}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl border-2 border-gold-200 shadow-elevation-1 overflow-hidden"
      >
        {/* Header - Compact */}
        <div className="bg-gradient-to-r from-gold-50 to-white border-b border-gold-200 px-4 py-2.5 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-gold-600" />
          <h2 className="text-sm font-bold text-neutral-900">
            TAX CREDIT AND PAYMENT
          </h2>
        </div>

        {/* Content - Compact */}
        <div className="p-4 space-y-2">
          {/* TDS Credit */}
          <div className="flex items-center justify-between py-1.5 px-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <span className="text-body-small font-medium text-neutral-700">TDS Credit</span>
            <span className="text-body-small font-bold text-neutral-900 tabular-nums">
              {formatIndianCurrency(tdsCredit)}
            </span>
          </div>

          {/* Self Assessment Tax */}
          <div className="flex items-center justify-between py-1.5 px-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <span className="text-body-small font-medium text-neutral-700">Self Assessment Tax</span>
            <span className="text-body-small font-bold text-neutral-900 tabular-nums">
              {formatIndianCurrency(selfAssessmentTax)}
            </span>
          </div>

          {/* Total Tax Credit */}
          <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-xl border border-blue-200">
            <span className="text-body-small font-semibold text-blue-900">Total Tax Credit</span>
            <span className="text-body-regular font-bold text-blue-900 tabular-nums">
              {formatIndianCurrency(totalTaxCredit)}
            </span>
          </div>

          {/* Final Payable/Refundable */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'flex items-center justify-between py-2.5 px-3 rounded-xl border-2 mt-2',
              isRefund || finalAmount === 0
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-amber-50 border-amber-300',
            )}
          >
            <div className="flex items-center gap-2">
              {isRefund ? (
                <ArrowDown className="w-4 h-4 text-emerald-600" />
              ) : finalAmount === 0 ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <ArrowUp className="w-4 h-4 text-amber-600" />
              )}
              <span className={cn(
                'text-sm font-bold uppercase tracking-wide',
                isRefund || finalAmount === 0 ? 'text-emerald-900' : 'text-amber-900',
              )}>
                {isRefund ? 'Tax Refundable' : finalAmount === 0 ? 'No Tax Due' : 'Tax Payable'}
              </span>
            </div>
            <span className={cn(
              'text-lg font-bold tabular-nums',
              isRefund || finalAmount === 0 ? 'text-emerald-900' : 'text-amber-900',
            )}>
              {formatIndianCurrency(finalAmount)}
            </span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default TaxCreditSection;

