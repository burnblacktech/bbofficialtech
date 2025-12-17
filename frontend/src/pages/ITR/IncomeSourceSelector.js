// =====================================================
// INCOME SOURCE SELECTOR PAGE
// Guided mode - Select income sources → System recommends ITR
// =====================================================

import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Home,
  TrendingUp,
  Globe,
  Calculator,
  Gift,
  Wheat,
  Users,
  CheckCircle,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Income source categories
const INCOME_SOURCES = [
  {
    id: 'salary',
    label: 'Salary / Pension',
    description: 'Income from employment or retirement pension',
    icon: Briefcase,
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    itrTypes: ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'],
  },
  {
    id: 'house_property',
    label: 'House Property',
    description: 'Rental income from property',
    icon: Home,
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-50',
    itrTypes: ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'],
    subOptions: [
      { id: 'one', label: 'One property', itrTypes: ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'] },
      { id: 'multiple', label: 'Multiple properties', itrTypes: ['ITR-2', 'ITR-3'] },
    ],
  },
  {
    id: 'capital_gains',
    label: 'Capital Gains',
    description: 'Profit from selling shares, mutual funds, property',
    icon: TrendingUp,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    itrTypes: ['ITR-2', 'ITR-3'],
    subOptions: [
      { id: 'equity', label: 'Equity shares / Mutual Funds', itrTypes: ['ITR-2', 'ITR-3'] },
      { id: 'property', label: 'Property sale', itrTypes: ['ITR-2', 'ITR-3'] },
      { id: 'crypto', label: 'Crypto / VDAs', itrTypes: ['ITR-2', 'ITR-3'] },
    ],
  },
  {
    id: 'business',
    label: 'Business Income',
    description: 'Income from business activities',
    icon: Building2,
    color: 'from-amber-500 to-gold-500',
    bgColor: 'bg-amber-50',
    itrTypes: ['ITR-3', 'ITR-4'],
    subOptions: [
      { id: 'presumptive', label: 'Presumptive (44AD) - Turnover ≤ ₹2Cr', itrTypes: ['ITR-4'] },
      { id: 'regular', label: 'Regular (with books)', itrTypes: ['ITR-3'] },
    ],
  },
  {
    id: 'professional',
    label: 'Professional Income',
    description: 'Income from profession (doctor, CA, lawyer, etc.)',
    icon: Calculator,
    color: 'from-rose-500 to-red-500',
    bgColor: 'bg-rose-50',
    itrTypes: ['ITR-3', 'ITR-4'],
    subOptions: [
      { id: 'presumptive', label: 'Presumptive (44ADA) - Receipts ≤ ₹50L', itrTypes: ['ITR-4'] },
      { id: 'regular', label: 'Regular (with books)', itrTypes: ['ITR-3'] },
    ],
  },
  {
    id: 'foreign',
    label: 'Foreign Income / Assets',
    description: 'Income from abroad or foreign investments',
    icon: Globe,
    color: 'from-sky-500 to-blue-500',
    bgColor: 'bg-sky-50',
    itrTypes: ['ITR-2', 'ITR-3'],
  },
  {
    id: 'agricultural',
    label: 'Agricultural Income',
    description: 'Income from farming activities',
    icon: Wheat,
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-50',
    itrTypes: ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'],
    subOptions: [
      { id: 'upto5k', label: 'Up to ₹5,000', itrTypes: ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'] },
      { id: 'above5k', label: 'Above ₹5,000', itrTypes: ['ITR-2', 'ITR-3'] },
    ],
  },
  {
    id: 'other',
    label: 'Other Income',
    description: 'Interest, dividends, gifts, lottery winnings',
    icon: Gift,
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-50',
    itrTypes: ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'],
  },
  {
    id: 'director',
    label: 'Director in Company',
    description: 'If you are a director in any company',
    icon: Users,
    color: 'from-slate-500 to-gray-500',
    bgColor: 'bg-slate-50',
    itrTypes: ['ITR-2', 'ITR-3'],
  },
];

const ITR_RECOMMENDATIONS = {
  'ITR-1': {
    name: 'ITR-1 (Sahaj)',
    description: 'Simplest form for salaried individuals',
    complexity: 'Simple',
    time: '15-20 mins',
  },
  'ITR-2': {
    name: 'ITR-2',
    description: 'For individuals with capital gains or foreign assets',
    complexity: 'Moderate',
    time: '30-45 mins',
  },
  'ITR-3': {
    name: 'ITR-3',
    description: 'For business/professional income with books',
    complexity: 'Complex',
    time: '45-60 mins',
  },
  'ITR-4': {
    name: 'ITR-4 (Sugam)',
    description: 'For presumptive taxation scheme',
    complexity: 'Moderate',
    time: '20-30 mins',
  },
};

const IncomeSourceSelector = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedPerson = location.state?.selectedPerson;

  const [selectedSources, setSelectedSources] = useState({});
  const [expandedSource, setExpandedSource] = useState(null);
  const [showResult, setShowResult] = useState(false);

  // Calculate recommended ITR based on selections
  const recommendedITR = useMemo(() => {
    const selected = Object.entries(selectedSources).filter(([, v]) => v);

    if (selected.length === 0) return null;

    // Priority: ITR-3 > ITR-2 > ITR-4 > ITR-1
    let eligibleITRs = new Set(['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4']);

    for (const [sourceId, value] of selected) {
      const source = INCOME_SOURCES.find((s) => s.id === sourceId);
      if (!source) continue;

      if (value === true) {
        // Intersect with source's eligible ITRs
        eligibleITRs = new Set([...eligibleITRs].filter((itr) => source.itrTypes.includes(itr)));
      } else if (source.subOptions) {
        // Find sub-option and use its ITR types
        const subOption = source.subOptions.find((s) => s.id === value);
        if (subOption) {
          eligibleITRs = new Set([...eligibleITRs].filter((itr) => subOption.itrTypes.includes(itr)));
        }
      }
    }

    // Determine recommended ITR (simplest eligible)
    if (eligibleITRs.has('ITR-1')) return 'ITR-1';
    if (eligibleITRs.has('ITR-4')) return 'ITR-4';
    if (eligibleITRs.has('ITR-2')) return 'ITR-2';
    if (eligibleITRs.has('ITR-3')) return 'ITR-3';

    return 'ITR-3'; // Fallback
  }, [selectedSources]);

  const handleSourceToggle = (sourceId, value = true) => {
    setSelectedSources((prev) => ({
      ...prev,
      [sourceId]: prev[sourceId] === value ? null : value,
    }));
  };

  const handleSubOptionSelect = (sourceId, subOptionId) => {
    setSelectedSources((prev) => ({
      ...prev,
      [sourceId]: subOptionId,
    }));
    setExpandedSource(null);
  };

  const handleAnalyze = () => {
    setShowResult(true);
  };

  const handleProceed = () => {
    navigate('/itr/computation', {
      state: {
        selectedITR: recommendedITR,
        selectedPerson,
        selectedSources,
        mode: 'guided',
      },
    });
  };

  const handleBack = () => {
    if (showResult) {
      setShowResult(false);
    } else {
      navigate(-1);
    }
  };

  const selectedCount = Object.values(selectedSources).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-xl hover:bg-neutral-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <div>
              <h1 className="text-heading-3 font-semibold text-neutral-900">
                {showResult ? 'Your Recommendation' : 'Select Income Sources'}
              </h1>
              <p className="text-body-regular text-neutral-500">
                {showResult
                  ? 'Based on your income sources'
                  : 'We\'ll recommend the right ITR form for you'}
              </p>
            </div>
          </div>
          {selectedPerson && (
            <div className="hidden md:flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-xl">
              <span className="text-body-regular text-neutral-700">{selectedPerson.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">
        <AnimatePresence mode="wait">
          {!showResult ? (
            <motion.div
              key="selector"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Instructions */}
              <div className="bg-info-50 rounded-xl border border-info-200 p-4 mb-6 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-info-600 flex-shrink-0 mt-0.5" />
                <p className="text-body-regular text-info-800">
                  Select all the income sources that apply to you. We'll analyze your selections
                  and recommend the most suitable ITR form.
                </p>
              </div>

              {/* Income Source Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {INCOME_SOURCES.map((source, index) => {
                  const Icon = source.icon;
                  const isSelected = selectedSources[source.id];
                  const isExpanded = expandedSource === source.id;
                  const hasSubOptions = source.subOptions && source.subOptions.length > 0;

                  return (
                    <motion.div
                      key={source.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div
                        className={cn(
                          'rounded-xl border-2 overflow-hidden transition-all cursor-pointer',
                          isSelected
                            ? 'border-gold-500 shadow-elevation-2'
                            : 'border-neutral-200 hover:border-neutral-300',
                        )}
                        onClick={() => {
                          if (hasSubOptions) {
                            setExpandedSource(isExpanded ? null : source.id);
                          } else {
                            handleSourceToggle(source.id);
                          }
                        }}
                      >
                        <div className={cn('p-4', isSelected ? source.bgColor : 'bg-white')}>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br',
                              source.color,
                            )}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-neutral-900">{source.label}</h3>
                              <p className="text-body-small text-neutral-500">{source.description}</p>
                            </div>
                            {isSelected && !hasSubOptions && (
                              <CheckCircle className="w-5 h-5 text-gold-500" />
                            )}
                            {hasSubOptions && (
                              <ArrowRight className={cn(
                                'w-5 h-5 text-neutral-400 transition-transform',
                                isExpanded && 'rotate-90',
                              )} />
                            )}
                          </div>
                        </div>

                        {/* Sub-options */}
                        <AnimatePresence>
                          {hasSubOptions && isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 bg-neutral-50 border-t border-neutral-200 space-y-2">
                                {source.subOptions.map((sub) => (
                                  <button
                                    key={sub.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSubOptionSelect(source.id, sub.id);
                                    }}
                                    className={cn(
                                      'w-full text-left px-3 py-2 rounded-xl text-sm transition-colors',
                                      selectedSources[source.id] === sub.id
                                        ? 'bg-gold-100 text-gold-700 font-medium'
                                        : 'hover:bg-neutral-100 text-neutral-700',
                                    )}
                                  >
                                    {sub.label}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between">
                <p className="text-body-regular text-neutral-500">
                  {selectedCount > 0
                    ? `${selectedCount} income source${selectedCount > 1 ? 's' : ''} selected`
                    : 'Select at least one income source'}
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={selectedCount === 0}
                  className={cn(
                    'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all',
                    selectedCount > 0
                      ? 'bg-gold-500 text-white hover:bg-gold-600 shadow-elevation-3 shadow-gold-500/25'
                      : 'bg-neutral-200 text-neutral-400 cursor-not-allowed',
                  )}
                >
                  <Sparkles className="w-5 h-5" />
                  Analyze & Recommend
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Recommendation Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-gold-50 to-amber-50 rounded-2xl border-2 border-gold-200 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500 to-amber-500 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-body-regular font-medium text-gold-700 mb-1">Recommended for You</p>
                    <h2 className="text-heading-2 font-bold text-neutral-900">
                      {ITR_RECOMMENDATIONS[recommendedITR]?.name}
                    </h2>
                    <p className="text-body-regular text-neutral-600 mt-1">
                      {ITR_RECOMMENDATIONS[recommendedITR]?.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-body-small font-medium px-2 py-1 rounded-full bg-white text-neutral-600">
                        {ITR_RECOMMENDATIONS[recommendedITR]?.complexity}
                      </span>
                      <span className="text-body-small text-neutral-500">
                        Estimated time: {ITR_RECOMMENDATIONS[recommendedITR]?.time}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Selected Sources Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl border border-neutral-200 p-5 shadow-elevation-1"
              >
                <h3 className="text-sm font-semibold text-neutral-700 mb-3">Your Income Sources</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedSources)
                    .filter(([_, v]) => v)
                    .map(([sourceId, value]) => {
                      const source = INCOME_SOURCES.find((s) => s.id === sourceId);
                      if (!source) return null;
                      const subOption = typeof value === 'string'
                        ? source.subOptions?.find((s) => s.id === value)
                        : null;
                      return (
                        <span
                          key={sourceId}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium',
                            source.bgColor,
                          )}
                        >
                          {source.label}
                          {subOption && (
                            <span className="text-body-small opacity-75">({subOption.label})</span>
                          )}
                        </span>
                      );
                    })}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-between pt-4"
              >
                <button
                  onClick={() => setShowResult(false)}
                  className="text-body-regular font-medium text-neutral-600 hover:text-neutral-800"
                >
                  ← Modify Selections
                </button>
                <button
                  onClick={handleProceed}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 text-white rounded-xl font-semibold hover:bg-gold-600 transition-colors shadow-elevation-3 shadow-gold-500/25"
                >
                  Continue with {recommendedITR}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default IncomeSourceSelector;

