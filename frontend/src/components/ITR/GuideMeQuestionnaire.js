// =====================================================
// GUIDE ME QUESTIONNAIRE - Progressive 5-Step Flow
// Matches UX.md PATH C specification
// =====================================================

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Home,
  TrendingUp,
  Building2,
  Gift,
  Wheat,
  Globe,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  Info,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { springs } from '../../lib/motion';

// Step 1: Income Sources
const INCOME_SOURCES_STEP1 = [
  {
    id: 'salary',
    label: 'Salary / Pension',
    icon: Briefcase,
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'house_property',
    label: 'Rent from Property',
    icon: Home,
    color: 'from-teal-500 to-cyan-500',
  },
  {
    id: 'capital_gains',
    label: 'Capital Gains (Shares, MF, Property)',
    icon: TrendingUp,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'business',
    label: 'Business / Shop / Trade',
    icon: Building2,
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'freelance',
    label: 'Freelance / Consulting',
    icon: FileText,
    color: 'from-violet-500 to-purple-500',
  },
  {
    id: 'interest_dividends',
    label: 'Interest, Dividends',
    icon: Gift,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'agricultural',
    label: 'Agriculture (above ₹5k)',
    icon: Wheat,
    color: 'from-green-500 to-emerald-500',
    note: 'For amounts above ₹5,000',
  },
  {
    id: 'foreign_income',
    label: 'Foreign Income',
    icon: Globe,
    color: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'fno_trading',
    label: 'F&O / Intraday Trading',
    icon: TrendingUp,
    color: 'from-rose-500 to-pink-500',
  },
];

// Step 2: Income Range
const INCOME_RANGES = [
  { id: 'below50l', label: 'Below ₹50 lakh', max: 5000000 },
  { id: '50l-1cr', label: '₹50 lakh to ₹1 crore', min: 5000000, max: 10000000 },
  { id: 'above1cr', label: 'Above ₹1 crore', min: 10000000 },
];

// Step 3: Residency
const RESIDENCY_OPTIONS = [
  {
    id: 'resident',
    label: 'Yes, Resident',
    description: '(in India 182+ days this year)',
  },
  {
    id: 'nri',
    label: 'No, I\'m NRI / RNOR',
  },
];

// Step 4: Special Cases
const SPECIAL_CASES = [
  { id: 'director', label: 'I\'m a Director in any company' },
  { id: 'unlisted_shares', label: 'I hold unlisted equity shares' },
  { id: 'foreign_account', label: 'I have signing authority in a foreign account' },
  { id: 'foreign_assets', label: 'I have assets or income outside India' },
  { id: 'losses_carryforward', label: 'I have losses to carry forward from previous years' },
  { id: 'none', label: 'None of the above' },
];

// ITR Eligibility Rules
const ITR_RULES = {
  'ITR-1': (answers) => {
    if (answers.residency === 'nri') return false;
    if (answers.incomeRange === 'above1cr') return false;
    if (answers.specialCases.includes('director')) return false;
    if (answers.specialCases.includes('unlisted_shares')) return false;
    if (answers.specialCases.includes('foreign_assets')) return false;
    if (answers.incomeSources.includes('capital_gains')) return false;
    if (answers.incomeSources.includes('business')) return false;
    if (answers.incomeSources.includes('fno_trading')) return false;
    if (answers.incomeSources.includes('foreign_income')) return false;
    // Agricultural income above 5k disqualifies ITR-1
    if (answers.incomeSources.includes('agricultural')) return false;
    // Multiple house properties not allowed
    // This would need additional question, for now assume OK
    return true;
  },
  'ITR-2': (answers) => {
    if (answers.incomeSources.includes('business') && !answers.incomeSources.includes('freelance')) return false;
    if (answers.incomeSources.includes('fno_trading')) return false;
    return true;
  },
  'ITR-3': (answers) => {
    // ITR-3 covers everything
    return true;
  },
  'ITR-4': (answers) => {
    if (answers.residency === 'nri') return false;
    if (answers.incomeRange === 'above1cr') return false;
    if (answers.incomeSources.includes('capital_gains')) return false;
    if (answers.incomeSources.includes('foreign_income')) return false;
    if (answers.incomeSources.includes('foreign_assets')) return false;
    if (answers.specialCases.includes('director')) return false;
    if (answers.specialCases.includes('unlisted_shares')) return false;
    if (!answers.incomeSources.includes('business') && !answers.incomeSources.includes('freelance')) return false;
    return true;
  },
};

