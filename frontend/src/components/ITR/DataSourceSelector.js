// =====================================================
// DATA SOURCE SELECTOR COMPONENT
// Canonical Determine ITR step: /itr/determine
// Spec: docs/ITR_DETERMINE_ITR_SPEC.md
// =====================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Compass,
  Copy,
  Download,
  FileText,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import Form16Uploader from './Form16Uploader';
import GuideMeQuestionnaire from './GuideMeQuestionnaire';
import ITRSelectionCards from './ITRSelectionCards';
import RecommendationPanel from './DetermineITR/RecommendationPanel';
import { springs } from '../../lib/motion';
import { useDataPrefetch } from '../../hooks/useDataPrefetch';
import itrService from '../../services/api/itrService';
import { useAuth } from '../../contexts/AuthContext';
import { ensureJourneyStart, trackEvent } from '../../utils/analyticsEvents';

const STAGES = {
  CHOOSER: 'chooser',
  AUTO: 'auto',
  UPLOAD: 'upload',
  MANUAL: 'manual',
  EXPERT: 'expert',
  RECOMMENDATION: 'recommendation',
};

function formatIncomeSource(s) {
  const t = s?.type ? String(s.type).replace(/_/g, ' ').toLowerCase() : 'income';
  const details = s?.details ? ` — ${s.details}` : '';
  const src = s?.source ? ` (${s.source})` : '';
  return `${t}${details}${src}`;
}

function confidenceLabelFrom(result) {
  const raw = result?.confidence;
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'string') {
    const n = raw.trim().toLowerCase();
    if (n === 'high' || n === 'medium' || n === 'low') return n.charAt(0).toUpperCase() + n.slice(1);
  }
  if (typeof raw === 'number') {
    if (raw >= 0.75) return 'High';
    if (raw >= 0.5) return 'Medium';
    return 'Low';
  }
  return null;
}

