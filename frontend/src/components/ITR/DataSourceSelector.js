// =====================================================
// DATA SOURCE SELECTOR COMPONENT
// Matches UX.md SCREEN 1 specification
// =====================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Download,
  FileText,
  Compass,
  Copy,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { springs } from '../../lib/motion';
import Form16Uploader from './Form16Uploader';
import GuideMeQuestionnaire from './GuideMeQuestionnaire';
import ITRSelectionCards from './ITRSelectionCards';
import { useDataPrefetch } from '../../hooks/useDataPrefetch';
import itrService from '../../services/api/itrService';
import { useAuth } from '../../contexts/AuthContext';

const DataSourceSelector = ({ onProceed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const selectedPerson = location.state?.selectedPerson;

  // Get current assessment year (memoized to prevent duplicate requests)
  const assessmentYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    return `${nextYear}-${(nextYear + 1).toString().slice(-2)}`;
  }, []);

  // State management
  const [currentView, setCurrentView] = useState(null); // null | 'form16' | 'ais-portal' | 'expert' | 'guided'
  const [form16Summary, setForm16Summary] = useState(null);
  const [previousYearFiling, setPreviousYearFiling] = useState(null);
  const [existingFiling, setExistingFiling] = useState(null);
  const [selectedITR, setSelectedITR] = useState(null);
  const [loadingPreviousYear, setLoadingPreviousYear] = useState(false);
  const [loadingExistingFiling, setLoadingExistingFiling] = useState(false);

  // Refs to prevent duplicate requests (React StrictMode causes double renders in dev)
  const previousYearRequestedRef = useRef(false);
  const existingFilingRequestedRef = useRef(false);

  // AIS/26AS prefetch hook
  const panNumber = selectedPerson?.panNumber || user?.panNumber;
  const userId = selectedPerson?.id || user?.id;
  const {
    prefetchStatus,
    prefetchedData,
    itrRecommendation,
    fetchAll,
    isLoading: isPrefetching,
  } = useDataPrefetch(userId, panNumber, assessmentYear);

  // Route guard
  useEffect(() => {
    if (!selectedPerson) {
      navigate('/itr/select-person');
    }
  }, [selectedPerson, navigate]);

  // Fetch previous year filing (optional feature - fail silently)
  useEffect(() => {
    const fetchPreviousYear = async () => {
      if (!selectedPerson?.id) return;

      // Prevent duplicate requests (React StrictMode causes double renders in dev)
      if (previousYearRequestedRef.current) return;
      previousYearRequestedRef.current = true;

      setLoadingPreviousYear(true);
      try {
        const result = await itrService.getAvailablePreviousYears(
          selectedPerson.id,
          assessmentYear,
        );
        // Backend returns { success: true, previousYears: [...], count: number }
        // Service now returns { success: false, previousYears: [], count: 0 } on error
        if (result?.success && result?.previousYears && result.previousYears.length > 0) {
          setPreviousYearFiling(result.previousYears[0]);
        }
      } catch (error) {
        // This should rarely happen now since service handles errors gracefully
        // But keep this as a safety net
        // Silently fail - no previous year filing is normal for new users
      } finally {
        setLoadingPreviousYear(false);
      }
    };

    fetchPreviousYear();
  }, [selectedPerson?.id, assessmentYear]);

  // Check for existing filing (revised return) - optional feature, fail silently
  useEffect(() => {
    const checkExisting = async () => {
      if (!selectedPerson?.id) return;

      // Prevent duplicate requests (React StrictMode causes double renders in dev)
      if (existingFilingRequestedRef.current) return;
      existingFilingRequestedRef.current = true;

      setLoadingExistingFiling(true);
      try {
        const filing = await itrService.checkExistingFiling(selectedPerson.id, assessmentYear);
        if (filing) {
          setExistingFiling(filing);
        }
      } catch (error) {
        // Silently fail - no existing filing is normal for first-time filers
      } finally {
        setLoadingExistingFiling(false);
      }
    };

    checkExisting();
  }, [selectedPerson?.id, assessmentYear]);

  // Handlers
  const handleForm16Complete = (summary) => {
    setForm16Summary(summary);
  };

  const handleAISFetch = async () => {
    setCurrentView('ais-portal');
    try {
      await fetchAll();
      toast.success('Data fetched successfully!');
    } catch (error) {
      toast.error('Failed to fetch data. Please try again.');
    }
  };

  const handleContinueFromLastYear = () => {
    if (!previousYearFiling) return;

    navigate('/itr/computation', {
      state: {
        selectedPerson,
        dataSource: 'previous-year',
        copyFilingId: previousYearFiling.id,
        selectedITR: previousYearFiling.itrType || previousYearFiling.itrForm,
        assessmentYear,
      },
    });
  };

  const handleStartRevised = () => {
    if (!existingFiling) return;

    navigate('/itr/computation', {
      state: {
        selectedPerson,
        dataSource: 'revised-return',
        originalFilingId: existingFiling.id,
        selectedITR: existingFiling.itrType || existingFiling.itrForm,
        assessmentYear,
      },
    });
  };

  const handleProceed = (itrType, data = {}) => {
    const navigationState = {
      selectedPerson,
      selectedITR: itrType,
      assessmentYear,
      ...data,
    };

    if (currentView === 'form16' && form16Summary) {
      navigationState.dataSource = 'form16';
      navigationState.form16Data = form16Summary;
    } else if (currentView === 'ais-portal' && prefetchedData) {
      navigationState.dataSource = 'it-portal';
      navigationState.prefetchedData = prefetchedData;
    } else if (currentView === 'expert') {
      navigationState.dataSource = 'direct-selection';
    } else if (currentView === 'guided') {
      navigationState.dataSource = 'guided-selection';
    }

    navigate('/itr/computation', { state: navigationState });

    if (onProceed) {
      onProceed(itrType, navigationState);
    }
  };

  // Main screen render
  if (currentView === null) {
    return (
      <div className="bg-neutral-50 -mx-3 sm:-mx-4 lg:-mx-6 xl:-mx-8 -my-3 sm:-my-4 lg:-my-5">
        {/* Header with Back Navigation */}
        <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/itr/select-person')}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5 text-neutral-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">Select Data Source</h1>
                <p className="text-xs text-neutral-500">Choose how to start your ITR filing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Header Section - Very Compact */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.gentle}
            className="mb-3"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-success-500" />
                <div>
                  <span className="text-xs text-neutral-500">PAN</span>
                  <span className="text-xs font-semibold font-mono text-neutral-900 ml-1">
                    {panNumber || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="px-2 py-1 bg-gold-100 rounded text-xs font-semibold text-gold-900">
                AY {assessmentYear}
              </div>
            </div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-lg font-bold text-neutral-900 text-center"
            >
              How would you like to start?
            </motion.h1>
          </motion.div>

          {/* All Options in 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {/* Card 1: UPLOAD FORM 16 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springs.gentle}
              className="bg-white rounded-xl border-2 border-gold-300 shadow-sm p-3 relative overflow-hidden hover:border-gold-400 hover:shadow-md transition-all flex flex-col"
            >
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gold-100 text-gold-900">
                  RECOMMENDED
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center flex-shrink-0">
                  <Upload className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-0.5">
                    UPLOAD FORM 16
                  </h3>
                  <p className="text-[10px] text-neutral-600 leading-tight">
                    Auto-fill salary, TDS, and suggest ITR form
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCurrentView('form16')}
                className="w-full py-2 px-3 border-2 border-dashed border-neutral-300 rounded-lg hover:border-gold-400 hover:bg-gold-100/50 transition-all text-center mt-auto"
              >
                <p className="text-xs font-medium text-neutral-700">
                  Drop files or click to upload
                </p>
              </button>
            </motion.div>

            {/* Card 2: FETCH AIS/26AS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.gentle, delay: 0.1 }}
              className="bg-white rounded-xl border-2 border-neutral-200 shadow-sm p-3 hover:border-gold-300 hover:shadow-md transition-all flex flex-col"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-0.5">
                    FETCH AIS/26AS
                  </h3>
                  <p className="text-[10px] text-neutral-600 leading-tight">
                    Auto-import from Income Tax Portal
                  </p>
                </div>
              </div>
              <button
                onClick={handleAISFetch}
                className="w-full py-2 px-3 bg-gold-500 text-white rounded-lg font-semibold hover:bg-gold-600 transition-all shadow-lg shadow-gold-500/20 text-xs mt-auto"
              >
                Fetch Now
              </button>
            </motion.div>

            {/* Card 3: I KNOW MY ITR */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.gentle, delay: 0.2 }}
              className="bg-white rounded-xl border-2 border-neutral-200 shadow-sm p-3 hover:border-gold-300 hover:shadow-md transition-all flex flex-col"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-0.5">
                    I KNOW MY ITR
                  </h3>
                  <p className="text-[10px] text-neutral-600 leading-tight">
                    Directly select ITR-1, 2, 3, or 4
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('expert')}
                className="w-full py-2 px-3 bg-gold-500 text-white rounded-lg font-semibold hover:bg-gold-600 transition-all shadow-lg shadow-gold-500/20 text-xs mt-auto"
              >
                Select
              </button>
            </motion.div>

            {/* Card 4: GUIDE ME */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.gentle, delay: 0.3 }}
              className="bg-white rounded-xl border-2 border-neutral-200 shadow-sm p-3 hover:border-gold-300 hover:shadow-md transition-all flex flex-col"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                  <Compass className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-0.5">
                    GUIDE ME
                  </h3>
                  <p className="text-[10px] text-neutral-600 leading-tight">
                    Answer 5 questions to find your form
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('guided')}
                className="w-full py-2 px-3 bg-gold-500 text-white rounded-lg font-semibold hover:bg-gold-600 transition-all shadow-lg shadow-gold-500/20 text-xs mt-auto"
              >
                Start
              </button>
            </motion.div>
          </div>

          {/* Continue from Last Year & Revised Return - Compact Row */}
          {(previousYearFiling || existingFiling) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {previousYearFiling && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springs.gentle}
                >
                  <div className="bg-white rounded-xl border-2 border-neutral-200 shadow-sm p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Copy className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="text-xs font-semibold text-neutral-900">
                        Continue from Last Year
                      </h3>
                    </div>
                    <p className="text-[10px] text-neutral-600 mb-2">
                      {previousYearFiling.itrType || previousYearFiling.itrForm || 'ITR'} AY{' '}
                      {previousYearFiling.assessmentYear || '2024-25'}
                    </p>
                    <button
                      onClick={handleContinueFromLastYear}
                      className="w-full px-3 py-1.5 bg-gold-500 text-white rounded-lg font-semibold hover:bg-gold-600 transition-all shadow-lg shadow-gold-500/20 text-xs"
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {existingFiling && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springs.gentle}
                >
                  <div className="bg-white rounded-xl border-2 border-neutral-200 shadow-sm p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-500 to-gold-600 flex items-center justify-center flex-shrink-0">
                        <RefreshCw className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="text-xs font-semibold text-neutral-900">
                        Revised Return
                      </h3>
                    </div>
                    <p className="text-[10px] text-neutral-600 mb-2">
                      {existingFiling.itrType || existingFiling.itrForm || 'ITR'} for {assessmentYear}
                    </p>
                    <button
                      onClick={handleStartRevised}
                      className="w-full px-3 py-1.5 bg-gold-500 text-white rounded-lg font-semibold hover:bg-gold-600 transition-all shadow-lg shadow-gold-500/20 text-xs"
                    >
                      Start Revised
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Form 16 Upload View
  if (currentView === 'form16') {
    return (
      <div className="bg-neutral-50 flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
        {/* Header with Back Navigation */}
        <header className="bg-white border-b border-neutral-200 z-50 flex-shrink-0">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-4">
            <button
              onClick={() => {
                setCurrentView(null);
                setForm16Summary(null);
              }}
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>
        </header>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto py-6">

          <Form16Uploader
            onSummaryUpdate={handleForm16Complete}
            onComplete={(summary) => {
              if (summary?.suggestedITR) {
                handleProceed(summary.suggestedITR, { form16Summary: summary });
              }
            }}
          />

          {form16Summary && form16Summary.fileCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <button
                onClick={() => handleProceed(form16Summary.suggestedITR, { form16Summary })}
                className="w-full py-4 px-6 bg-gold-500 text-white rounded-lg font-semibold text-heading-md hover:bg-gold-700 transition-all shadow-lg shadow-gold-500/25 flex items-center justify-center gap-2"
              >
                Proceed to Computation Sheet
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // AIS/26AS Portal View
  if (currentView === 'ais-portal') {
    return (
      <div className="bg-neutral-50 flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
        {/* Header with Back Navigation */}
        <header className="bg-white border-b border-neutral-200 z-50 flex-shrink-0">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-4">
            <button
              onClick={() => setCurrentView(null)}
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>
        </header>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto py-6">

          <div className="bg-white rounded-xl border-2 border-neutral-200 shadow-sm p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                Fetching AIS/26AS Data
              </h2>
              <p className="text-sm text-neutral-600">
                Connecting to Income Tax Portal and fetching your data...
              </p>
            </div>

            {isPrefetching ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-gold-100 border-t-gold-500 rounded-full animate-spin" />
                <p className="text-body-md text-slate-600">Please wait...</p>
              </div>
            ) : prefetchStatus.overall === 'success' && itrRecommendation ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="bg-gradient-to-br from-gold-100 to-amber-50 rounded-xl border-2 border-gold-300 p-4 text-center">
                  <div className="text-3xl font-bold text-gold-700 mb-2">{itrRecommendation}</div>
                  <p className="text-sm text-neutral-700">
                    Based on your AIS/26AS data, we recommend filing {itrRecommendation}
                  </p>
                </div>

                <button
                  onClick={() => handleProceed(itrRecommendation)}
                  className="w-full py-3 px-6 bg-gold-500 text-white rounded-lg font-semibold hover:bg-gold-600 transition-all shadow-lg shadow-gold-500/20 flex items-center justify-center gap-2"
                >
                  Proceed with {itrRecommendation}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            ) : prefetchStatus.overall === 'error' ? (
              <div className="text-center">
                <p className="text-sm text-error-500 mb-4">
                  Failed to fetch data. Please try again.
                </p>
                <button
                  onClick={handleAISFetch}
                  className="px-6 py-3 bg-gold-500 text-white rounded-lg font-semibold hover:bg-gold-600 transition-all"
                >
                  Retry
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Expert Mode: ITR Selection Cards
  if (currentView === 'expert') {
    return (
      <div className="bg-neutral-50 flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
        {/* Header with Back Navigation */}
        <header className="bg-white border-b border-neutral-200 z-50 flex-shrink-0">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-3">
            <button
              onClick={() => {
                setCurrentView(null);
                setSelectedITR(null);
              }}
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>
        </header>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex-1 overflow-hidden py-4 flex flex-col">

          <div className="mb-4 flex-shrink-0">
            <h1 className="text-xl font-bold text-neutral-900 mb-1">
              Select Your ITR Form
            </h1>
            <p className="text-xs text-neutral-600">
              Choose the ITR form that matches your income sources
            </p>
          </div>

          <div className="flex-1 overflow-hidden">
            <ITRSelectionCards
              selectedITR={selectedITR}
              onSelect={(itrType) => {
                setSelectedITR(itrType);
                handleProceed(itrType);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Guided Mode: Questionnaire
  if (currentView === 'guided') {
    return (
      <div className="bg-neutral-50 flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
        {/* Header with Back Navigation */}
        <header className="bg-white border-b border-neutral-200 z-50 flex-shrink-0">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-4">
            <button
              onClick={() => setCurrentView(null)}
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>
        </header>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto py-6">

          <GuideMeQuestionnaire
            onComplete={(recommendedITR, answers) => {
              handleProceed(recommendedITR, { guidedAnswers: answers });
            }}
          />
        </div>
      </div>
    );
  }

  return null;
};

export default DataSourceSelector;
