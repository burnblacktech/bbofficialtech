// =====================================================
// ITR MODE SELECTION PAGE
// Entry point for ITR filing - Choose Expert, Guided, or Auto mode
// =====================================================

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Compass,
  Zap,
  FileText,
  Users,
  CheckCircle,
  Clock,
  Shield,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { springs } from '../../lib/motion';

// Filing mode options
const FILING_MODES = [
  {
    id: 'expert',
    title: 'Expert Mode',
    subtitle: 'I know my ITR form',
    description: 'Directly select from ITR-1, ITR-2, ITR-3, or ITR-4. Best for tax professionals and experienced filers.',
    icon: FileText,
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-gradient-to-br from-purple-50 to-indigo-50',
    borderColor: 'border-purple-200',
    features: [
      'Direct ITR type selection',
      'Full control over form choice',
      'Eligibility criteria reference',
    ],
    recommended: false,
    route: '/itr/direct-selection',
  },
  {
    id: 'guided',
    title: 'Guided Mode',
    subtitle: 'Help me choose',
    description: 'Tell us your income sources and we\'ll recommend the right ITR form. Perfect for first-time filers.',
    icon: Compass,
    color: 'from-primary-500 to-amber-500',
    bgColor: 'bg-gradient-to-br from-primary-50 to-amber-50',
    borderColor: 'border-primary-200',
    features: [
      'Income source questionnaire',
      'Smart ITR recommendation',
      'Easy step-by-step process',
    ],
    recommended: true,
    route: '/itr/income-sources',
  },
  {
    id: 'auto',
    title: 'Auto Mode',
    subtitle: 'Fetch & auto-detect',
    description: 'We\'ll fetch your 26AS/AIS data and automatically determine the best ITR form based on your actual income.',
    icon: Zap,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-200',
    features: [
      'Auto-fetch 26AS/AIS data',
      'AI-powered ITR detection',
      'Pre-filled form data',
    ],
    recommended: false,
    route: '/itr/data-source',
    requiresLogin: true,
  },
];

const ITRModeSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedPerson = location.state?.selectedPerson;
  const [selectedMode, setSelectedMode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectMode = (mode) => {
    setSelectedMode(mode.id);
  };

  const handleProceed = () => {
    const mode = FILING_MODES.find((m) => m.id === selectedMode);
    if (!mode) return;

    setIsLoading(true);

    // Navigate to the selected mode's route
    navigate(mode.route, {
      state: {
        selectedPerson,
        mode: selectedMode,
      },
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Choose Filing Mode</h1>
              <p className="text-sm text-slate-500">Select how you'd like to proceed</p>
            </div>
          </div>
          {selectedPerson && (
            <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-700">{selectedPerson.name}</span>
              <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                {selectedPerson.panNumber}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Intro Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            AY 2025-26 Filing
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
            How would you like to file your ITR?
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Choose the mode that suits you best. Whether you're an expert or first-timer,
            we've got you covered.
          </p>
        </motion.div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {FILING_MODES.map((mode, index) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;

            return (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                onClick={() => handleSelectMode(mode)}
                className={cn(
                  'relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all',
                  isSelected
                    ? 'border-primary-500 shadow-xl shadow-primary-500/20'
                    : `${mode.borderColor} hover:shadow-lg`,
                )}
              >
                {/* Recommended Badge */}
                {mode.recommended && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-500 text-white">
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
                    transition={springs.bouncy}
                    className="absolute top-3 left-3 z-10"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </motion.div>
                )}

                {/* Card Content */}
                <div className={cn('p-6', mode.bgColor)}>
                  <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br mb-4',
                    mode.color,
                  )}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{mode.title}</h3>
                  <p className="text-sm font-medium text-slate-600 mt-1">{mode.subtitle}</p>
                </div>

                <div className="p-6 bg-white">
                  <p className="text-sm text-slate-600 mb-4">{mode.description}</p>

                  <ul className="space-y-2">
                    {mode.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {mode.requiresLogin && (
                    <p className="mt-4 text-xs text-amber-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Requires IT portal login
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center"
        >
          <button
            onClick={handleProceed}
            disabled={!selectedMode || isLoading}
            className={cn(
              'inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all',
              selectedMode
                ? 'bg-gradient-to-r from-primary-500 to-amber-500 text-white hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.98]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed',
            )}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </motion.div>

        {/* Help Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-slate-500 mt-6"
        >
          Not sure which mode to choose?{' '}
          <button
            onClick={() => setSelectedMode('guided')}
            className="text-primary-600 font-medium hover:underline"
          >
            Start with Guided Mode
          </button>
        </motion.p>
      </main>
    </div>
  );
};

export default ITRModeSelection;

