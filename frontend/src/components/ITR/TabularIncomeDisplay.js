// =====================================================
// TABULAR INCOME DISPLAY COMPONENT
// Compact table-based income displays for ITR-specific dashboard
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { formatIndianCurrency } from '../../lib/format';
import { cn } from '../../lib/utils';

const TabularIncomeDisplay = ({
  incomeData = {},
  selectedITR = 'ITR-1',
  className = '',
}) => {
  // Salary Income Table
  const renderSalaryTable = () => {
    const salaries = incomeData.salary || [];
    if (!salaries || salaries.length === 0) return null;

    return (
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="bg-neutral-50 border-b border-neutral-200 px-3 py-2">
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
            Salary Income (From Form 16)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-body-small">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-200">
                <th className="px-3 py-1.5 text-left font-semibold text-neutral-700">Employer Name</th>
                <th className="px-3 py-1.5 text-right font-semibold text-neutral-700">Gross Salary</th>
                <th className="px-3 py-1.5 text-right font-semibold text-neutral-700">Taxable Salary</th>
              </tr>
            </thead>
            <tbody>
              {salaries.map((salary, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-neutral-100 hover:bg-neutral-50"
                >
                  <td className="px-3 py-1.5 text-neutral-900 font-medium">{salary.employerName || 'N/A'}</td>
                  <td className="px-3 py-1.5 text-right text-neutral-900 font-medium tabular-nums">
                    {formatIndianCurrency(salary.grossSalary || 0)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-neutral-900 font-bold tabular-nums">
                    {formatIndianCurrency(salary.taxableSalary || salary.grossSalary || 0)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Other Sources Table
  const renderOtherSourcesTable = () => {
    const interest = incomeData.interestSavings || 0;
    const dividend = incomeData.dividend || 0;
    const other = incomeData.otherIncome || 0;

    if (interest === 0 && dividend === 0 && other === 0) return null;

    return (
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="bg-neutral-50 border-b border-neutral-200 px-3 py-2">
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
            Other Sources of Income
          </h3>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-[10px] text-neutral-500 mb-1">Interest from Savings</p>
              <p className="text-body-regular font-bold text-neutral-900 tabular-nums">
                {formatIndianCurrency(interest)}
              </p>
            </div>
            <div className="text-center border-x border-neutral-200">
              <p className="text-[10px] text-neutral-500 mb-1">Dividend Income</p>
              <p className="text-body-regular font-bold text-neutral-900 tabular-nums">
                {formatIndianCurrency(dividend)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-neutral-500 mb-1">Other Income</p>
              <p className="text-body-regular font-bold text-neutral-900 tabular-nums">
                {formatIndianCurrency(other)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn('w-full space-y-3', className)}>
      {renderSalaryTable()}
      {renderOtherSourcesTable()}
    </div>
  );
};

export default TabularIncomeDisplay;

