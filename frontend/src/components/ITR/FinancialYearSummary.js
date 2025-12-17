// =====================================================
// FINANCIAL YEAR SUMMARY COMPONENT
// Prominent card displaying Gross Total Income, Deductions, and Tax Payable
// Matches ITR-specific dashboard specification
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, IndianRupee } from 'lucide-react';
import AnimatedNumber from '../UI/AnimatedNumber';
import { formatIndianCurrency } from '../../lib/format';
import { cn } from '../../lib/utils';

const FinancialYearSummary = ({
  grossTotalIncome = 0,
  totalDeductions = 0,
  taxPayable = 0,
  className = '',
}) => {
  const summaryItems = [
    {
      label: 'Gross Total Income',
      value: grossTotalIncome,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Total Deductions',
      value: totalDeductions,
      icon: TrendingDown,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Tax Payable',
      value: taxPayable,
      icon: IndianRupee,
      color: 'text-gold-600',
      bgColor: 'bg-gold-50',
      isHighlight: true,
    },
  ];

  return (
    <div className={cn('w-full', className)}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl border-2 border-gold-200 shadow-elevation-2 overflow-hidden"
      >
        {/* Header - Compact */}
        <div className="bg-gradient-to-r from-gold-100 via-white to-gold-100/30 border-b border-gold-200 px-4 py-2.5">
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">Financial Year Summary</h2>
        </div>

        {/* Summary Cards Grid - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          {summaryItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className={cn(
                  'relative rounded-xl p-4 border-2 transition-all',
                  item.isHighlight
                    ? 'border-gold-300 bg-gradient-to-br from-gold-50 to-white shadow-elevation-2'
                    : 'border-neutral-200 bg-white hover:border-neutral-300',
                )}
              >
                {/* Icon - Compact */}
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
                  item.bgColor,
                )}>
                  <Icon className={cn('w-5 h-5', item.color)} />
                </div>

                {/* Label - Compact */}
                <p className="text-body-small font-medium text-neutral-500 uppercase tracking-wide mb-1.5">
                  {item.label}
                </p>

                {/* Value - Compact */}
                <div className={cn(
                  'text-2xl font-bold tabular-nums',
                  item.isHighlight ? 'text-gold-900' : 'text-neutral-900',
                )}>
                  <AnimatedNumber
                    value={item.value}
                    format="currency"
                    duration={0.8}
                  />
                </div>

                {/* Highlight badge - Compact */}
                {item.isHighlight && (
                  <div className="absolute top-3 right-3">
                    <span className="px-1.5 py-0.5 text-[10px] font-bold text-gold-700 bg-gold-100 rounded">
                      KEY
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default FinancialYearSummary;

