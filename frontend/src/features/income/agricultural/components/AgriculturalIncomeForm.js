// =====================================================
// AGRICULTURAL INCOME FORM COMPONENT
// Form for declaring agricultural income (Schedule EI/AI)
// Per ITD Rules: Agricultural income is exempt but aggregated for rate purposes
// =====================================================

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wheat,
  Plus,
  Trash2,
  Info,
  AlertTriangle,
  HelpCircle,
  MapPin,
  Calendar,
  IndianRupee,
} from 'lucide-react';
import { cn } from '../../../../utils';
import { springs, variants } from '../../../../lib/motion';

// Agricultural income types per ITD guidelines
const AGRICULTURAL_INCOME_TYPES = [
  {
    id: 'crop_cultivation',
    label: 'Income from Crop Cultivation',
    description: 'Sale of crops, grains, vegetables, fruits grown on agricultural land',
  },
  {
    id: 'farm_rent',
    label: 'Rent from Agricultural Land',
    description: 'Rental income from leasing out agricultural land',
  },
  {
    id: 'nursery',
    label: 'Income from Nursery Operations',
    description: 'Sale of seedlings, saplings, plants from nursery',
  },
  {
    id: 'dairy_poultry',
    label: 'Dairy/Poultry on Agricultural Land',
    description: 'Income from dairy farming or poultry on agricultural premises',
  },
  {
    id: 'horticulture',
    label: 'Horticulture Income',
    description: 'Income from flower cultivation, plantations, orchards',
  },
  {
    id: 'other',
    label: 'Other Agricultural Income',
    description: 'Any other income derived from agricultural activities',
  },
];

// ITR-1 limit for agricultural income
const ITR1_AGRI_LIMIT = 5000;

