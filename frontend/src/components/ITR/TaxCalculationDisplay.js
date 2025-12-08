// =====================================================
// TAX CALCULATION DISPLAY COMPONENT
// Detailed tax calculation with slab-wise breakdown
// Compact design matching ITR-specific dashboard specification
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Calculator, CheckCircle } from 'lucide-react';
import { formatIndianCurrency } from '../../lib/format';
import { cn } from '../../lib/utils';

const TaxCalculationDisplay = ({
  slabBreakdown = [],
  taxOnIncome = 0,
  educationCess = 0,
  totalTaxLiability = 0,
  selectedITR = 'ITR-1',
  className = '',
}) => {
  // Format slab display: "Tax on first ₹ X: ₹ Y" or "Tax on next ₹ X @ Y%: ₹ Z"
  const formatSlabLine = (slab, index, isFirst = false) => {
    const rateNum = parseInt(slab.rate?.replace('%', '') || '0', 10) || 0;
    const prefix = isFirst ? 'Tax on first' : 'Tax on next';

    // Extract amount from slab string (e.g., "₹2,50,000 - ₹5,00,000" -> "₹2,50,000" for first, or range for next)
    let amountStr = '';
    if (slab.slab) {
      const parts = slab.slab.split(' - ');
      if (isFirst && parts.length > 0) {
        amountStr = parts[0].replace('₹', '').trim();
      } else if (parts.length > 1) {
        // For "next", show the range end or the taxable amount
        amountStr = parts[1].replace('₹', '').replace('∞', '').trim();
      } else {
        amountStr = slab.slab.replace('₹', '').replace('∞', '').trim();
      }
    }

    if (rateNum === 0) {
      return `${prefix} ₹ ${amountStr}: ${formatIndianCurrency(slab.tax)}`;
    }
    // Show taxable amount if available
    const taxableAmount = slab.taxableAmount || 0;
    return `${prefix} ₹ ${taxableAmount > 0 ? formatIndianCurrency(taxableAmount).replace('₹', '').trim() : amountStr} @ ${slab.rate}: ${formatIndianCurrency(slab.tax)}`;
  };

  const getITRComplianceLabel = (itr) => {
    const labels = {
      'ITR-1': 'ITR-1 COMPLIANT',
      'ITR1': 'ITR-1 COMPLIANT',
      'ITR-2': 'ITR-2 COMPLIANT',
      'ITR2': 'ITR-2 COMPLIANT',
      'ITR-3': 'ITR-3 COMPLIANT',
      'ITR3': 'ITR-3 COMPLIANT',
      'ITR-4': 'ITR-4 COMPLIANT',
      'ITR4': 'ITR-4 COMPLIANT',
    };
    return labels[itr] || 'COMPLIANT';
  };

  return (
    <div className={cn('w-full', className)}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl border-2 border-gold-200 shadow-elevation-1 overflow-hidden"
      >
        {/* Header - Compact */}
        <div className="bg-gradient-to-r from-gold-50 to-white border-b border-gold-200 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-gold-600" />
            <h2 className="text-sm font-bold text-neutral-900">
              TAX CALCULATION - {getITRComplianceLabel(selectedITR)}
            </h2>
          </div>
          <CheckCircle className="w-4 h-4 text-success-600" />
        </div>

        {/* Content - Compact */}
        <div className="p-4 space-y-2.5">
          {/* Slab Breakdown */}
          {slabBreakdown && slabBreakdown.length > 0 ? (
            slabBreakdown.map((slab, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between py-1.5 px-3 bg-neutral-50 rounded-lg border border-neutral-200"
              >
                <span className="text-xs text-neutral-700 font-medium">
                  {formatSlabLine(slab, index, index === 0)}
                </span>
                <span className="text-xs font-bold text-neutral-900 tabular-nums">
                  {formatIndianCurrency(slab.tax)}
                </span>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-4 text-sm text-neutral-500">
              No tax slabs calculated yet
            </div>
          )}

          {/* Health & Education Cess */}
          {educationCess > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: (slabBreakdown?.length || 0) * 0.05 + 0.1 }}
              className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg border border-blue-200"
            >
              <span className="text-xs font-semibold text-blue-900 uppercase">
                Health and Education Cess (4%)
              </span>
              <span className="text-xs font-bold text-blue-900 tabular-nums">
                {formatIndianCurrency(educationCess)}
              </span>
            </motion.div>
          )}

          {/* Total Tax Liability */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (slabBreakdown?.length || 0) * 0.05 + 0.2 }}
            className="flex items-center justify-between py-2.5 px-3 bg-gold-50 rounded-lg border-2 border-gold-300 mt-2"
          >
            <span className="text-sm font-bold text-gold-900 uppercase tracking-wide">
              Total Tax Liability
            </span>
            <span className="text-lg font-bold text-gold-900 tabular-nums">
              {formatIndianCurrency(totalTaxLiability)}
            </span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default TaxCalculationDisplay;

