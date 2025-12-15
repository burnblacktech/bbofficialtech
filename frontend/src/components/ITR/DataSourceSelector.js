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
      <div className="bg-gradient-to-b from-neutral-50 to-white min-h-screen">
        {/* Header with Back Navigation */}
        <div className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/itr/select-person')}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors flex-shrink-0 group"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5 text-neutral-600 group-hover:text-neutral-900 transition-colors" />
              </button>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Select Data Source</h1>
                <p className="text-sm text-neutral-600 mt-0.5">Choose how to start your ITR filing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header Section - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.gentle}
            className="mb-6 sm:mb-8"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6 p-4 bg-white rounded-xl border border-neutral-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <span className="text-xs text-neutral-500 block">PAN Number</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-neutral-900">
                    {panNumber || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-gold-100 to-amber-100 rounded-lg border border-gold-200">
                <span className="text-xs text-gold-700 font-medium block">Assessment Year</span>
                <span className="text-sm font-bold text-gold-900">{assessmentYear}</span>
              </div>
            </div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center mb-2"
            >
              How would you like to start?
            </motion.h1>
            <p className="text-sm sm:text-base text-neutral-600 text-center max-w-2xl mx-auto">
              Choose the method that works best for you. We'll guide you through the rest.
            </p>
          </motion.div>

          {/* All Options in 2x2 Grid - Enhanced */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* Card 1: UPLOAD FORM 16 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springs.gentle}
              className="bg-white rounded-xl border-2 border-gold-300 shadow-md p-5 sm:p-6 relative overflow-hidden hover:border-gold-400 hover:shadow-lg transition-all duration-300 flex flex-col group"
            >
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gold-100 text-gold-900 shadow-sm">
                  RECOMMENDED
                </span>
              </div>

              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-1.5">
                    Upload Form 16
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    Auto-fill salary, TDS, and suggest ITR form. Fastest way to get started.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCurrentView('form16')}
                className="w-full py-3 px-4 border-2 border-dashed border-neutral-300 rounded-lg hover:border-gold-400 hover:bg-gold-50 transition-all text-center mt-auto group-hover:border-gold-500 group-hover:bg-gold-100/50"
              >
                <div className="flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4 text-neutral-600" />
                  <p className="text-sm font-semibold text-neutral-700">
                    Drop files or click to upload
                  </p>
                </div>
              </button>
            </motion.div>

            {/* Card 2: FETCH AIS/26AS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.gentle, delay: 0.1 }}
              className="bg-white rounded-xl border-2 border-neutral-200 shadow-md p-5 sm:p-6 hover:border-primary-300 hover:shadow-lg transition-all duration-300 flex flex-col group"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-aurora-gradient flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-1.5">
                    Fetch AIS/26AS
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    Auto-import from Income Tax Portal. Connect and fetch your tax data automatically.
                  </p>
                </div>
              </div>
              <button
                onClick={handleAISFetch}
                className="w-full py-3 px-4 bg-aurora-gradient text-white rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary-500/20 text-sm mt-auto flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Fetch Now
              </button>
            </motion.div>

            {/* Card 3: I KNOW MY ITR */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.gentle, delay: 0.2 }}
              className="bg-white rounded-xl border-2 border-neutral-200 shadow-md p-5 sm:p-6 hover:border-primary-300 hover:shadow-lg transition-all duration-300 flex flex-col group"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-aurora-gradient flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-1.5">
                    I Know My ITR
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    Directly select ITR-1, 2, 3, or 4. For users familiar with ITR forms.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('expert')}
                className="w-full py-3 px-4 bg-aurora-gradient text-white rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary-500/20 text-sm mt-auto flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Select Form
              </button>
            </motion.div>

            {/* Card 4: GUIDE ME */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.gentle, delay: 0.3 }}
              className="bg-white rounded-xl border-2 border-neutral-200 shadow-md p-5 sm:p-6 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 flex flex-col group"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-aurora-gradient flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                  <Compass className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-1.5">
                    Guide Me
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    Answer 5 simple questions to find your form. Perfect for first-time filers.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('guided')}
                className="w-full py-3 px-4 bg-aurora-gradient text-white rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary-500/20 text-sm mt-auto flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4" />
                Start Guide
              </button>
            </motion.div>
          </div>

          {/* Continue from Last Year & Revised Return - Enhanced */}
          {(previousYearFiling || existingFiling) && (
            <div className="mt-6 sm:mt-8">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4 text-center sm:text-left">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {previousYearFiling && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={springs.gentle}
                  >
                    <div className="bg-white rounded-xl border-2 border-primary-200 shadow-md p-4 sm:p-5 hover:border-primary-300 hover:shadow-lg transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-aurora-gradient flex items-center justify-center flex-shrink-0 shadow-md">
                          <Copy className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm sm:text-base font-bold text-neutral-900">
                            Continue from Last Year
                          </h3>
                          <p className="text-xs text-neutral-600 mt-0.5">
                            {previousYearFiling.itrType || previousYearFiling.itrForm || 'ITR'} AY{' '}
                            {previousYearFiling.assessmentYear || '2024-25'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleContinueFromLastYear}
                        className="w-full py-2.5 px-4 bg-aurora-gradient text-white rounded-lg font-semibold hover:opacity-90 transition-all shadow-md shadow-primary-500/20 text-sm flex items-center justify-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
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
                    <div className="bg-white rounded-xl border-2 border-amber-200 shadow-md p-4 sm:p-5 hover:border-amber-300 hover:shadow-lg transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-gold-600 flex items-center justify-center flex-shrink-0 shadow-md">
                          <RefreshCw className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm sm:text-base font-bold text-neutral-900">
                            Revised Return
                          </h3>
                          <p className="text-xs text-neutral-600 mt-0.5">
                            {existingFiling.itrType || existingFiling.itrForm || 'ITR'} for {assessmentYear}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleStartRevised}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-gold-600 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-gold-700 transition-all shadow-md shadow-amber-500/20 text-sm flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Start Revised
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Form 16 Upload View
  if (currentView === 'form16') {
    return (
      <div className="bg-gradient-to-b from-neutral-50 to-white min-h-screen flex flex-col">
        {/* Header with Back Navigation and Breadcrumb */}
        <header className="bg-white border-b border-neutral-200 z-50 flex-shrink-0 shadow-sm">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setCurrentView(null);
                  setForm16Summary(null);
                }}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors flex-shrink-0 group"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-600 group-hover:text-neutral-900 transition-colors" />
              </button>
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span>Data Source</span>
                <span>/</span>
                <span className="text-neutral-900 font-medium">Upload Form 16</span>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-3">
              Upload Form 16
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              Upload your Form 16 to automatically extract salary and TDS information
            </p>
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
      <div className="bg-gradient-to-b from-neutral-50 to-white min-h-screen flex flex-col">
        {/* Header with Back Navigation and Breadcrumb */}
        <header className="bg-white border-b border-neutral-200 z-50 flex-shrink-0 shadow-sm">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView(null)}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors flex-shrink-0 group"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-600 group-hover:text-neutral-900 transition-colors" />
              </button>
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span>Data Source</span>
                <span>/</span>
                <span className="text-neutral-900 font-medium">Fetch AIS/26AS</span>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-3">
              Fetch AIS/26AS Data
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              Connect to Income Tax Portal and automatically import your tax data
            </p>
          </div>
        </header>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto py-6 sm:py-8">

          <div className="bg-white rounded-xl border-2 border-neutral-200 shadow-lg p-6 sm:p-8">
            <div className="text-center mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
                Fetching AIS/26AS Data
              </h3>
              <p className="text-sm sm:text-base text-neutral-600">
                Connecting to Income Tax Portal and fetching your data...
              </p>
            </div>

            {isPrefetching ? (
              <div className="flex flex-col items-center gap-6 py-8">
                <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
                <div className="text-center">
                  <p className="text-base font-semibold text-neutral-900 mb-1">Fetching your data...</p>
                  <p className="text-sm text-neutral-600">This may take a few moments</p>
                </div>
              </div>
            ) : prefetchStatus.overall === 'success' && itrRecommendation ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-br from-primary-50 to-amber-50 rounded-xl border-2 border-primary-300 p-6 sm:p-8 text-center shadow-md">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
                    <CheckCircle className="w-8 h-8 text-primary-600" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-primary-700 mb-3">{itrRecommendation}</div>
                  <p className="text-base text-neutral-700 max-w-md mx-auto">
                    Based on your AIS/26AS data, we recommend filing <strong>{itrRecommendation}</strong>
                  </p>
                </div>

                <button
                  onClick={() => handleProceed(itrRecommendation)}
                  className="w-full py-4 px-6 bg-aurora-gradient text-white rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 text-base"
                >
                  Proceed with {itrRecommendation}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            ) : prefetchStatus.overall === 'error' ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error-100 mb-4">
                  <X className="w-8 h-8 text-error-600" />
                </div>
                <p className="text-base font-semibold text-error-600 mb-2">
                  Failed to fetch data
                </p>
                <p className="text-sm text-neutral-600 mb-6">
                  Please check your connection and try again
                </p>
                <button
                  onClick={handleAISFetch}
                  className="px-6 py-3 bg-aurora-gradient text-white rounded-lg font-semibold hover:opacity-90 transition-all shadow-md"
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
      <div className="bg-gradient-to-b from-neutral-50 to-white min-h-screen flex flex-col">
        {/* Header with Back Navigation and Breadcrumb */}
        <header className="bg-white border-b border-neutral-200 z-50 flex-shrink-0 shadow-sm">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setCurrentView(null);
                  setSelectedITR(null);
                }}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors flex-shrink-0 group"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-600 group-hover:text-neutral-900 transition-colors" />
              </button>
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span>Data Source</span>
                <span>/</span>
                <span className="text-neutral-900 font-medium">Select ITR Form</span>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-3">
              Select Your ITR Form
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              Choose the ITR form that matches your income sources
            </p>
          </div>
        </header>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex-1 overflow-hidden py-6 sm:py-8 flex flex-col">

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
      <div className="bg-gradient-to-b from-neutral-50 to-white min-h-screen flex flex-col">
        {/* Header with Back Navigation and Breadcrumb */}
        <header className="bg-white border-b border-neutral-200 z-50 flex-shrink-0 shadow-sm">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView(null)}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors flex-shrink-0 group"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-600 group-hover:text-neutral-900 transition-colors" />
              </button>
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span>Data Source</span>
                <span>/</span>
                <span className="text-neutral-900 font-medium">Guide Me</span>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-3">
              Find Your ITR Form
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              Answer a few questions to determine the right ITR form for you
            </p>
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
