// =====================================================
// ITR FORM SELECTION PAGE
// Smart questionnaire + ITR type recommendation
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  FileText,
  TrendingUp,
  Building2,
  Calculator,
  Loader,
  Shield,
  Briefcase,
  Home,
  Globe,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import ITRAutoDetector from '../../services/ITRAutoDetector';
import toast from 'react-hot-toast';

// Smart questionnaire questions
const QUESTIONNAIRE = [
  {
    id: 'salary',
    question: 'Do you have salary or pension income?',
    description: 'Income from employment, including salary, allowances, perquisites, or pension',
    icon: Briefcase,
    options: [
      { value: true, label: 'Yes', sublabel: 'I receive salary/pension' },
      { value: false, label: 'No', sublabel: 'No salary income' },
    ],
  },
  {
    id: 'capitalGains',
    question: 'Did you sell any investments this year?',
    description: 'Shares, mutual funds, property, or other capital assets',
    icon: TrendingUp,
    options: [
      { value: 'none', label: 'No', sublabel: 'No sales' },
      { value: 'equity', label: 'Shares/MF only', sublabel: 'Stocks, mutual funds' },
      { value: 'property', label: 'Property', sublabel: 'Real estate sale' },
      { value: 'both', label: 'Both', sublabel: 'Investments + Property' },
    ],
  },
  {
    id: 'businessIncome',
    question: 'Do you have business or freelance income?',
    description: 'Self-employment, consulting, freelancing, or running a business',
    icon: Building2,
    options: [
      { value: 'none', label: 'No', sublabel: 'No business income' },
      { value: 'presumptive', label: 'Small business', sublabel: 'Turnover < ₹2 Cr (44AD/44ADA)' },
      { value: 'regular', label: 'Regular business', sublabel: 'With books of accounts' },
    ],
  },
  {
    id: 'houseProperty',
    question: 'How many house properties do you own?',
    description: 'Self-occupied or let-out residential/commercial properties',
    icon: Home,
    options: [
      { value: 0, label: 'None', sublabel: 'No property' },
      { value: 1, label: 'One', sublabel: 'Single property' },
      { value: 2, label: 'Multiple', sublabel: '2 or more properties' },
    ],
  },
  {
    id: 'foreignIncome',
    question: 'Do you have any foreign income or assets?',
    description: 'Income from abroad, foreign investments, or NRI status',
    icon: Globe,
    options: [
      { value: false, label: 'No', sublabel: 'All income in India' },
      { value: true, label: 'Yes', sublabel: 'Foreign income/assets' },
    ],
  },
];

const ITRFormSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State from previous step
  const selectedPerson = location.state?.selectedPerson;
  const dataSource = location.state?.dataSource;
  const verificationResult = location.state?.verificationResult;

  // Component state
  const [currentStep, setCurrentStep] = useState(0); // 0 = questionnaire intro, 1-5 = questions, 6 = results
  const [answers, setAnswers] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [selectedITR, setSelectedITR] = useState(null);
  const [showAllForms, setShowAllForms] = useState(false);

  const autoDetector = new ITRAutoDetector();
  const itrDescriptions = autoDetector.getITRDescriptions();

  // Route guard
  useEffect(() => {
    if (!selectedPerson) {
      toast.error('Please select a person to file for');
      navigate('/itr/select-person');
    }
  }, [selectedPerson, navigate]);

  // Analyze answers and get recommendation
  const analyzeAndRecommend = useCallback(() => {
    setIsAnalyzing(true);

    // Build analysis data from questionnaire answers
    const analysisData = {
      salary: answers.salary === true ? 500000 : 0, // Nominal value to trigger rule
      interestIncome: 0,
      businessIncome: answers.businessIncome === 'regular' ? 100000 : 0,
      professionalIncome: answers.businessIncome === 'presumptive' ? 50000 : 0,
      capitalGains: ['equity', 'property', 'both'].includes(answers.capitalGains) ? 100000 : 0,
      houseProperties: Array(answers.houseProperty || 0).fill({}),
      foreignIncome: answers.foreignIncome ? 100000 : 0,
      agriculturalIncome: 0,
      isNRI: false,
      isDirector: false,
      isPartner: false,
      dtaaClaim: answers.foreignIncome,
    };

    // Simulate analysis delay for UX
    setTimeout(() => {
      const result = autoDetector.detectITR(analysisData);
      setRecommendation(result);
      setSelectedITR(result.recommendedITR);
      setIsAnalyzing(false);
      setCurrentStep(QUESTIONNAIRE.length + 1); // Move to results
    }, 1500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  // Handle answer selection
  const handleAnswer = useCallback((questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));

    // Auto-advance to next question
    if (currentStep < QUESTIONNAIRE.length) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 300);
    }
  }, [currentStep]);

  // Handle questionnaire completion
  useEffect(() => {
    if (currentStep === QUESTIONNAIRE.length && Object.keys(answers).length === QUESTIONNAIRE.length) {
      analyzeAndRecommend();
    }
  }, [currentStep, answers, analyzeAndRecommend]);

  // Skip questionnaire and show all forms
  const handleSkipQuestionnaire = useCallback(() => {
    setShowAllForms(true);
    setCurrentStep(QUESTIONNAIRE.length + 1);
    // Default recommendation without questionnaire
    setRecommendation({
      recommendedITR: 'ITR-1',
      confidence: 0.5,
      reason: 'Select the ITR form that matches your income sources',
      triggeredRules: [],
      allEligibleITRs: ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'],
    });
    setSelectedITR('ITR-1');
  }, []);

  // Proceed to computation
  const handleProceed = useCallback(() => {
    if (!selectedITR) {
      toast.error('Please select an ITR form');
      return;
    }

    // Get additional state from location
    const showDocumentUpload = location.state?.showDocumentUpload;
    const showITPortalConnect = location.state?.showITPortalConnect;
    const eriLoginRequired = location.state?.eriLoginRequired;

    navigate('/itr/computation', {
      state: {
        selectedPerson,
        verificationResult,
        selectedITR,
        recommendation,
        dataSource,
        fromFormSelection: true,
        // Pass through data source specific flags
        showDocumentUpload,
        showITPortalConnect,
        eriLoginRequired,
      },
    });
  }, [selectedITR, location.state, navigate, selectedPerson, verificationResult, recommendation, dataSource]);

  // Get ITR icon and colors
  const getITRIcon = (itrType) => {
    const icons = {
      'ITR-1': FileText,
      'ITR-2': TrendingUp,
      'ITR-3': Building2,
      'ITR-4': Calculator,
    };
    return icons[itrType] || FileText;
  };

  const getITRColors = (itrType) => {
    const colors = {
      'ITR-1': { bg: 'bg-success-500', light: 'bg-success-50', border: 'border-success-500', text: 'text-success-700' },
      'ITR-2': { bg: 'bg-info-500', light: 'bg-info-50', border: 'border-info-500', text: 'text-info-700' },
      'ITR-3': { bg: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700' },
      'ITR-4': { bg: 'bg-gold-500', light: 'bg-gold-50', border: 'border-gold-500', text: 'text-gold-700' },
    };
    return colors[itrType] || colors['ITR-1'];
  };

  // Navigation handlers
  const handleStartQuestionnaire = useCallback(() => setCurrentStep(1), []);
  const handleBack = useCallback(() => setCurrentStep(prev => Math.max(0, prev - 1)), []);
  const handleNext = useCallback(() => setCurrentStep(prev => prev + 1), []);
  const handleToggleAllForms = useCallback(() => setShowAllForms(prev => !prev), []);
  const handleSelectITR = useCallback((itrType) => setSelectedITR(itrType), []);
  const handleNavigateBack = useCallback(() => navigate('/itr/data-source', { state: { selectedPerson } }), [navigate, selectedPerson]);

  // Render questionnaire intro
  const renderIntro = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-6"
    >
      <div className="w-20 h-20 bg-aurora-gradient rounded-2xl flex items-center justify-center mx-auto shadow-elevation-3">
        <Sparkles className="w-10 h-10 text-white" />
      </div>

      <div>
        <h2 className="text-heading-2 font-bold text-slate-900 mb-2">
          Let's find the right ITR form
        </h2>
        <p className="text-slate-600 max-w-md mx-auto">
          Answer a few quick questions about your income sources, and we'll recommend the best ITR form for you.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <button
          onClick={handleStartQuestionnaire}
          className="flex items-center justify-center px-6 py-3 bg-gold-500 text-white font-semibold rounded-xl hover:bg-gold-600 transition-colors shadow-elevation-3 shadow-gold-500/20"
        >
          <span>Start Questionnaire</span>
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>

        <button
          onClick={handleSkipQuestionnaire}
          className="flex items-center justify-center px-6 py-3 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition-colors"
        >
          <span>I know my ITR form</span>
        </button>
      </div>
    </motion.div>
  );

  // Render questionnaire question
  const renderQuestion = (questionIndex) => {
    const question = QUESTIONNAIRE[questionIndex];
    const Icon = question.icon;
    const currentAnswer = answers[question.id];

    return (
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="space-y-6"
      >
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-body-regular font-medium text-slate-500">
            Question {questionIndex + 1} of {QUESTIONNAIRE.length}
          </span>
          <div className="flex gap-1">
            {QUESTIONNAIRE.map((q, i) => (
              <div
                key={q.id}
                className={`w-8 h-1.5 rounded-full transition-colors ${
                  i < questionIndex ? 'bg-gold-500' :
                  i === questionIndex ? 'bg-gold-400' : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-gold-600" />
          </div>
          <div>
            <h3 className="text-heading-3 font-semibold text-neutral-900 mb-1">
              {question.question}
            </h3>
            <p className="text-body-regular text-neutral-600">
              {question.description}
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="grid gap-3 pt-4">
          {question.options.map((option) => {
            const isSelected = currentAnswer === option.value;
            return (
              <button
                key={String(option.value)}
                onClick={() => handleAnswer(question.id, option.value)}
                className={`
                  flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left
                  ${isSelected
                    ? 'border-gold-500 bg-gold-50 shadow-elevation-2'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-elevation-1'
                  }
                `}
              >
                <div>
                  <span className={`font-medium ${isSelected ? 'text-gold-700' : 'text-neutral-900'}`}>
                    {option.label}
                  </span>
                  <p className={`text-sm ${isSelected ? 'text-gold-600' : 'text-neutral-500'}`}>
                    {option.sublabel}
                  </p>
                </div>
                {isSelected && (
                  <CheckCircle className="w-5 h-5 text-gold-500 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button
            onClick={handleBack}
            className="flex items-center px-4 py-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>

          {currentAnswer !== undefined && (
            <button
              onClick={handleNext}
              className="flex items-center px-4 py-2 text-gold-600 font-medium hover:text-gold-700 transition-colors"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  // Render analyzing state
  const renderAnalyzing = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-12"
    >
      <div className="w-16 h-16 bg-gold-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Loader className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
      <h3 className="text-heading-3 font-semibold text-neutral-900 mb-2">
        Analyzing your profile...
      </h3>
      <p className="text-body-regular text-neutral-600">
        Finding the best ITR form based on your income sources
      </p>
    </motion.div>
  );

  // Render results
  const renderResults = () => {
    const recommendedColors = getITRColors(recommendation?.recommendedITR);
    const RecommendedIcon = getITRIcon(recommendation?.recommendedITR);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Recommendation banner */}
        {recommendation && !showAllForms && (
          <div className={`${recommendedColors.light} rounded-2xl p-5 border ${recommendedColors.border}`}>
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 ${recommendedColors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <RecommendedIcon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`text-lg font-bold ${recommendedColors.text}`}>
                    Recommended: {recommendation.recommendedITR}
                  </h3>
                  <span className={`text-xs ${recommendedColors.bg} text-white px-2 py-0.5 rounded-full`}>
                    {Math.round(recommendation.confidence * 100)}% match
                  </span>
                </div>
                <p className="text-slate-600 text-body-regular mb-3">
                  {recommendation.reason}
                </p>
                {recommendation.triggeredRules?.[0]?.caReviewRequired && (
                  <div className="flex items-center gap-1 text-amber-600 text-body-small">
                    <Shield className="w-3.5 h-3.5" />
                    <span>CA review recommended for this form</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ITR Form Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-heading-4 font-semibold text-slate-900">
              {showAllForms ? 'Select ITR Form' : 'All ITR Forms'}
            </h2>
            <button
              onClick={handleToggleAllForms}
              className="text-body-regular text-gold-600 hover:text-gold-700 font-medium"
            >
              {showAllForms ? 'Show recommendation' : 'Show all forms'}
            </button>
          </div>

          <div className="grid gap-3">
            {['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'].map((itrType) => {
              const Icon = getITRIcon(itrType);
              const colors = getITRColors(itrType);
              const description = itrDescriptions[itrType];
              const isSelected = selectedITR === itrType;
              const isRecommended = recommendation?.recommendedITR === itrType;

              return (
                <button
                  key={itrType}
                  onClick={() => handleSelectITR(itrType)}
                  className={`
                    flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left
                    ${isSelected
                      ? `${colors.border} ${colors.light} shadow-elevation-2`
                      : 'border-slate-200 bg-white hover:border-slate-300'
                    }
                  `}
                >
                  <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-neutral-900">{description.name}</h3>
                      {isRecommended && !showAllForms && (
                        <span className="text-body-small bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-body-regular text-slate-600 mb-2 line-clamp-2">
                      {description.description}
                    </p>
                    <div className="flex items-center gap-4 text-body-small text-slate-500">
                      <span>⏱ {description.estimatedTime}</span>
                      {description.caRequired && (
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          CA Required
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <CheckCircle className={`w-6 h-6 ${colors.text} flex-shrink-0`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Help text */}
        <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl">
          <HelpCircle className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
          <div className="text-body-regular text-neutral-600">
            <p className="font-medium text-neutral-700 mb-1">Not sure which form to choose?</p>
            <p>
              ITR-1 is for simple salaried individuals. ITR-2 adds capital gains and multiple properties.
              ITR-3/4 are for business income. When in doubt, start with ITR-1 - we'll prompt you to switch if needed.
            </p>
          </div>
        </div>

        {/* Proceed button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleProceed}
            disabled={!selectedITR}
            className={`
              flex items-center px-6 py-3 rounded-xl font-semibold transition-all
              ${selectedITR
                ? 'bg-gold-500 text-white hover:bg-gold-600 shadow-elevation-3 shadow-gold-500/20'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }
            `}
          >
            <span>Continue with {selectedITR || '...'}</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-elevation-1 border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleNavigateBack}
                className="p-2 rounded-xl hover:bg-neutral-100 active:scale-95 transition-all"
              >
                <ArrowLeft className="h-5 w-5 text-neutral-700" />
              </button>
              <div>
                <h1 className="text-heading-3 font-semibold text-neutral-900">ITR Form Selection</h1>
                <p className="text-body-small text-neutral-500">Choose the right ITR form for your filing</p>
              </div>
            </div>

            {selectedPerson && (
              <div className="hidden sm:flex items-center gap-2 text-body-regular text-neutral-600">
                <span>{selectedPerson.name}</span>
                <span className="text-neutral-300">|</span>
                <span className="font-mono">{selectedPerson.panNumber}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">
        <div className="bg-white rounded-2xl shadow-elevation-1 border border-neutral-200 p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {currentStep === 0 && renderIntro()}
            {currentStep > 0 && currentStep <= QUESTIONNAIRE.length && !isAnalyzing && (
              renderQuestion(currentStep - 1)
            )}
            {isAnalyzing && renderAnalyzing()}
            {currentStep > QUESTIONNAIRE.length && !isAnalyzing && renderResults()}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default ITRFormSelection;
