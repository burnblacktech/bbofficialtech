// =====================================================
// OTHER SOURCES INCOME FORM COMPONENT
// Form for declaring income from other sources (Schedule OS)
// Covers: Interest, Dividend, Family Pension, Lottery, etc.
// =====================================================

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Landmark,
  Building,
  Users,
  Gift,
  HelpCircle,
  AlertTriangle,
  IndianRupee,
} from 'lucide-react';
import { cn } from '../../../../utils';
import { springs, variants } from '../../../../lib/motion';

// Interest income types
const INTEREST_INCOME_TYPES = [
  {
    id: 'savings_bank',
    label: 'Interest from Savings Bank Account',
    icon: Landmark,
    deductionRef: '80TTA',
    deductionLimit: 10000,
    description: 'Interest earned on savings accounts with banks, post offices',
  },
  {
    id: 'fixed_deposit',
    label: 'Interest from Fixed Deposits',
    icon: Building,
    deductionRef: null,
    description: 'Interest from FDs with banks, NBFCs, companies',
  },
  {
    id: 'recurring_deposit',
    label: 'Interest from Recurring Deposits',
    icon: Building,
    deductionRef: null,
    description: 'Interest from RDs with banks, post offices',
  },
  {
    id: 'post_office',
    label: 'Interest from Post Office Schemes',
    icon: Building,
    deductionRef: null,
    description: 'NSC, KVP, Monthly Income Scheme, Senior Citizen Savings',
  },
  {
    id: 'income_tax_refund',
    label: 'Interest on Income Tax Refund',
    icon: IndianRupee,
    deductionRef: null,
    description: 'Interest received on tax refund under Section 244A',
  },
  {
    id: 'other_interest',
    label: 'Other Interest Income',
    icon: IndianRupee,
    deductionRef: null,
    description: 'Interest from loans given, debentures, bonds, etc.',
  },
];

// Other income types
const OTHER_INCOME_TYPES = [
  {
    id: 'dividend',
    label: 'Dividend Income',
    icon: Building,
    taxable: true,
    description: 'Dividends from shares, mutual funds (taxable from AY 2021-22)',
  },
  {
    id: 'family_pension',
    label: 'Family Pension',
    icon: Users,
    deductionLimit: 15000,
    deductionPercent: 33.33,
    description: 'Pension received by family members of deceased employee/pensioner',
  },
  {
    id: 'lottery',
    label: 'Lottery, Crossword Puzzles, Races',
    icon: Gift,
    flatRate: 30,
    description: 'Winnings from lottery, crossword, card games, races (30% TDS)',
  },
  {
    id: 'gift',
    label: 'Gifts Received',
    icon: Gift,
    exemptLimit: 50000,
    description: 'Gifts above ₹50,000 in aggregate from non-relatives',
  },
  {
    id: 'rental_machinery',
    label: 'Rental Income from Machinery/Equipment',
    icon: Building,
    description: 'Income from letting out plant, machinery, furniture',
  },
  {
    id: 'other',
    label: 'Any Other Income',
    icon: IndianRupee,
    description: 'Any other income not covered above',
  },
];

