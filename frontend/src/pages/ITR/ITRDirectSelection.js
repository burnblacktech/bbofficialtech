// =====================================================
// ITR DIRECT SELECTION PAGE
// Expert mode - Direct selection of ITR type (1-4)
// =====================================================

import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Building2,
  Calculator,
  Sparkles,
  Users,
  TrendingUp,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { springs } from '../../lib/motion';

// ITR Type definitions with detailed eligibility
const ITR_TYPES = [
  {
    id: 'ITR-1',
    name: 'ITR-1 (Sahaj)',
    subtitle: 'For Salaried Individuals',
    icon: Briefcase,
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    eligibility: [
      'Resident individual',
      'Total income up to ₹50 lakh',
      'Income from salary/pension',
      'Income from one house property',
      'Other sources (interest, etc.)',
      'Agricultural income up to ₹5,000',
    ],
    notEligible: [
      'Income from more than 1 house property',
      'Capital gains',
      'Business/Professional income',
      'Foreign assets/income',
      'Director in any company',
      'Unlisted equity shares',
    ],
    recommended: true,
    complexity: 'Simple',
    estimatedTime: '15-20 mins',
  },
  {
    id: 'ITR-2',
    name: 'ITR-2',
    subtitle: 'For Individuals with Capital Gains',
    icon: TrendingUp,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    eligibility: [
      'Individual or HUF',
      'No income from business/profession',
      'Income from salary/pension',
      'Multiple house properties',
      'Capital gains (shares, property, etc.)',
      'Foreign assets or income',
      'Director in any company',
      'Agricultural income above ₹5,000',
    ],
    notEligible: [
      'Income from business/profession',
      'Partner in any firm',
    ],
    recommended: false,
    complexity: 'Moderate',
    estimatedTime: '30-45 mins',
  },
  {
    id: 'ITR-3',
    name: 'ITR-3',
    subtitle: 'For Business/Professional Income',
    icon: Building2,
    color: 'from-amber-500 to-gold-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    eligibility: [
      'Individual or HUF',
      'Income from business/profession',
      'Profit & loss account required',
      'All income sources allowed',
      'Partner in a firm',
      'Speculative income',
    ],
    notEligible: [
      'Presumptive income under 44AD/44ADA',
    ],
    recommended: false,
    complexity: 'Complex',
    estimatedTime: '45-60 mins',
  },
  {
    id: 'ITR-4',
    name: 'ITR-4 (Sugam)',
    subtitle: 'For Presumptive Income',
    icon: Calculator,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    eligibility: [
      'Individual, HUF, or Firm (not LLP)',
      'Presumptive income under 44AD',
      'Turnover up to ₹2 crore (business)',
      'Presumptive income under 44ADA',
      'Gross receipts up to ₹50 lakh (profession)',
      'Income from one house property',
    ],
    notEligible: [
      'Income from more than 1 house property',
      'Capital gains',
      'Foreign assets/income',
      'Director in any company',
      'Turnover above ₹2 crore',
      'Books of accounts maintained',
    ],
    recommended: false,
    complexity: 'Moderate',
    estimatedTime: '20-30 mins',
  },
];

const ITRDirectSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedPerson = location.state?.selectedPerson;
  const [selectedITR, setSelectedITR] = useState(null);
  const [showDetails, setShowDetails] = useState(null);

  // Determine eligibility based on previous answers (if available)
  const userProfile = useMemo(() => {
    return location.state?.userProfile || {};
  }, [location.state]);

  const handleSelectITR = (itrId) => {
    setSelectedITR(itrId);
  };

  const handleProceed = () => {
    if (!selectedITR) return;

    navigate('/itr/computation', {
      state: {
        selectedITR,
        selectedPerson,
        userProfile,
        mode: 'expert',
      },
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">Select ITR Form</h1>
              <p className="text-sm text-neutral-500">Choose the appropriate ITR type for your filing</p>
            </div>
          </div>
          {selectedPerson && (
            <div className="hidden md:flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-lg">
              <Users className="w-4 h-4 text-neutral-500" />
              <span className="text-sm text-neutral-700">{selectedPerson.name}</span>
              <span className="text-xs text-neutral-500 bg-neutral-200 px-2 py-0.5 rounded">
                {selectedPerson.panNumber}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">
        {/* Expert Mode Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-gold-50 to-amber-50 rounded-xl border border-gold-200 p-4 mb-8 flex items-start gap-3"
        >
          <Sparkles className="w-5 h-5 text-gold-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gold-800">Expert Mode</p>
            <p className="text-xs text-gold-700 mt-0.5">
              You are directly selecting the ITR form. Make sure you choose the correct form based on your income sources.
              Incorrect form selection may lead to rejection of your return.
            </p>
          </div>
        </motion.div>

        {/* ITR Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ITR_TYPES.map((itr, index) => {
            const Icon = itr.icon;
            const isSelected = selectedITR === itr.id;
            const isExpanded = showDetails === itr.id;

            return (
              <motion.div
                key={itr.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'relative rounded-2xl border-2 overflow-hidden transition-all cursor-pointer',
                  isSelected
                    ? 'border-gold-500 shadow-lg shadow-gold-500/20'
                    : 'border-neutral-200 hover:border-neutral-300 hover:shadow-md',
                )}
                onClick={() => handleSelectITR(itr.id)}
              >
                {/* Recommended Badge */}
                {itr.recommended && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gold-100 text-gold-700">
                      <Sparkles className="w-3 h-3" />
                      Recommended
                    </span>
                  </div>
                )}

                {/* Selection Indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 left-3 z-10"
                  >
                    <div className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </motion.div>
                )}

                {/* Card Header */}
                <div className={cn('p-5', itr.bgColor)}>
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
                      itr.color,
                    )}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-neutral-900">{itr.name}</h3>
                      <p className="text-sm text-neutral-600 mt-0.5">{itr.subtitle}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          itr.complexity === 'Simple' && 'bg-success-100 text-success-700',
                          itr.complexity === 'Moderate' && 'bg-warning-100 text-warning-700',
                          itr.complexity === 'Complex' && 'bg-error-100 text-error-700',
                        )}>
                          {itr.complexity}
                        </span>
                        <span className="text-xs text-neutral-500">
                          ~{itr.estimatedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 bg-white">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetails(isExpanded ? null : itr.id);
                    }}
                    className="text-sm font-medium text-gold-600 hover:text-gold-700 flex items-center gap-1"
                  >
                    {isExpanded ? 'Hide Details' : 'View Eligibility'}
                    <ArrowRight className={cn(
                      'w-4 h-4 transition-transform',
                      isExpanded && 'rotate-90',
                    )} />
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={springs.gentle}
                        className="mt-4 space-y-4"
                      >
                        {/* Eligible For */}
                        <div>
                          <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Eligible For
                          </h4>
                          <ul className="space-y-1">
                            {itr.eligibility.map((item, i) => (
                              <li key={i} className="text-xs text-neutral-600 flex items-start gap-2">
                                <CheckCircle className="w-3 h-3 text-success-500 flex-shrink-0 mt-0.5" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Not Eligible For */}
                        <div>
                          <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Not Eligible For
                          </h4>
                          <ul className="space-y-1">
                            {itr.notEligible.map((item, i) => (
                              <li key={i} className="text-xs text-neutral-600 flex items-start gap-2">
                                <AlertCircle className="w-3 h-3 text-error-400 flex-shrink-0 mt-0.5" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex items-center justify-between"
        >
          <p className="text-sm text-neutral-500">
            {selectedITR
              ? `You've selected ${selectedITR}. Click Continue to proceed.`
              : 'Select an ITR form to continue.'}
          </p>
          <button
            onClick={handleProceed}
            disabled={!selectedITR}
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all',
              selectedITR
                ? 'bg-gold-500 text-white hover:bg-gold-600 shadow-lg shadow-gold-500/25'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed',
            )}
          >
            Continue to Filing
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </main>
    </div>
  );
};

export default ITRDirectSelection;