export default function DataSourceSelector({ onProceed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const selectedPerson = location.state?.selectedPerson || null;

  const assessmentYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    return `${nextYear}-${(nextYear + 1).toString().slice(-2)}`;
  }, []);

  const [stage, setStage] = useState(STAGES.CHOOSER);
  const [form16Summary, setForm16Summary] = useState(null);
  const [guidedAnswers, setGuidedAnswers] = useState(null);
  const [selectedITR, setSelectedITR] = useState(null);

  const [recommendationState, setRecommendationState] = useState(null);
  // shape: { itrType, reason, confidence, mode, source, meta }
  // source: auto|upload|manual|override|previous-year|revised

  const [previousYearFiling, setPreviousYearFiling] = useState(null);
  const [existingFiling, setExistingFiling] = useState(null);

  const previousYearRequestedRef = useRef(false);
  const existingFilingRequestedRef = useRef(false);
  const existingDraftRequestedRef = useRef(false);

  const [existingDraft, setExistingDraft] = useState(null);

  const panNumber = selectedPerson?.panNumber || user?.panNumber || null;
  const userId = selectedPerson?.id || user?.id || null;

  const {
    prefetchStatus,
    prefetchedData,
    itrRecommendation: itrRecommendationResult,
    detectedIncomeSources,
    startPrefetch: fetchAll,
    isLoading: isPrefetching,
  } = useDataPrefetch(userId, panNumber, assessmentYear);

  const trackedDetermineViewRef = useRef(false);
  const trackedAutoDetectSuccessRef = useRef(false);
  const openedForm16RecommendationRef = useRef(false);

  // Analytics: Determine ITR view
  useEffect(() => {
    if (!selectedPerson) return;
    if (trackedDetermineViewRef.current) return;
    trackedDetermineViewRef.current = true;
    ensureJourneyStart();
    trackEvent('itr_determine_view', {
      role: user?.role || null,
      personType: selectedPerson?.type || null,
      assessmentYear,
      hasPan: !!panNumber,
    });
  }, [selectedPerson, user?.role, assessmentYear, panNumber]);

  // Analytics: Auto-detect success (AIS/26AS)
  useEffect(() => {
    const recommended = itrRecommendationResult?.recommendedITR;
    if (!recommended) return;
    if (prefetchStatus.overall !== 'success') return;
    if (trackedAutoDetectSuccessRef.current) return;
    trackedAutoDetectSuccessRef.current = true;
    trackEvent('itr_auto_detect_success', {
      recommendedITR: recommended,
      confidence: itrRecommendationResult?.confidence ?? null,
    });
  }, [prefetchStatus.overall, itrRecommendationResult]);

  // Optional: previous year filing (fail silently)
  useEffect(() => {
    const fetchPreviousYear = async () => {
      if (!selectedPerson?.id) return;
      if (previousYearRequestedRef.current) return;
      previousYearRequestedRef.current = true;

      try {
        const result = await itrService.getAvailablePreviousYears(selectedPerson.id, assessmentYear);
        if (result?.success && Array.isArray(result?.previousYears) && result.previousYears.length > 0) {
          setPreviousYearFiling(result.previousYears[0]);
        }
      } catch (e) {
        // noop
      }
    };
    fetchPreviousYear();
  }, [selectedPerson?.id, assessmentYear]);

  // Optional: revised return detection (fail silently)
  useEffect(() => {
    const checkExisting = async () => {
      if (!selectedPerson?.id) return;
      if (existingFilingRequestedRef.current) return;
      existingFilingRequestedRef.current = true;

      try {
        const filing = await itrService.checkExistingFiling(selectedPerson.id, assessmentYear);
        if (filing) setExistingFiling(filing);
      } catch (e) {
        // noop
      }
    };
    checkExisting();
  }, [selectedPerson?.id, assessmentYear]);

  // Resume Draft Detection
  useEffect(() => {
    const checkDraft = async () => {
      if (!selectedPerson?.id) return;
      if (existingDraftRequestedRef.current) return;
      existingDraftRequestedRef.current = true;

      try {
        const result = await itrService.getUserDrafts({
          userId: selectedPerson.id,
          assessmentYear, // e.g. 2025-26
          status: 'draft,paused',
          limit: 1,
        });

        // Handle various response shapes (array or { drafts: [] })
        const drafts = Array.isArray(result) ? result : (result?.drafts || []);

        if (drafts.length > 0) {
          setExistingDraft(drafts[0]);
        }
      } catch (e) {
        // noop
      }
    };
    checkDraft();
  }, [selectedPerson?.id, assessmentYear]);

  // When auto-detect finishes successfully in AUTO stage, converge to Recommendation
  useEffect(() => {
    if (stage !== STAGES.AUTO) return;
    if (prefetchStatus.overall !== 'success') return;
    if (!itrRecommendationResult?.recommendedITR) return;

    const confidence = confidenceLabelFrom(itrRecommendationResult);
    setRecommendationState({
      itrType: itrRecommendationResult.recommendedITR,
      reason: itrRecommendationResult.reason || null,
      confidence,
      mode: 'recommended',
      source: 'auto',
      meta: {
        recommendation: itrRecommendationResult,
        detectedIncomeSources: Array.isArray(detectedIncomeSources) ? detectedIncomeSources : [],
        prefetchedData: prefetchedData || null,
      },
    });
    setStage(STAGES.RECOMMENDATION);
  }, [
    stage,
    prefetchStatus.overall,
    itrRecommendationResult,
    detectedIncomeSources,
    prefetchedData,
  ]);

  const handleProceed = (itrType, data = {}) => {
    const navigationState = {
      selectedPerson,
      selectedITR: itrType,
      assessmentYear,
      ...data,
    };

    navigate('/itr/computation', { state: navigationState });
    if (onProceed) onProceed(itrType, navigationState);
  };

  const openRecommendation = ({ itrType, reason, confidence, mode, source, meta }) => {
    setRecommendationState({
      itrType,
      reason: reason || null,
      confidence: confidence || null,
      mode: mode || 'recommended',
      source,
      meta: meta || {},
    });
    setSelectedITR(itrType);
    setStage(STAGES.RECOMMENDATION);
  };

  const renderTopBar = ({ title, subtitle, onBack, right }) => (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-heading-3 font-semibold text-slate-900 truncate">{title}</h1>
            {subtitle ? <p className="text-body-small text-slate-600 mt-0.5">{subtitle}</p> : null}
          </div>
          {right ? <div className="flex-shrink-0">{right}</div> : null}
        </div>
      </div>
    </div>
  );

  const renderContextStrip = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-elevation-1 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-success-700" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-body-small text-slate-500">PAN</div>
            <div className="text-body-regular font-semibold text-slate-900 font-mono truncate">
              {panNumber || '—'}
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-primary-50 border border-primary-200 px-4 py-2">
          <div className="text-body-small text-primary-700 font-medium">Assessment Year</div>
          <div className="text-body-regular font-semibold text-primary-900">{assessmentYear}</div>
        </div>
      </div>
    </div>
  );

  // =====================================================
  // State 0: Gate (missing person)
  // =====================================================
  if (!selectedPerson) {
    return (
      <div className="min-h-screen bg-slate-50">
        {renderTopBar({
          title: 'Determine your ITR',
          subtitle: 'Select who you’re filing for to continue.',
          onBack: () => navigate('/dashboard'),
        })}
        <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-10">
          <div className="bg-white rounded-xl border border-slate-200 shadow-elevation-2 p-6">
            <h2 className="text-heading-3 font-semibold text-slate-900">Select person</h2>
            <p className="text-body-regular text-slate-600 mt-2">
              We need to know who you’re filing for before recommending the correct ITR.
            </p>
            <button
              type="button"
              onClick={() => navigate('/itr/select-person')}
              className="mt-5 w-full px-5 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors"
            >
              Select person
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // Shared recommendation screen (State 2)
  // =====================================================
  if (stage === STAGES.RECOMMENDATION) {
    const incomePreview =
      Array.isArray(recommendationState?.meta?.detectedIncomeSources)
        ? recommendationState.meta.detectedIncomeSources.map(formatIncomeSource)
        : [];

    return (
      <div className="min-h-screen bg-slate-50">
        {renderTopBar({
          title: 'Determine your ITR',
          subtitle: 'Review and continue to the computation sheet.',
          onBack: () => setStage(STAGES.CHOOSER),
        })}
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
          {renderContextStrip()}

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle}>
            <RecommendationPanel
              mode={recommendationState?.mode || 'recommended'}
              itrType={recommendationState?.itrType || null}
              reason={recommendationState?.reason || null}
              confidence={recommendationState?.confidence || null}
              incomeSourcesPreview={incomePreview}
              onChangeITR={() => {
                trackEvent('itr_data_source_selected', { source: 'override' });
                setStage(STAGES.EXPERT);
              }}
              onContinue={() => {
                const itrType = recommendationState?.itrType;
                if (!itrType) return;

                const src = recommendationState?.source;
                const meta = recommendationState?.meta || {};

                if (src === 'auto') {
                  handleProceed(itrType, {
                    dataSource: 'it-portal',
                    entryPoint: 'auto',
                    recommendation: meta.recommendation || null,
                    detectedIncomeSources: meta.detectedIncomeSources || [],
                    prefetchedData: meta.prefetchedData || null,
                  });
                  return;
                }

                if (src === 'upload') {
                  handleProceed(itrType, {
                    dataSource: 'form16',
                    entryPoint: 'upload',
                    form16Data: meta.form16Summary || null,
                    recommendation: meta.recommendation || null,
                  });
                  return;
                }

                if (src === 'manual') {
                  handleProceed(itrType, {
                    dataSource: 'guided-selection',
                    entryPoint: 'manual',
                    guidedAnswers: meta.guidedAnswers || null,
                    recommendation: meta.recommendation || null,
                  });
                  return;
                }

                if (src === 'override') {
                  handleProceed(itrType, {
                    dataSource: 'direct-selection',
                    entryPoint: 'override',
                    recommendation: meta.recommendation || { reason: 'Selected by you', confidence: null },
                  });
                  return;
                }

                // Fallback
                handleProceed(itrType);
              }}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  // =====================================================
  // AUTO stage
  // =====================================================
  if (stage === STAGES.AUTO) {
    const showError = prefetchStatus.overall === 'error';
    const showSuccess = prefetchStatus.overall === 'success' && !!itrRecommendationResult?.recommendedITR;

    return (
      <div className="min-h-screen bg-slate-50">
        {renderTopBar({
          title: 'Connect & Auto-detect',
          subtitle: 'Fetching AIS/26AS and recommending the right ITR.',
          onBack: () => setStage(STAGES.CHOOSER),
        })}
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
          {renderContextStrip()}

          <div className="bg-white rounded-xl border border-slate-200 shadow-elevation-2 p-6">
            {isPrefetching ? (
              <div className="flex flex-col items-center gap-5 py-6">
                <div className="w-14 h-14 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
                <div className="text-center">
                  <div className="text-heading-4 font-semibold text-slate-900">Fetching your data…</div>
                  <div className="text-body-regular text-slate-600 mt-1">Connecting → Fetching → Analyzing</div>
                </div>
              </div>
            ) : showError ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-error-100 mb-3">
                  <X className="w-6 h-6 text-error-700" aria-hidden="true" />
                </div>
                <div className="text-heading-4 font-semibold text-slate-900">Couldn’t fetch AIS/26AS</div>
                <p className="text-body-regular text-slate-600 mt-1">
                  Try again, or use Form 16 / the quick questionnaire.
                </p>
                <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={async () => {
                      trackedAutoDetectSuccessRef.current = false;
                      try {
                        await fetchAll();
                        toast.success('Data fetched successfully!');
                      } catch (e) {
                        toast.error('Failed to fetch data. Please try again.');
                      }
                    }}
                    className="px-5 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors"
                  >
                    Retry auto-detect
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent('itr_data_source_selected', { source: 'upload' });
                      setStage(STAGES.UPLOAD);
                    }}
                    className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Upload Form 16
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent('itr_data_source_selected', { source: 'manual' });
                      trackEvent('itr_manual_fallback_used', { started: true });
                      setStage(STAGES.MANUAL);
                    }}
                    className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Answer a few questions
                  </button>
                </div>
              </div>
            ) : showSuccess ? (
              <div className="text-center py-4">
                <div className="text-body-regular text-slate-600">
                  Recommendation ready. Redirecting…
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-heading-4 font-semibold text-slate-900">No recommendation yet</div>
                <p className="text-body-regular text-slate-600 mt-1">Try again or use another method.</p>
                <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={async () => {
                      trackedAutoDetectSuccessRef.current = false;
                      try {
                        await fetchAll();
                        toast.success('Data fetched successfully!');
                      } catch (e) {
                        toast.error('Failed to fetch data. Please try again.');
                      }
                    }}
                    className="px-5 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors"
                  >
                    Retry auto-detect
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // UPLOAD stage (Form 16)
  // =====================================================
  if (stage === STAGES.UPLOAD) {
    return (
      <div className="min-h-screen bg-slate-50">
        {renderTopBar({
          title: 'Upload Form 16',
          subtitle: 'We’ll suggest the right ITR and prefill salary/TDS.',
          onBack: () => {
            setForm16Summary(null);
            setStage(STAGES.CHOOSER);
          },
        })}
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
          {renderContextStrip()}

          <div className="bg-white rounded-xl border border-slate-200 shadow-elevation-2 p-6">
            <Form16Uploader
              onSummaryUpdate={(summary) => {
                setForm16Summary(summary);
              }}
              onComplete={(summary) => {
                if (summary?.suggestedITR) {
                  if (openedForm16RecommendationRef.current) return;
                  openedForm16RecommendationRef.current = true;
                  openRecommendation({
                    itrType: summary.suggestedITR,
                    reason: 'Based on salary and TDS from your uploaded Form 16.',
                    confidence: 'Medium',
                    mode: 'recommended',
                    source: 'upload',
                    meta: { form16Summary: summary, recommendation: { reason: 'Form 16 upload', confidence: 'Medium' } },
                  });
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // MANUAL stage (guided)
  // =====================================================
  if (stage === STAGES.MANUAL) {
    return (
      <div className="min-h-screen bg-slate-50">
        {renderTopBar({
          title: 'Answer a few questions',
          subtitle: 'We’ll recommend the right ITR based on a few quick signals.',
          onBack: () => setStage(STAGES.CHOOSER),
        })}
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
          {renderContextStrip()}

          <div className="bg-white rounded-xl border border-slate-200 shadow-elevation-2 p-6">
            <GuideMeQuestionnaire
              onComplete={(recommendedITR, answers) => {
                setGuidedAnswers(answers || null);
                trackEvent('itr_manual_fallback_used', { recommendedITR });
                openRecommendation({
                  itrType: recommendedITR,
                  reason: 'Based on your answers about income sources and eligibility.',
                  confidence: 'Medium',
                  mode: 'recommended',
                  source: 'manual',
                  meta: {
                    guidedAnswers: answers || null,
                    recommendation: { reason: 'Manual signals', confidence: 'Medium' },
                  },
                });
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // EXPERT stage (override)
  // =====================================================
  if (stage === STAGES.EXPERT) {
    return (
      <div className="min-h-screen bg-slate-50">
        {renderTopBar({
          title: 'Choose your ITR',
          subtitle: 'If you already know your ITR, select it here.',
          onBack: () => setStage(STAGES.CHOOSER),
        })}
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
          {renderContextStrip()}

          <div className="bg-white rounded-xl border border-slate-200 shadow-elevation-2 p-6">
            <ITRSelectionCards
              selectedITR={selectedITR}
              onHelp={() => {
                trackEvent('itr_data_source_selected', { source: 'manual' });
                trackEvent('itr_manual_fallback_used', { started: true });
                setStage(STAGES.MANUAL);
              }}
              onSelect={(itrType) => {
                setSelectedITR(itrType);
                trackEvent('itr_itr_override_used', { selectedITR: itrType });
                openRecommendation({
                  itrType,
                  reason: 'Selected by you.',
                  confidence: null,
                  mode: 'selected',
                  source: 'override',
                  meta: { recommendation: { reason: 'Selected by user', confidence: null } },
                });
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // CHOOSER stage (default, auto-first)
  // =====================================================
  return (
    <div className="min-h-screen bg-slate-50">
      {renderTopBar({
        title: 'Determine your ITR',
        subtitle: 'Auto-detect first. You can always change later.',
        onBack: () => navigate('/itr/select-person'),
      })}

      <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        {renderContextStrip()}

        {existingDraft && (
          <div className="bg-white rounded-xl border border-primary-200 shadow-elevation-2 p-5 mb-5 ring-4 ring-primary-50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-primary-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-heading-4 font-semibold text-slate-900">Resume your saved draft</h3>
                <p className="text-body-regular text-slate-600 mt-1">
                  You have a saved {existingDraft.itrType} draft from {new Date(existingDraft.updatedAt || existingDraft.createdAt).toLocaleDateString()}.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => {
                      navigate(`/itr/computation?draftId=${existingDraft.id}`, {
                        state: {
                          selectedPerson,
                          assessmentYear,
                          selectedITR: existingDraft.itrType,
                        },
                      });
                    }}
                    className="px-5 py-2.5 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors shadow-elevation-1"
                  >
                    Resume Filing
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Starting a new filing will discard your existing draft. Are you sure?')) { // eslint-disable-line no-alert
                        setExistingDraft(null);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                  >
                    Discard & Start New
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-elevation-2 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Download className="w-6 h-6 text-primary-700" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-heading-4 font-semibold text-slate-900">Connect & Auto-detect</h2>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-body-small font-semibold bg-primary-100 text-primary-900 border border-primary-200">
                    Recommended
                  </span>
                </div>
                <p className="text-body-regular text-slate-600 mt-1">
                  We’ll fetch AIS/26AS (best available data) and recommend the correct ITR with a short explanation.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    trackEvent('itr_data_source_selected', { source: 'auto' });
                    setStage(STAGES.AUTO);
                    trackedAutoDetectSuccessRef.current = false;
                    try {
                      await fetchAll();
                      toast.success('Data fetched successfully!');
                    } catch (e) {
                      toast.error('Failed to fetch data. Please try again.');
                    }
                  }}
                  className="mt-4 w-full sm:w-auto px-5 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors"
                >
                  Connect & Auto-detect
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-elevation-1 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Upload className="w-5 h-5 text-slate-700" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-heading-4 font-semibold text-slate-900">Upload Form 16</h3>
                <p className="text-body-regular text-slate-600 mt-1">
                  Fastest for salaried users. We’ll infer the ITR and prefill salary/TDS.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    trackEvent('itr_data_source_selected', { source: 'upload' });
                    setStage(STAGES.UPLOAD);
                  }}
                  className="mt-4 w-full px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Upload Form 16
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-elevation-1 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Compass className="w-5 h-5 text-slate-700" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-heading-4 font-semibold text-slate-900">Answer a few questions</h3>
                <p className="text-body-regular text-slate-600 mt-1">
                  A quick fallback if auto-fetch isn’t available. We’ll recommend based on simple signals.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    trackEvent('itr_data_source_selected', { source: 'manual' });
                    trackEvent('itr_manual_fallback_used', { started: true });
                    setStage(STAGES.MANUAL);
                  }}
                  className="mt-4 w-full px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Start questionnaire
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              trackEvent('itr_data_source_selected', { source: 'override' });
              setStage(STAGES.EXPERT);
            }}
            className="text-body-regular text-slate-600 hover:text-slate-900 underline underline-offset-4"
          >
            I know my ITR (choose manually)
          </button>
        </div>

        {(previousYearFiling || existingFiling) && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-elevation-1 p-5">
            <div className="text-heading-4 font-semibold text-slate-900 mb-3">Quick actions</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {previousYearFiling && (
                <button
                  type="button"
                  onClick={() => {
                    trackEvent('itr_data_source_selected', { source: 'manual' });
                    handleProceed(previousYearFiling.itrType || previousYearFiling.itrForm, {
                      dataSource: 'previous-year',
                      entryPoint: 'manual',
                      copyFilingId: previousYearFiling.id,
                      assessmentYear,
                    });
                  }}
                  className="text-left rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Copy className="w-5 h-5 text-slate-700" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-body-regular font-semibold text-slate-900">Continue from last year</div>
                      <div className="text-body-small text-slate-600 mt-0.5">
                        {previousYearFiling.itrType || previousYearFiling.itrForm || 'ITR'} •{' '}
                        {previousYearFiling.assessmentYear || '—'}
                      </div>
                    </div>
                  </div>
                </button>
              )}

              {existingFiling && (
                <button
                  type="button"
                  onClick={() => {
                    trackEvent('itr_data_source_selected', { source: 'manual' });
                    handleProceed(existingFiling.itrType || existingFiling.itrForm, {
                      dataSource: 'revised-return',
                      entryPoint: 'manual',
                      originalFilingId: existingFiling.id,
                      assessmentYear,
                    });
                  }}
                  className="text-left rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <RefreshCw className="w-5 h-5 text-slate-700" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-body-regular font-semibold text-slate-900">Start revised return</div>
                      <div className="text-body-small text-slate-600 mt-0.5">
                        {existingFiling.itrType || existingFiling.itrForm || 'ITR'} • {assessmentYear}
                      </div>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