const OtherSourcesForm = ({
  data = {},
  onUpdate,
  selectedITR = 'ITR-1',
  filingId,
  readOnly = false,
}) => {
  // Initialize state
  const [interestIncomes, setInterestIncomes] = useState(data?.interestIncomes || []);
  const [otherIncomes, setOtherIncomes] = useState(data?.otherIncomes || []);

  // Store onUpdate in a ref to avoid infinite loops
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Calculate totals
  const totalInterestIncome = useMemo(() => {
    return interestIncomes.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  }, [interestIncomes]);

  const totalOtherIncome = useMemo(() => {
    return otherIncomes.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  }, [otherIncomes]);

  const totalOtherSourcesIncome = useMemo(() => {
    return totalInterestIncome + totalOtherIncome;
  }, [totalInterestIncome, totalOtherIncome]);

  // Calculate eligible 80TTA deduction
  const eligible80TTADeduction = useMemo(() => {
    const savingsInterest = interestIncomes
      .filter((i) => i.type === 'savings_bank')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    return Math.min(savingsInterest, 10000);
  }, [interestIncomes]);

  // Propagate changes to parent
  useEffect(() => {
    onUpdateRef.current?.({
      interestIncomes,
      otherIncomes,
      totalInterestIncome,
      totalOtherIncome,
      totalOtherSourcesIncome,
      eligible80TTADeduction,
    });
  }, [interestIncomes, otherIncomes, totalInterestIncome, totalOtherIncome, totalOtherSourcesIncome, eligible80TTADeduction]);

  const handleAddInterest = () => {
    setInterestIncomes([
      ...interestIncomes,
      {
        id: Date.now(),
        type: '',
        amount: 0,
        tanOfDeductor: '',
        tdsDeducted: 0,
        description: '',
      },
    ]);
  };

  const handleRemoveInterest = (id) => {
    setInterestIncomes(interestIncomes.filter((item) => item.id !== id));
  };

  const handleInterestChange = (id, field, value) => {
    setInterestIncomes(
      interestIncomes.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleAddOther = () => {
    setOtherIncomes([
      ...otherIncomes,
      {
        id: Date.now(),
        type: '',
        amount: 0,
        tanOfDeductor: '',
        tdsDeducted: 0,
        description: '',
      },
    ]);
  };

  const handleRemoveOther = (id) => {
    setOtherIncomes(otherIncomes.filter((item) => item.id !== id));
  };

  const handleOtherChange = (id, field, value) => {
    setOtherIncomes(
      otherIncomes.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-8">
      {/* INTEREST INCOME SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-50 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-heading-4 font-semibold text-slate-900">Interest Income</h3>
              <p className="text-body-regular text-slate-500">Interest from savings, FDs, deposits, etc.</p>
            </div>
          </div>
          {!readOnly && (
            <button
              onClick={handleAddInterest}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-body-regular font-medium text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          )}
        </div>

        {interestIncomes.length === 0 ? (
          <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center">
            <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-body-regular text-slate-600">No interest income declared</p>
            {!readOnly && (
              <button
                onClick={handleAddInterest}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-body-regular font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Interest Income
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {interestIncomes.map((income, index) => {
              const typeConfig = INTEREST_INCOME_TYPES.find((t) => t.id === income.type);
              return (
                <motion.div
                  key={income.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-xl border-2 border-slate-200 p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Type */}
                      <div>
                        <label className="block text-body-small font-medium text-slate-600 mb-1">
                          Interest Type
                        </label>
                        <select
                          value={income.type}
                          onChange={(e) => handleInterestChange(income.id, 'type', e.target.value)}
                          disabled={readOnly}
                          className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all text-body-regular disabled:bg-slate-50"
                        >
                          <option value="">Select type</option>
                          {INTEREST_INCOME_TYPES.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-body-small font-medium text-slate-600 mb-1">
                          Amount (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-body-regular">₹</span>
                          <input
                            type="number"
                            value={income.amount || ''}
                            onChange={(e) => handleInterestChange(income.id, 'amount', e.target.value)}
                            disabled={readOnly}
                            placeholder="0"
                            className="w-full pl-7 pr-3 py-2 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all text-body-regular text-right tabular-nums disabled:bg-slate-50"
                          />
                        </div>
                      </div>

                      {/* TDS Deducted */}
                      <div>
                        <label className="block text-body-small font-medium text-slate-600 mb-1">
                          TDS Deducted (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-body-regular">₹</span>
                          <input
                            type="number"
                            value={income.tdsDeducted || ''}
                            onChange={(e) => handleInterestChange(income.id, 'tdsDeducted', e.target.value)}
                            disabled={readOnly}
                            placeholder="0"
                            className="w-full pl-7 pr-3 py-2 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all text-body-regular text-right tabular-nums disabled:bg-slate-50"
                          />
                        </div>
                      </div>
                    </div>

                    {!readOnly && (
                      <button
                        onClick={() => handleRemoveInterest(income.id)}
                        className="p-1.5 text-slate-400 hover:text-error-500 hover:bg-error-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Deduction hint */}
                  {typeConfig?.deductionRef && (
                    <p className="mt-2 text-body-small text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                      Eligible for Section {typeConfig.deductionRef} deduction (up to ₹{typeConfig.deductionLimit?.toLocaleString('en-IN')})
                    </p>
                  )}
                </motion.div>
              );
            })}

            {/* Interest Total */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-3 flex items-center justify-between">
              <span className="text-body-regular font-medium text-blue-800">Total Interest Income</span>
              <span className="text-body-large font-bold text-blue-700 tabular-nums">
                {formatCurrency(totalInterestIncome)}
              </span>
            </div>

            {/* 80TTA Eligibility */}
            {eligible80TTADeduction > 0 && (
              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-3 flex items-center justify-between">
                <div>
                  <span className="text-body-regular font-medium text-emerald-800">80TTA Deduction Eligible</span>
                  <p className="text-body-small text-emerald-600">On savings bank interest (max ₹10,000)</p>
                </div>
                <span className="text-body-large font-bold text-emerald-700 tabular-nums">
                  {formatCurrency(eligible80TTADeduction)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* OTHER INCOME SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-50 flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-heading-4 font-semibold text-slate-900">Other Income</h3>
              <p className="text-body-regular text-slate-500">Dividends, family pension, gifts, etc.</p>
            </div>
          </div>
          {!readOnly && (
            <button
              onClick={handleAddOther}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-body-regular font-medium text-purple-600 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          )}
        </div>

        {otherIncomes.length === 0 ? (
          <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center">
            <Gift className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-body-regular text-slate-600">No other income declared</p>
          </div>
        ) : (
          <div className="space-y-3">
            {otherIncomes.map((income, index) => {
              const typeConfig = OTHER_INCOME_TYPES.find((t) => t.id === income.type);
              return (
                <motion.div
                  key={income.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-xl border-2 border-slate-200 p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Type */}
                      <div>
                        <label className="block text-body-small font-medium text-slate-600 mb-1">
                          Income Type
                        </label>
                        <select
                          value={income.type}
                          onChange={(e) => handleOtherChange(income.id, 'type', e.target.value)}
                          disabled={readOnly}
                          className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all text-body-regular disabled:bg-slate-50"
                        >
                          <option value="">Select type</option>
                          {OTHER_INCOME_TYPES.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-body-small font-medium text-slate-600 mb-1">
                          Amount (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-body-regular">₹</span>
                          <input
                            type="number"
                            value={income.amount || ''}
                            onChange={(e) => handleOtherChange(income.id, 'amount', e.target.value)}
                            disabled={readOnly}
                            placeholder="0"
                            className="w-full pl-7 pr-3 py-2 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all text-body-regular text-right tabular-nums disabled:bg-slate-50"
                          />
                        </div>
                      </div>

                      {/* TDS Deducted */}
                      <div>
                        <label className="block text-body-small font-medium text-slate-600 mb-1">
                          TDS Deducted (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-body-regular">₹</span>
                          <input
                            type="number"
                            value={income.tdsDeducted || ''}
                            onChange={(e) => handleOtherChange(income.id, 'tdsDeducted', e.target.value)}
                            disabled={readOnly}
                            placeholder="0"
                            className="w-full pl-7 pr-3 py-2 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all text-body-regular text-right tabular-nums disabled:bg-slate-50"
                          />
                        </div>
                      </div>
                    </div>

                    {!readOnly && (
                      <button
                        onClick={() => handleRemoveOther(income.id)}
                        className="p-1.5 text-slate-400 hover:text-error-500 hover:bg-error-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Special notes for certain types */}
                  {typeConfig?.flatRate && (
                    <p className="mt-2 text-body-small text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block">
                      Taxed at flat rate of {typeConfig.flatRate}%
                    </p>
                  )}
                  {typeConfig?.exemptLimit && (
                    <p className="mt-2 text-body-small text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">
                      Exempt up to ₹{typeConfig.exemptLimit.toLocaleString('en-IN')} from non-relatives
                    </p>
                  )}
                </motion.div>
              );
            })}

            {/* Other Income Total */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-3 flex items-center justify-between">
              <span className="text-body-regular font-medium text-purple-800">Total Other Income</span>
              <span className="text-body-large font-bold text-purple-700 tabular-nums">
                {formatCurrency(totalOtherIncome)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* GRAND TOTAL */}
      {(interestIncomes.length > 0 || otherIncomes.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-body-large font-semibold">Total Income from Other Sources</span>
              <p className="text-body-regular text-slate-300 mt-0.5">Interest + Other Income</p>
            </div>
            <span className="text-heading-2 font-bold tabular-nums">
              {formatCurrency(totalOtherSourcesIncome)}
            </span>
          </div>
        </motion.div>
      )}

      {/* Help Box */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-body-regular text-blue-800">
          <p className="font-medium mb-1">About Other Sources Income</p>
          <ul className="text-body-small text-blue-700 space-y-1 list-disc list-inside">
            <li>Interest from savings accounts up to ₹10,000 is eligible for 80TTA deduction</li>
            <li>For senior citizens (60+), 80TTB allows deduction up to ₹50,000 on all interest income</li>
            <li>Dividend income is fully taxable from AY 2021-22 onwards</li>
            <li>Family pension has standard deduction of ₹15,000 or 1/3rd of pension, whichever is lower</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OtherSourcesForm;