const AgriculturalIncomeForm = ({
  data = {},
  onUpdate,
  selectedITR = 'ITR-1',
  filingId,
  readOnly = false,
}) => {
  // Keep latest onUpdate without making effects re-run on every render (parent passes inline callbacks)
  const onUpdateRef = useRef(onUpdate);
  const lastPushedRef = useRef(null);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Initialize state from data
  const [hasAgriculturalIncome, setHasAgriculturalIncome] = useState(
    data?.hasAgriculturalIncome ?? false,
  );
  const [agriculturalIncomes, setAgriculturalIncomes] = useState(
    data?.agriculturalIncomes || [],
  );

  // Calculate total agricultural income
  const totalAgriculturalIncome = useMemo(() => {
    return agriculturalIncomes.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  }, [agriculturalIncomes]);

  // Check if exceeds ITR-1 limit
  const exceedsITR1Limit = useMemo(() => {
    return selectedITR === 'ITR-1' && totalAgriculturalIncome > ITR1_AGRI_LIMIT;
  }, [selectedITR, totalAgriculturalIncome]);

  // Propagate changes to parent (avoid infinite loops by not depending on onUpdate identity)
  useEffect(() => {
    const payload = {
      hasAgriculturalIncome,
      agriculturalIncomes,
      netAgriculturalIncome: totalAgriculturalIncome,
    };

    const serialized = JSON.stringify(payload);
    if (serialized === lastPushedRef.current) return;
    lastPushedRef.current = serialized;

    onUpdateRef.current?.(payload);
  }, [hasAgriculturalIncome, agriculturalIncomes, totalAgriculturalIncome]);

  const handleAddIncome = () => {
    const newIncome = {
      id: Date.now(),
      type: '',
      amount: 0,
      landLocation: '',
      landArea: '',
      landAreaUnit: 'acres',
      financialYear: '2024-25',
      description: '',
    };
    setAgriculturalIncomes([...agriculturalIncomes, newIncome]);
  };

  const handleRemoveIncome = (id) => {
    setAgriculturalIncomes(agriculturalIncomes.filter((item) => item.id !== id));
  };

  const handleIncomeChange = (id, field, value) => {
    setAgriculturalIncomes(
      agriculturalIncomes.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      }),
    );
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Toggle */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-green-50 flex items-center justify-center">
            <Wheat className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-heading-4 font-semibold text-slate-900">Agricultural Income</h3>
            <p className="text-body-regular text-slate-500 mt-0.5">
              Income from agricultural activities (exempt but aggregated for rate purposes)
            </p>
          </div>
        </div>
      </div>

      {/* Agricultural Income Toggle */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasAgriculturalIncome}
            onChange={(e) => setHasAgriculturalIncome(e.target.checked)}
            disabled={readOnly}
            className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-body-regular font-medium text-slate-700">
            I have agricultural income to declare
          </span>
        </label>
      </div>

      {/* ITR-1 Limit Warning - Enhanced with Regulatory Guidance */}
      {selectedITR === 'ITR-1' && hasAgriculturalIncome && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'rounded-xl p-4 border-2 flex items-start gap-3',
            exceedsITR1Limit
              ? 'bg-error-50 border-error-300'
              : 'bg-amber-50 border-amber-300',
          )}
        >
          <AlertTriangle className={cn(
            'w-5 h-5 flex-shrink-0 mt-0.5',
            exceedsITR1Limit ? 'text-error-600' : 'text-amber-600',
          )} />
          <div className="flex-1">
            <p className={cn(
              'text-sm font-bold',
              exceedsITR1Limit ? 'text-red-900' : 'text-amber-900',
            )}>
              {exceedsITR1Limit
                ? '⚠️ Agricultural Income Exceeds ₹5,000 - ITR-2 Required'
                : 'ITR-1 Agricultural Income Limit'
              }
            </p>
            <p className={cn(
              'text-sm mt-1.5',
              exceedsITR1Limit ? 'text-red-800' : 'text-amber-800',
            )}>
              {exceedsITR1Limit
                ? `Your agricultural income (${formatCurrency(totalAgriculturalIncome)}) exceeds the ₹5,000 limit for ITR-1. ` +
                  'As per Income Tax Department rules, you must file ITR-2. The system will automatically switch to ITR-2 when you proceed.'
                : `ITR-1 allows agricultural income up to ₹5,000 only. Current total: ${formatCurrency(totalAgriculturalIncome)}`
              }
            </p>
            {exceedsITR1Limit && (
              <p className="text-body-small text-error-700 mt-2 font-medium">
                This is a regulatory requirement - ITR-1 returns with agricultural income above ₹5,000 will be rejected by the Income Tax Department.
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Agricultural Income Details */}
      <AnimatePresence>
        {hasAgriculturalIncome && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={springs.gentle}
            className="space-y-4"
          >
            {/* Income Entries */}
            {agriculturalIncomes.length === 0 ? (
              <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 p-8 text-center">
                <Wheat className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-body-regular text-slate-600 mb-4">No agricultural income entries yet</p>
                <button
                  onClick={handleAddIncome}
                  disabled={readOnly}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Agricultural Income
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {agriculturalIncomes.map((income, index) => (
                  <motion.div
                    key={income.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl border-2 border-slate-200 p-5 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-body-small font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        Entry #{index + 1}
                      </span>
                      {!readOnly && (
                        <button
                          onClick={() => handleRemoveIncome(income.id)}
                          className="p-1.5 text-slate-400 hover:text-error-500 hover:bg-error-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Income Type */}
                      <div className="md:col-span-2">
                        <label className="block text-body-regular font-medium text-slate-700 mb-1.5">
                          Type of Agricultural Income
                        </label>
                        <select
                          value={income.type}
                          onChange={(e) => handleIncomeChange(income.id, 'type', e.target.value)}
                          disabled={readOnly}
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all disabled:bg-slate-50"
                        >
                          <option value="">Select type</option>
                          {AGRICULTURAL_INCOME_TYPES.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        {income.type && (
                          <p className="text-body-small text-slate-500 mt-1">
                            {AGRICULTURAL_INCOME_TYPES.find((t) => t.id === income.type)?.description}
                          </p>
                        )}
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-body-regular font-medium text-slate-700 mb-1.5">
                          <IndianRupee className="w-3.5 h-3.5 inline mr-1" />
                          Amount
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                          <input
                            type="number"
                            value={income.amount || ''}
                            onChange={(e) => handleIncomeChange(income.id, 'amount', e.target.value)}
                            disabled={readOnly}
                            placeholder="0"
                            className="w-full pl-8 pr-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all text-right tabular-nums disabled:bg-slate-50"
                          />
                        </div>
                      </div>

                      {/* Financial Year */}
                      <div>
                        <label className="block text-body-regular font-medium text-slate-700 mb-1.5">
                          <Calendar className="w-3.5 h-3.5 inline mr-1" />
                          Financial Year
                        </label>
                        <select
                          value={income.financialYear}
                          onChange={(e) => handleIncomeChange(income.id, 'financialYear', e.target.value)}
                          disabled={readOnly}
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all disabled:bg-slate-50"
                        >
                          <option value="2024-25">2024-25</option>
                          <option value="2023-24">2023-24</option>
                        </select>
                      </div>

                      {/* Land Location */}
                      <div className="md:col-span-2">
                        <label className="block text-body-regular font-medium text-slate-700 mb-1.5">
                          <MapPin className="w-3.5 h-3.5 inline mr-1" />
                          Land Location (Optional)
                        </label>
                        <input
                          type="text"
                          value={income.landLocation || ''}
                          onChange={(e) => handleIncomeChange(income.id, 'landLocation', e.target.value)}
                          disabled={readOnly}
                          placeholder="Village, District, State"
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all disabled:bg-slate-50"
                        />
                      </div>

                      {/* Land Area */}
                      <div>
                        <label className="block text-body-regular font-medium text-slate-700 mb-1.5">
                          Land Area (Optional)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={income.landArea || ''}
                            onChange={(e) => handleIncomeChange(income.id, 'landArea', e.target.value)}
                            disabled={readOnly}
                            placeholder="0"
                            className="flex-1 px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all disabled:bg-slate-50"
                          />
                          <select
                            value={income.landAreaUnit}
                            onChange={(e) => handleIncomeChange(income.id, 'landAreaUnit', e.target.value)}
                            disabled={readOnly}
                            className="w-24 px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all disabled:bg-slate-50"
                          >
                            <option value="acres">Acres</option>
                            <option value="hectares">Hectares</option>
                            <option value="bigha">Bigha</option>
                          </select>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-body-regular font-medium text-slate-700 mb-1.5">
                          Description (Optional)
                        </label>
                        <input
                          type="text"
                          value={income.description || ''}
                          onChange={(e) => handleIncomeChange(income.id, 'description', e.target.value)}
                          disabled={readOnly}
                          placeholder="Additional details..."
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all disabled:bg-slate-50"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Add More Button */}
                {!readOnly && (
                  <button
                    onClick={handleAddIncome}
                    className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-body-regular font-medium text-slate-600 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Agricultural Income
                  </button>
                )}
              </div>
            )}

            {/* Total Summary */}
            {agriculturalIncomes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-body-regular font-medium text-emerald-800">
                      Total Agricultural Income
                    </span>
                    <p className="text-body-small text-emerald-600 mt-0.5">
                      Exempt from tax • Aggregated for rate calculation
                    </p>
                  </div>
                  <span className="text-heading-3 font-bold text-emerald-700 tabular-nums">
                    {formatCurrency(totalAgriculturalIncome)}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-body-regular text-blue-800">
                <p className="font-medium mb-1">How Agricultural Income is Taxed</p>
                <ul className="text-body-small text-blue-700 space-y-1 list-disc list-inside">
                  <li>Agricultural income is exempt from income tax under Section 10(1)</li>
                  <li>However, if your total income exceeds ₹2.5 lakh, agricultural income is added for rate calculation</li>
                  <li>ITR-1 allows agricultural income up to ₹5,000 only; beyond that, use ITR-2 or ITR-3</li>
                  <li>Ensure you have proper records of land ownership and crop sales</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgriculturalIncomeForm;

