// =====================================================
// DEDUCTIONS TABLE COMPONENT
// Compact table displaying Chapter VI-A deductions
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { formatIndianCurrency } from '../../lib/format';
import { cn } from '../../lib/utils';

const DeductionsTable = ({
  deductions = {},
  className = '',
}) => {
  const deductionSections = [
    { key: 'section80C', label: 'Section 80C', maxLimit: 150000, value: deductions.section80C || 0 },
    { key: 'section80D', label: 'Section 80D', maxLimit: 25000, value: deductions.section80D || 0 },
    { key: 'section80TTA', label: 'Section 80TTA', maxLimit: 10000, value: deductions.section80TTA || 0 },
    { key: 'section80G', label: 'Section 80G', maxLimit: null, value: deductions.section80G || 0 },
    { key: 'section80TTB', label: 'Section 80TTB', maxLimit: 50000, value: deductions.section80TTB || 0 },
  ].filter(d => d.value > 0);

  if (deductionSections.length === 0) {
    return (
      <div className={cn('bg-white rounded-xl border border-neutral-200 p-4', className)}>
        <div className="text-center text-body-regular text-neutral-500">
          No deductions entered yet
        </div>
      </div>
    );
  }

  const totalDeductions = deductionSections.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className={cn('w-full', className)}>
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="bg-neutral-50 border-b border-neutral-200 px-3 py-2 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-gold-600" />
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
            Deductions Under Chapter VI-A
          </h3>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {deductionSections.map((section, index) => (
              <motion.div
                key={section.key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="text-center p-2 bg-neutral-50 rounded-xl border border-neutral-200"
              >
                <p className="text-[10px] text-neutral-500 mb-1 font-medium">{section.label}</p>
                <p className="text-body-regular font-bold text-neutral-900 tabular-nums">
                  {formatIndianCurrency(section.value)}
                </p>
                {section.maxLimit && (
                  <p className="text-[9px] text-neutral-400 mt-0.5">
                    Max: {formatIndianCurrency(section.maxLimit)}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Total Deductions */}
          <div className="mt-3 pt-3 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <span className="text-body-small font-semibold text-neutral-700">Total Deductions</span>
              <span className="text-body-large font-bold text-gold-900 tabular-nums">
                {formatIndianCurrency(totalDeductions)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeductionsTable;