const GuideMeQuestionnaire = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({
    incomeSources: [],
    incomeRange: null,
    residency: null,
    specialCases: [],
  });

  // Calculate recommended ITR
  const recommendedITR = useMemo(() => {
    // Try ITR-1 first (simplest)
    if (ITR_RULES['ITR-1'](answers)) return 'ITR-1';
    if (ITR_RULES['ITR-4'](answers)) return 'ITR-4';
    if (ITR_RULES['ITR-2'](answers)) return 'ITR-2';
    // ITR-3 as fallback (covers everything)
    return 'ITR-3';
  }, [answers]);

  // Get recommendation reasons
  const recommendationReasons = useMemo(() => {
    const reasons = [];
    if (answers.incomeSources.includes('salary')) reasons.push('Salary income');
    if (answers.incomeSources.includes('capital_gains')) reasons.push('Capital gains from mutual funds/shares');
    if (answers.incomeRange === 'above1cr') reasons.push('Income above ₹50 lakh (requires asset disclosure)');
    if (answers.incomeSources.includes('agricultural')) reasons.push('Agricultural income above ₹5,000');
    if (answers.incomeSources.includes('business') || answers.incomeSources.includes('freelance')) {
      reasons.push('Business or professional income');
    }
    return reasons;
  }, [answers]);

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // Step 5 is result, call onComplete
      onComplete(recommendedITR, answers);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const toggleIncomeSource = (sourceId) => {
    setAnswers((prev) => ({
      ...prev,
      incomeSources: prev.incomeSources.includes(sourceId)
        ? prev.incomeSources.filter((id) => id !== sourceId)
        : [...prev.incomeSources, sourceId],
    }));
  };

  const toggleSpecialCase = (caseId) => {
    setAnswers((prev) => ({
      ...prev,
      specialCases:
        caseId === 'none'
          ? ['none']
          : prev.specialCases.includes(caseId)
            ? prev.specialCases.filter((id) => id !== caseId && id !== 'none')
            : prev.specialCases.includes('none')
              ? [caseId]
              : [...prev.specialCases.filter((id) => id !== 'none'), caseId],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
    case 1:
      return answers.incomeSources.length > 0;
    case 2:
      return answers.incomeRange !== null;
    case 3:
      return answers.residency !== null;
    case 4:
      return answers.specialCases.length > 0;
    default:
      return true;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-heading-lg font-semibold text-slate-900">
            {currentStep === 1 && 'What are your sources of income?'}
            {currentStep === 2 && 'What is your total income (approx) for this year?'}
            {currentStep === 3 && 'Are you a Resident of India for tax purposes?'}
            {currentStep === 4 && 'Any of these apply to you?'}
            {currentStep === 5 && 'Based on your answers, you should file:'}
          </h2>
          <span className="text-sm font-medium text-slate-500">Step {currentStep} of 5</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <motion.div
            className="bg-primary-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / 5) * 100}%` }}
            transition={springs.smooth}
          />
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={springs.gentle}
            className="space-y-4"
          >
            <p className="text-body-md text-slate-600 mb-6">
              Select all that apply
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {INCOME_SOURCES_STEP1.map((source) => {
                const Icon = source.icon;
                const isSelected = answers.incomeSources.includes(source.id);
                return (
                  <button
                    key={source.id}
                    onClick={() => toggleIncomeSource(source.id)}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all text-left',
                      isSelected
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br',
                        source.color,
                      )}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-900">{source.label}</div>
                        {source.note && (
                          <div className="text-xs text-slate-500 mt-0.5">{source.note}</div>
                        )}
                      </div>
                      {isSelected && <CheckCircle className="w-5 h-5 text-primary-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={springs.gentle}
            className="space-y-4"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  {answers.incomeSources.map((id) => {
                    const source = INCOME_SOURCES_STEP1.find((s) => s.id === id);
                    return source?.label;
                  }).filter(Boolean).join(', ')} selected
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {INCOME_RANGES.map((range) => {
                const isSelected = answers.incomeRange === range.id;
                return (
                  <button
                    key={range.id}
                    onClick={() => setAnswers((prev) => ({ ...prev, incomeRange: range.id }))}
                    className={cn(
                      'p-6 rounded-xl border-2 transition-all text-center',
                      isSelected
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300',
                    )}
                  >
                    <div className="text-lg font-semibold text-slate-900">{range.label}</div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-primary-500 mx-auto mt-3" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={springs.gentle}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RESIDENCY_OPTIONS.map((option) => {
                const isSelected = answers.residency === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setAnswers((prev) => ({ ...prev, residency: option.id }))}
                    className={cn(
                      'p-6 rounded-xl border-2 transition-all text-left',
                      isSelected
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold text-slate-900">{option.label}</div>
                        {option.description && (
                          <div className="text-sm text-slate-500 mt-1">{option.description}</div>
                        )}
                      </div>
                      {isSelected && <CheckCircle className="w-5 h-5 text-primary-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {answers.residency === 'nri' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  NRIs must file ITR-2 or above (ITR-1 not allowed)
                </p>
              </div>
            )}
          </motion.div>
        )}

        {currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={springs.gentle}
            className="space-y-3"
          >
            {SPECIAL_CASES.map((specialCase) => {
              const isSelected = answers.specialCases.includes(specialCase.id);
              return (
                <button
                  key={specialCase.id}
                  onClick={() => toggleSpecialCase(specialCase.id)}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between',
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 bg-white hover:border-slate-300',
                  )}
                >
                  <span className="text-body-md text-slate-900">{specialCase.label}</span>
                  {isSelected && <CheckCircle className="w-5 h-5 text-primary-500" />}
                </button>
              );
            })}
          </motion.div>
        )}

        {currentStep === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={springs.gentle}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-primary-50 to-amber-50 rounded-2xl border-2 border-primary-200 p-8 text-center">
              <div className="text-6xl font-bold text-primary-600 mb-4">{recommendedITR}</div>
              <p className="text-body-lg text-slate-700 mb-6">Because you have:</p>
              <ul className="space-y-2 text-left max-w-md mx-auto">
                {recommendationReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-body-md text-slate-700">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            {answers.incomeRange === 'above1cr' && (
              <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning-800">
                    Important: Since income &gt; ₹50 lakh, you must also report assets and liabilities in Schedule AL.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 justify-center">
              <button
                onClick={() => onComplete(recommendedITR, answers)}
                className="px-8 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25"
              >
                Proceed with {recommendedITR}
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </button>
              <button
                onClick={handleBack}
                className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium"
              >
                I want a different form
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      {currentStep < 5 && (
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 1 ? 'Back' : 'Previous'}
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={cn(
              'flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all',
              canProceed()
                ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/25'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed',
            )}
          >
            {currentStep === 4 ? 'See Recommendation' : 'Continue'}
            {currentStep < 4 && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      )}
    </div>
  );
};

export default GuideMeQuestionnaire;

