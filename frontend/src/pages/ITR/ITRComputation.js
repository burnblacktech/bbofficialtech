// =====================================================
// ITR COMPUTATION PAGE
// Single page with expandable sections for ITR filing
// =====================================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
// Lazy load icons to reduce initial bundle size
import { ArrowLeft, ArrowRight, Save, Download, FileText, User, IndianRupee, Calculator, CreditCard, Building2, CheckCircle, Globe, Shield, Wheat } from 'lucide-react';
// Section Components (Decomposed)
import PersonalInfoSection from '../../components/ITR/sections/PersonalInfoSection';
import IncomeSection from '../../components/ITR/sections/IncomeSection';
import BusinessSection from '../../components/ITR/sections/BusinessSection';
import CapitalGainsSection from '../../components/ITR/sections/CapitalGainsSection';
import DeductionsSection from '../../components/ITR/sections/DeductionsSection';
import ReviewSection from '../../components/ITR/sections/ReviewSection';
import ExemptIncomeSection from '../../components/ITR/sections/ExemptIncomeSection';
import ForeignAssetsSection from '../../components/ITR/sections/ForeignAssetsSection';
import TaxOutcomeSection from '../../components/ITR/sections/TaxOutcomeSection';
import BankDetailsSection from '../../components/ITR/sections/BankDetailsSection';
import { canSubmitFiling } from '../../utils/submissionGate';

import ComputationSheet from '../../components/ITR/ComputationSheet';
import TaxRegimeToggle from '../../components/ITR/TaxRegimeToggle';
import YearSelector from '../../components/ITR/YearSelector';
import { itrJsonExportService } from '../../services/itrJsonExportService';
import { DataVerificationPanel } from '../../features/discrepancy';
import itrAutoFillService from '../../services/ITRAutoFillService';
import autoPopulationService from '../../services/AutoPopulationService';
import fieldLockService, { VERIFICATION_STATUS } from '../../services/FieldLockService';
import aiRecommendationEngine from '../../services/AIRecommendationEngine';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';
import { Loader, Lightbulb, AlertTriangle, Info } from 'lucide-react';
import BreathingGrid from '../../components/DesignSystem/BreathingGrid';
import SectionCard from '../../components/DesignSystem/SectionCard';
import { Button, Card } from '../../components/DesignSystem/components';
import TaxComputationBar from '../../components/ITR/TaxComputationBar';
import ComputationSidebar from '../../components/ITR/ComputationSidebar';
import PauseResumeButton from '../../components/ITR/PauseResumeButton';
import InvoiceBadge from '../../components/ITR/InvoiceBadge';
import RegimeToggle from '../../components/ITR/RegimeToggle';
import ITRToggle from '../../components/ITR/ITRToggle';
import AutoPopulationProgress from '../../components/ITR/AutoPopulationProgress';
import AutoPopulationActions from '../../components/ITR/AutoPopulationActions';
import ResumeFilingModal from '../../components/ITR/ResumeFilingModal';
import itrService from '../../services/api/itrService';
import { useAuth } from '../../contexts/AuthContext';
import { isCA } from '../../constants/roles';
import DocumentChecklist from '../../components/CA/DocumentChecklist';
import CANotes from '../../components/CA/CANotes';
import ClientCommunication from '../../components/CA/ClientCommunication';
import ITRFormSelector from '../../components/ITR/ITRFormSelector';
import { useITRPersistence } from '../../hooks/itr/useITRPersistence';
import { useForeignAssets } from '../../features/foreign-assets';
import { TaxOptimizer } from '../../features/tax-optimizer';
import { FilingConfirmationPanel } from '../../features/submission';
import { useExportDraftPDF } from '../../features/pdf-export/hooks/use-pdf-export';
import PDFExportButton from '../../features/pdf-export/components/pdf-export-button';
import useRealTimeValidation from '../../hooks/useRealTimeValidation';
import ITRValidationEngine from '../../components/ITR/core/ITRValidationEngine';
import { AlertCircle, XCircle, Cloud, CloudOff, Check, LogOut, Send } from 'lucide-react';
import SubmitToCAModal from '../../components/ITR/SubmitToCAModal'; // V3.4
import { useFilingContext } from '../../hooks/useFilingContext';
import { useFinancialBlueprint } from '../../hooks/useFinancialBlueprint';
import { isLockedState } from '../../types/filing.ts';
import ValidationSummary from '../../components/ITR/ValidationSummary';
import { formatIndianCurrency } from '../../lib/format';
import useAutoSave, { AutoSaveIndicator } from '../../hooks/useAutoSave';
import formDataService from '../../services/FormDataService';
import { enterpriseLogger } from '../../utils/logger';
import ErrorHandler from '../../services/core/ErrorHandler';
import verificationStatusService from '../../services/VerificationStatusService';
import { motion, AnimatePresence } from 'framer-motion';
import ITRComputationHeader from '../../components/ITR/ITRComputationHeader';
import ITRComputationContent from '../../components/ITR/ITRComputationContent';
import FinancialBlueprintSection from '../../components/ITR/FinancialBlueprintSection';
import FinancialBlueprintOverview from '../../components/ITR/FinancialBlueprintOverview';
import FinancialYearEvents from '../../components/ITR/FinancialYearEvents';
import FinancialYearTimeline from '../../components/ITR/FinancialYearTimeline';
import TaxOpportunitiesCard from '../../components/ITR/TaxOpportunitiesCard';
import { ensureJourneyStart, trackEvent } from '../../utils/analyticsEvents';
import {
  orderSections as orderGuidedSections,
  shouldShowSection as shouldShowGuidedSection,
  canProceedFromSection as canProceedGuided,
  getMissingRequired,
  getNextSectionId,
  getPrevSectionId,
} from './sectionFlow';

const ITRComputation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const { user, isLoading: authLoading, refreshProfile } = useAuth();
  const isCAUser = user && isCA(user.role);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saving', 'saved', 'error', 'offline'
  const [isDownloading, setIsDownloading] = useState(false);
  const exportDraftPDF = useExportDraftPDF();
  const [expandedSections, setExpandedSections] = useState({
    personalInfo: false,
    income: true, // V1: Start with Income
    deductions: false,
    taxesPaid: false,
    taxComputation: false,
    bankDetails: false,
  });
  const [expandedSectionId, setExpandedSectionId] = useState(null); // For BreathingGrid (legacy)
  const [activeSectionId, setActiveSectionId] = useState('income'); // V1: Start with Income
  const [showOpportunities, setShowOpportunities] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false); // Focus mode for primary actions
  const [blueprintCollapsed, setBlueprintCollapsed] = useState(false); // Collapse blueprint in focus mode
  const [showFilingConfirmation, setShowFilingConfirmation] = useState(false); // Show filing confirmation panel
  const [showSubmitCAModal, setShowSubmitCAModal] = useState(false); // V3.4
  const [submitCALoading, setSubmitCALoading] = useState(false); // V3.4

  const handleSubmitToCA = async () => {
    try {
      setSubmitCALoading(true);
      const filingId = effectiveFilingId || filingIdLocal;
      await apiClient.post(`/itr/filing/${filingId}/submit-to-ca`);
      toast.success('Sent to CA successfully!');
      setShowSubmitCAModal(false);
      // Refresh filing status
      // window.location.reload(); prefer safe refetch
      // Should trigger re-fetch of currentFiling via hooks or manually update state
      // Quick fix: reload to ensure state sync
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to submit to CA');
    } finally {
      setSubmitCALoading(false);
    }
  };

  const trackedComputationViewRef = useRef(false);
  const trackedCollectDataViewRef = useRef(false);
  const sectionCompletedOnceRef = useRef(new Set());
  const initialSectionAppliedRef = useRef(false);

  // Helper function for safe localStorage operations
  const safeLocalStorageGet = (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item);
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.warn(`Invalid JSON in localStorage key "${key}"`, { error, key });
        // Clear invalid data
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error('Failed to remove invalid localStorage key', { key, error: e });
        }
      } else if (error.name === 'QuotaExceededError') {
        enterpriseLogger.error('localStorage quota exceeded', { key });
        toast.error('Storage limit reached. Some data may not be saved.');
      } else {
        console.error('Error reading localStorage key', { key, error });
      }
      return defaultValue;
    }
  };

  const safeLocalStorageSet = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        enterpriseLogger.error('localStorage quota exceeded', { key });
        toast.error('Storage limit reached. Please clear some data and try again.');
        return false;
      } else {
        console.error('Error writing to localStorage key', { key, error });
        return false;
      }
    }
  };

  // Route guard: Check for selectedPerson, restore from localStorage if needed
  const getSelectedPersonFromStorage = () => {
    if (location.state?.selectedPerson) return location.state.selectedPerson;
    return safeLocalStorageGet('itr_selected_person', null);
  };

  const selectedPerson = getSelectedPersonFromStorage();
  const initialVerificationResult = location.state?.verificationResult;
  const draftId = searchParams.get('draftId') || location.state?.draftId;
  const filingId = params.filingId || searchParams.get('filingId') || location.state?.filingId;
  const viewMode = location.state?.viewMode || searchParams.get('viewMode') || null; // 'readonly' for completed filings

  // Draft identity stabilization: URL/state can lag; keep a local copy that updates immediately after POST /itr/drafts.
  // This prevents duplicate filing/draft creation during the window before searchParams reflect the new draftId.
  const [draftIdLocal, setDraftIdLocal] = useState(draftId || null);
  const [filingIdLocal, setFilingIdLocal] = useState(filingId || null);
  const effectiveDraftId = searchParams.get('draftId') || location.state?.draftId || draftIdLocal;
  const effectiveFilingId = params.filingId || searchParams.get('filingId') || location.state?.filingId || filingIdLocal;

  // Phase 4: Get filing context (lifecycle state, allowed actions, ITR type)
  const { lifecycleState, allowedActions, itrType: contextITRType, isLoading: contextLoading, error: contextError } = useFilingContext(effectiveFilingId);

  // Get Financial Blueprint data
  const { blueprint, isLoading: blueprintLoading } = useFinancialBlueprint(effectiveFilingId);

  // Track entry point for context-aware back navigation (refresh-safe: read from query params too)
  const getEntryPoint = () => {
    // Check query params first (for refresh scenarios)
    const entryPointFromQuery = searchParams.get('entryPoint');
    if (entryPointFromQuery) {
      return entryPointFromQuery;
    }
    if (location.state?.entryPoint) {
      return location.state.entryPoint;
    }
    if (location.state?.dataSource) {
      // From DataSourceSelector
      return location.state.dataSource;
    }
    if (location.state?.fromFormSelection) {
      return 'form-selection';
    }
    if (location.state?.mode === 'expert') {
      return 'expert';
    }
    if (location.state?.mode === 'guided') {
      return 'guided';
    }
    if (draftId || filingId) {
      return 'direct-access';
    }
    return null;
  };

  const entryPoint = getEntryPoint();

  const autoDetectITR = location.state?.autoDetectITR || false;
  // Get initial ITR from location state, recommendation, or localStorage recovery
  const getInitialITR = () => {
    if (location.state?.selectedITR) return location.state.selectedITR;
    if (location.state?.recommendedITR) return location.state.recommendedITR;
    // Try to recover from localStorage entry point
    const recoveredEntryPoint = safeLocalStorageGet('itr_computation_entry_point', null);
    if (recoveredEntryPoint) {
      const recoveredDraft = safeLocalStorageGet('itr_draft_current', null);
      if (recoveredDraft?.selectedITR) return recoveredDraft.selectedITR;
    }
    return 'ITR-1'; // Default to ITR-1
  };
  const initialITR = getInitialITR();
  const [selectedITR, setSelectedITR] = useState(initialITR);
  const [scheduleFAOptIn, setScheduleFAOptIn] = useState(false);
  const [balanceSheetOptIn, setBalanceSheetOptIn] = useState(false);
  const [auditInfoOptIn, setAuditInfoOptIn] = useState(false);
  const [goodsCarriageOptIn, setGoodsCarriageOptIn] = useState(false);

  // Store entry point and ITR type in localStorage for page refresh recovery
  useEffect(() => {
    if (entryPoint) {
      safeLocalStorageSet('itr_computation_entry_point', entryPoint);
    }
    if (selectedITR) {
      safeLocalStorageSet('itr_computation_selected_itr', selectedITR);
    }
  }, [entryPoint, selectedITR]);

  // Funnel analytics: computation view (once per mount)
  useEffect(() => {
    if (trackedComputationViewRef.current) return;
    trackedComputationViewRef.current = true;
    ensureJourneyStart();
    trackEvent('itr_computation_view', {
      role: user?.role || null,
      itrType: selectedITR || initialITR || null,
      entryPoint: entryPoint || null,
      draftId: searchParams.get('draftId') || null,
      filingId: searchParams.get('filingId') || params?.filingId || null,
      viewMode: (viewMode || null),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Funnel analytics: collect-data view (once per mount)
  useEffect(() => {
    if (trackedCollectDataViewRef.current) return;
    trackedCollectDataViewRef.current = true;
    ensureJourneyStart();
    trackEvent('itr_collect_data_view', {
      role: user?.role || null,
      itrType: selectedITR || initialITR || null,
      entryPoint: entryPoint || null,
      draftId: searchParams.get('draftId') || null,
      filingId: searchParams.get('filingId') || params?.filingId || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // STEP 5.2: Auto-Fetch / Auto-Parse Wiring (Frontend Ingestion)
  // Check for documents passed from DocumentUploadHub and trigger auto-fill
  useEffect(() => {
    const uploadedDocs = location.state?.documents;

    // Only proceed if we have documents and haven't processed them yet (avoid loops)
    if (uploadedDocs && uploadedDocs.length > 0 && !location.state?.processedAutoFill) {
      console.log('Documents detected for auto-fill:', uploadedDocs);

      // Transform documents into 'sources' for AutoPopulationService
      // Map mock stub structure to source types
      const sources = {};

      uploadedDocs.forEach(doc => {
        if (doc.extractedData) {
          if (doc.category === 'form16') {
            sources.form16 = doc.extractedData;
          } else if (doc.category === 'ais') {
            sources.ais = doc.extractedData;
          } else if (doc.category === 'form26as') {
            sources.form26as = doc.extractedData;
          } else if (doc.category === 'bankStatement') {
            // Treat as 'verified' or high priority 'manual' equivalent for now, or just map to AIS for simplicity if structure matches
            // Better: Map to 'ais' or create new source if supported. Let's merge into 'ais' for simplicity as per stub
            sources.ais = { ...(sources.ais || {}), ...doc.extractedData };
          }
        }
      });

      if (Object.keys(sources).length > 0) {
        console.log('Auto-populating from sources:', sources);
        const result = autoPopulationService.autoPopulateWithPriority(sources, formData);

        setFormData(result.formData);
        toast.success(`Data auto-filled from ${uploadedDocs.length} documents!`, {
          icon: '✨',
          duration: 4000,
        });

        // Mark as processed in history state to prevent re-processing on simple re-renders
        // Note: Replacing state in history is tricky without triggering re-render, so we use a ref or just rely on 'initial' check if meaningful
        // Ideally we clear the state.documents after consumption
        navigate(location.pathname + location.search, {
          state: { ...location.state, processedAutoFill: true },
          replace: true,
        });
      }
    }
  }, [location.state, navigate]);

  // Route guard: Redirect if no selectedPerson and no draftId/filingId
  useEffect(() => {
    if (!selectedPerson && !draftId && !filingId && !viewMode) {
      // Check if we can recover from localStorage
      const recoveredPerson = safeLocalStorageGet('itr_selected_person', null);
      if (recoveredPerson) {
        // Person found in localStorage, continue
        return;
      }
      // No person found, redirect to selection page
      toast.error('Please select a person to file for');
      navigate('/itr/select-person', { replace: true });
    } else if (selectedPerson) {

      // Save selectedPerson to localStorage for page refresh recovery
      safeLocalStorageSet('itr_selected_person', selectedPerson);
    }
  }, [selectedPerson, draftId, filingId, viewMode, navigate]);

  const _recommendation = location.state?.recommendation;
  const dataSource = location.state?.dataSource; // 'form16', 'it-portal', 'manual', 'previous-year'
  const showDocumentUpload = location.state?.showDocumentUpload || false;
  const showITPortalConnect = location.state?.showITPortalConnect || false;
  const copiedFromPreviousYear = location.state?.copiedFromPreviousYear || false;
  // Initialize assessment year from draft or location state, default to current year
  const getDefaultAssessmentYear = () => {
    if (location.state?.assessmentYear) return location.state.assessmentYear;
    if (location.state?.filing?.assessmentYear) return location.state.filing.assessmentYear;
    // Default to current assessment year (FY + 1)
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    return `${nextYear}-${(nextYear + 1).toString().slice(-2)}`;
  };
  const [assessmentYear, setAssessmentYear] = useState(getDefaultAssessmentYear());
  const [currentFiling, setCurrentFiling] = useState(location.state?.filing || null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showITRSelector, setShowITRSelector] = useState(!initialITR || autoDetectITR);
  const [verificationResult] = useState(initialVerificationResult || null);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const createDraftIdempotencyKeyRef = useRef(null);
  const generateClientRequestId = () => `itr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const lastSavedTimestampRef = useRef(null);
  const isCreatingDraftRef = useRef(false);
  const pendingDraftCreationRef = useRef(null); // Track last saved timestamp to prevent recursive updates
  const draftCreationErrorRef = useRef(false); // Track if draft creation failed (prevent infinite retries)
  const lastCreationAttemptRef = useRef(null); // Track last creation attempt timestamp (cooldown)
  const isNavigatingRef = useRef(false); // Track if navigation is in progress
  const errorDisplayedRef = useRef(false); // Track if error was already displayed

  // Form data state (must be declared before useRealTimeValidation)
  const [formData, setFormData] = useState({
    personalInfo: {
      pan: selectedPerson?.panNumber || user?.panNumber || '',
      name: selectedPerson?.name || user?.firstName || user?.name || '',
      dateOfBirth: user?.dateOfBirth || selectedPerson?.dateOfBirth || '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: user?.phone || selectedPerson?.phone || '',
      email: user?.email || selectedPerson?.email || '',
    },
    income: {
      salary: 0,
      // ITR-1: businessIncome must be 0 (not an object)
      // ITR-3: businessIncome is an object with businesses array
      businessIncome: (selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? {
        businesses: [],
      } : 0,
      // ITR-1: professionalIncome must be 0 (not an object)
      // ITR-3: professionalIncome is an object with professions array
      professionalIncome: (selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? {
        professions: [],
      } : 0,
      presumptiveBusiness: (selectedITR === 'ITR-4' || selectedITR === 'ITR4') ? {
        hasPresumptiveBusiness: false,
        grossReceipts: 0,
        presumptiveRate: 8,
        presumptiveIncome: 0,
        optedOut: false,
      } : undefined,
      presumptiveProfessional: (selectedITR === 'ITR-4' || selectedITR === 'ITR4') ? {
        hasPresumptiveProfessional: false,
        grossReceipts: 0,
        presumptiveRate: 50,
        presumptiveIncome: 0,
        optedOut: false,
      } : undefined,
      // ITR-1: capitalGains must be 0 (not an object)
      // ITR-2/3: capitalGains is an object with details
      capitalGains: (selectedITR === 'ITR-2' || selectedITR === 'ITR2' || selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? {
        hasCapitalGains: false,
        stcgDetails: [],
        ltcgDetails: [],
      } : 0,
      houseProperty: {
        properties: [],
      },
      otherSources: {
        interestIncomes: [],
        otherIncomes: [],
        totalInterestIncome: 0,
        totalOtherIncome: 0,
        totalOtherSourcesIncome: 0,
        eligible80TTADeduction: 0,
      },
      foreignIncome: (selectedITR === 'ITR-2' || selectedITR === 'ITR2' || selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? {
        hasForeignIncome: false,
        foreignIncomeDetails: [],
      } : undefined,
      directorPartner: (selectedITR === 'ITR-2' || selectedITR === 'ITR2' || selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? {
        isDirector: false,
        directorIncome: 0,
        isPartner: false,
        partnerIncome: 0,
      } : undefined,
      otherIncome: 0,
    },
    balanceSheet: (selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? {
      hasBalanceSheet: false,
      assets: {
        currentAssets: { total: 0 },
        fixedAssets: { total: 0 },
        investments: 0,
        loansAdvances: 0,
        total: 0,
      },
      liabilities: {
        currentLiabilities: { total: 0 },
        longTermLiabilities: { total: 0 },
        capital: 0,
        total: 0,
      },
    } : undefined,
    auditInfo: (selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? {
      isAuditApplicable: false,
      auditReportNumber: '',
      auditReportDate: '',
      caDetails: {},
    } : undefined,
    deductions: {
      section80C: 0,
      section80D: 0,
      section80G: 0,
      section80TTA: 0,
      section80TTB: 0,
      otherDeductions: {},
    },
    taxesPaid: {
      tds: 0,
      advanceTax: 0,
      selfAssessmentTax: 0,
    },
    exemptIncome: {
      hasExemptIncome: false,
      exemptIncomes: [],
      agriculturalIncome: {
        hasAgriculturalIncome: false,
        agriculturalIncomes: [],
        netAgriculturalIncome: 0,
      },
      totalExemptIncome: 0,
    },
    bankDetails: {
      accountNumber: '',
      ifsc: '',
      accountType: 'savings',
      bankName: '',
    },
  });

  // Schedule FA visibility (ITR-2 / ITR-3 only, hidden until triggered)
  const scheduleFAEligible =
    selectedITR === 'ITR-2' || selectedITR === 'ITR2' || selectedITR === 'ITR-3' || selectedITR === 'ITR3';
  const canUseScheduleFA = !!effectiveFilingId && scheduleFAEligible;
  const { data: foreignAssetsData } = useForeignAssets(canUseScheduleFA ? effectiveFilingId : null);
  const foreignAssetsCount = Array.isArray(foreignAssetsData?.assets) ? foreignAssetsData.assets.length : 0;
  const hasForeignIncomeSignal = !!(
    formData?.income?.foreignIncome?.hasForeignIncome ||
    (formData?.income?.foreignIncome?.foreignIncomeDetails || []).length > 0
  );
  const shouldShowScheduleFA = canUseScheduleFA && (scheduleFAOptIn || foreignAssetsCount > 0 || hasForeignIncomeSignal);

  const sectionVisibilityOpts = useMemo(() => ({
    filingId: effectiveFilingId || null,
    foreignAssetsCount,
    hasForeignIncomeSignal,
    scheduleFAOptIn,
    balanceSheetOptIn,
    auditInfoOptIn,
    goodsCarriageOptIn,
  }), [effectiveFilingId, foreignAssetsCount, hasForeignIncomeSignal, scheduleFAOptIn, balanceSheetOptIn, auditInfoOptIn, goodsCarriageOptIn]);

  const scheduleFAVisible = useMemo(
    () => shouldShowGuidedSection('scheduleFA', formData, selectedITR, sectionVisibilityOpts),
    [formData, selectedITR, sectionVisibilityOpts],
  );
  const shouldShowBalanceSheet = useMemo(
    () => shouldShowGuidedSection('balanceSheet', formData, selectedITR, sectionVisibilityOpts),
    [formData, selectedITR, sectionVisibilityOpts],
  );
  const shouldShowAuditInfo = useMemo(
    () => shouldShowGuidedSection('auditInfo', formData, selectedITR, sectionVisibilityOpts),
    [formData, selectedITR, sectionVisibilityOpts],
  );
  const shouldShowGoodsCarriage = useMemo(
    () => shouldShowGuidedSection('goodsCarriage', formData, selectedITR, sectionVisibilityOpts),
    [formData, selectedITR, sectionVisibilityOpts],
  );

  // Real-time validation hook
  const validationEngine = new ITRValidationEngine();
  const {
    fieldErrors,
    hasErrors,
    getAllErrors,
    validateSection: validateSectionHook,
    isValidating: isValidatingForm,
  } = useRealTimeValidation(formData, selectedITR, 300);

  // Phase 4: Determine if filing is readonly (use lifecycleState instead of status)
  // Fallback to old status check for backward compatibility during transition
  // Phase 4: Determine editability (The "Input Enablement Rule")
  // Rule: disabled = !allowedActions.includes('edit_data')
  // Exception: If effectiveFilingId is null, it's a new filing (creation mode), so we strictly allow editing.
  const canEdit = (!effectiveFilingId) || allowedActions?.includes('edit_data');
  const isReadOnly = !canEdit;

  // Gate A (hybrid onboarding): require PAN verified + DOB before entering computation (END_USER only)
  const gateARefreshAttemptedRef = useRef(false);
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (isCAUser) return;
    if (isReadOnly) return;

    const panOk = user.panVerified === true;
    const dobOk = !!user.dateOfBirth;
    if (panOk && dobOk) return;

    const run = async () => {
      // First attempt: refresh profile (to avoid stale state right after PAN verify)
      if (!gateARefreshAttemptedRef.current && refreshProfile) {
        gateARefreshAttemptedRef.current = true;
        await refreshProfile();
        return;
      }

      const returnTo = `${location.pathname}${location.search}`;
      navigate(`/profile?returnTo=${encodeURIComponent(returnTo)}`, {
        replace: true,
        state: {
          returnTo,
          returnState: location.state || null,
        },
      });
    };
    run();
  }, [authLoading, isCAUser, isReadOnly, location.pathname, location.search, location.state, navigate, refreshProfile, user]);

  // F1.1: Auto-expand Personal Info if incomplete and editable (U2.4)
  useEffect(() => {
    // Only run if we can edit
    if (canEdit && !isValidatingForm) {
      // Check if personal info is complete
      const pi = formData?.personalInfo;
      const isComplete = pi?.pan && pi?.name && pi?.email && pi?.dateOfBirth;

      if (!isComplete && activeSectionId !== 'personalInfo') {
        // Force expand and scroll to personal info
        setActiveSectionId('personalInfo');
        setExpandedSections(prev => ({ ...prev, personalInfo: true }));

        toast('Please complete Personal Information first.', { id: 'pi-incomplete', icon: '🔒' });

        // Focus first field after a short delay to allow render
        setTimeout(() => {
          const firstInput = document.querySelector('.personal-info-section input, #personalInfo input');
          if (firstInput) firstInput.focus();
        }, 300);
      }
    }
  }, [canEdit, formData, isValidatingForm, activeSectionId]);

  // CA Workflow State
  const [documents, setDocuments] = useState([]);
  const [caNotes, setCANotes] = useState([]);
  const [clientMessages, setClientMessages] = useState([]);

  // Convert assessment year to financial year for YearSelector
  const getFinancialYearFromAY = (ay) => {
    // AY 2024-25 corresponds to FY 2023-24
    const [start, end] = ay.split('-');
    const fyStart = parseInt(start) - 1;
    const fyEnd = parseInt(end) - 1;
    return `${fyStart}-${fyEnd.toString().slice(-2)}`;
  };

  // Convert financial year to assessment year
  const getAYFromFinancialYear = (fy) => {
    // FY 2023-24 corresponds to AY 2024-25
    const [start, end] = fy.split('-');
    const ayStart = parseInt(start) + 1;
    const ayEnd = parseInt(end) + 1;
    return `${ayStart}-${ayEnd.toString().slice(-2)}`;
  };

  // Tax computation result
  const [taxComputation, setTaxComputation] = useState(null);

  // Tax regime state
  const [taxRegime, setTaxRegime] = useState('old'); // 'old' or 'new'

  // Automatic ITR type switching for regulatory requirements
  useEffect(() => {
    // CRITICAL: Auto-switch to ITR-2 if agricultural income > ₹5,000 (regulatory requirement)
    const agriIncome = formData?.exemptIncome?.agriculturalIncome?.netAgriculturalIncome
      || formData?.exemptIncome?.netAgriculturalIncome
      || formData?.agriculturalIncome
      || 0;

    if ((selectedITR === 'ITR-1' || selectedITR === 'ITR1') && agriIncome > 5000) {
      // Automatically switch to ITR-2
      setSelectedITR('ITR-2');
      toast.error(
        `Agricultural income (₹${agriIncome.toLocaleString('en-IN')}) exceeds ₹5,000. ` +
        'Automatically switched to ITR-2 as required by Income Tax Department rules.',
        { duration: 6000 },
      );
    }
  }, [formData?.exemptIncome?.agriculturalIncome?.netAgriculturalIncome, formData?.exemptIncome?.netAgriculturalIncome, formData?.agriculturalIncome, selectedITR]);

  // Enforce ITR-1 data structure constraints when formData changes
  useEffect(() => {
    if (selectedITR === 'ITR-1' || selectedITR === 'ITR1') {
      setFormData(prev => {
        let updated = { ...prev };
        let hasChanges = false;

        // Ensure businessIncome is 0 (not an object)
        if (typeof updated.income?.businessIncome === 'object') {
          updated.income = { ...updated.income, businessIncome: 0 };
          hasChanges = true;
        }

        // Ensure professionalIncome is 0 (not an object)
        if (typeof updated.income?.professionalIncome === 'object') {
          updated.income = { ...updated.income, professionalIncome: 0 };
          hasChanges = true;
        }

        // Ensure capitalGains is 0 (not an object)
        if (typeof updated.income?.capitalGains === 'object') {
          updated.income = { ...updated.income, capitalGains: 0 };
          hasChanges = true;
        }

        // Ensure only one house property
        if (updated.income?.houseProperty?.properties?.length > 1) {
          updated.income = {
            ...updated.income,
            houseProperty: {
              ...updated.income.houseProperty,
              properties: updated.income.houseProperty.properties.slice(0, 1),
            },
          };
          hasChanges = true;
        }

        // Remove ITR-3/4 specific fields if they exist
        if (updated.balanceSheet !== undefined) {
          const { balanceSheet, ...rest } = updated;
          updated = rest;
          hasChanges = true;
        }
        if (updated.auditInfo !== undefined) {
          const { auditInfo, ...rest } = updated;
          updated = rest;
          hasChanges = true;
        }
        if (updated.scheduleFA !== undefined) {
          const { scheduleFA, ...rest } = updated;
          updated = rest;
          hasChanges = true;
        }

        return hasChanges ? updated : prev;
      });
    }

    // Enforce ITR-2 data structure constraints when formData changes
    if (selectedITR === 'ITR-2' || selectedITR === 'ITR2') {
      setFormData(prev => {
        let updated = { ...prev };
        let hasChanges = false;

        // Ensure businessIncome is 0 (not an object)
        if (typeof updated.income?.businessIncome === 'object') {
          updated.income = { ...updated.income, businessIncome: 0 };
          hasChanges = true;
        }

        // Ensure professionalIncome is 0 (not an object)
        if (typeof updated.income?.professionalIncome === 'object') {
          updated.income = { ...updated.income, professionalIncome: 0 };
          hasChanges = true;
        }

        // Ensure capitalGains is an object (not 0) for ITR-2
        if (typeof updated.income?.capitalGains === 'number' && updated.income.capitalGains === 0) {
          updated.income = {
            ...updated.income,
            capitalGains: {
              hasCapitalGains: false,
              stcgDetails: [],
              ltcgDetails: [],
            },
          };
          hasChanges = true;
        }

        // Ensure foreignIncome is an object (not undefined) for ITR-2
        if (updated.income?.foreignIncome === undefined) {
          updated.income = {
            ...updated.income,
            foreignIncome: {
              hasForeignIncome: false,
              foreignIncomeDetails: [],
            },
          };
          hasChanges = true;
        }

        // Ensure directorPartner is an object (not undefined) for ITR-2
        if (updated.income?.directorPartner === undefined) {
          updated.income = {
            ...updated.income,
            directorPartner: {
              isDirector: false,
              directorIncome: 0,
              isPartner: false,
              partnerIncome: 0,
            },
          };
          hasChanges = true;
        }

        // Remove ITR-3/4 specific fields if they exist
        if (updated.balanceSheet !== undefined) {
          const { balanceSheet, ...rest } = updated;
          updated = rest;
          hasChanges = true;
        }
        if (updated.auditInfo !== undefined) {
          const { auditInfo, ...rest } = updated;
          updated = rest;
          hasChanges = true;
        }
        if (updated.presumptiveIncome !== undefined) {
          const { presumptiveIncome, ...rest } = updated;
          updated = rest;
          hasChanges = true;
        }
        if (updated.goodsCarriage !== undefined) {
          const { goodsCarriage, ...rest } = updated;
          updated = rest;
          hasChanges = true;
        }

        return hasChanges ? updated : prev;
      });
    }

    // Enforce ITR-3 data structure constraints when formData changes
    if (selectedITR === 'ITR-3' || selectedITR === 'ITR3') {
      setFormData(prev => {
        let updated = { ...prev };
        let hasChanges = false;

        // Ensure businessIncome is an object with businesses array (not a number)
        if (typeof updated.income?.businessIncome === 'number') {
          updated.income = {
            ...updated.income,
            businessIncome: {
              businesses: [],
            },
          };
          hasChanges = true;
        }

        // Ensure professionalIncome is an object with professions array (not a number)
        if (typeof updated.income?.professionalIncome === 'number') {
          updated.income = {
            ...updated.income,
            professionalIncome: {
              professions: [],
            },
          };
          hasChanges = true;
        }

        // Ensure capitalGains is an object (not 0) for ITR-3
        if (typeof updated.income?.capitalGains === 'number' && updated.income.capitalGains === 0) {
          updated.income = {
            ...updated.income,
            capitalGains: {
              hasCapitalGains: false,
              stcgDetails: [],
              ltcgDetails: [],
            },
          };
          hasChanges = true;
        }

        // Ensure foreignIncome is an object (not undefined) for ITR-3
        if (updated.income?.foreignIncome === undefined) {
          updated.income = {
            ...updated.income,
            foreignIncome: {
              hasForeignIncome: false,
              foreignIncomeDetails: [],
            },
          };
          hasChanges = true;
        }

        // Ensure directorPartner is an object (not undefined) for ITR-3
        if (updated.income?.directorPartner === undefined) {
          updated.income = {
            ...updated.income,
            directorPartner: {
              isDirector: false,
              directorIncome: 0,
              isPartner: false,
              partnerIncome: 0,
            },
          };
          hasChanges = true;
        }

        // Ensure balanceSheet is an object (not undefined) for ITR-3
        if (updated.balanceSheet === undefined) {
          updated.balanceSheet = {
            hasBalanceSheet: false,
            assets: {
              currentAssets: { total: 0 },
              fixedAssets: { total: 0 },
              investments: 0,
              loansAdvances: 0,
              total: 0,
            },
            liabilities: {
              currentLiabilities: { total: 0 },
              longTermLiabilities: { total: 0 },
              capital: 0,
              total: 0,
            },
          };
          hasChanges = true;
        }

        // Ensure auditInfo is an object (not undefined) for ITR-3
        if (updated.auditInfo === undefined) {
          updated.auditInfo = {
            isAuditApplicable: false,
            auditReportNumber: '',
            auditReportDate: '',
            caDetails: {},
          };
          hasChanges = true;
        }

        // Remove ITR-4 specific fields if they exist
        if (updated.presumptiveIncome !== undefined) {
          const { presumptiveIncome, ...rest } = updated;
          updated = rest;
          hasChanges = true;
        }
        if (updated.goodsCarriage !== undefined) {
          const { goodsCarriage, ...rest } = updated;
          updated = rest;
          hasChanges = true;
        }
        if (updated.presumptiveBusiness !== undefined) {
          const { presumptiveBusiness, ...rest } = updated;
          updated = rest;
          hasChanges = true;
        }
        if (updated.presumptiveProfessional !== undefined) {
          const { presumptiveProfessional, ...rest } = updated;
          updated = rest;
          hasChanges = true;
        }

        return hasChanges ? updated : prev;
      });
    }

    // Enforce ITR-4 data structure constraints when formData changes
    if (selectedITR === 'ITR-4' || selectedITR === 'ITR4') {
      setFormData(prev => {
        let updated = { ...prev };
        let hasChanges = false;

        // Ensure businessIncome is 0 (not an object) for ITR-4
        if (typeof updated.income?.businessIncome === 'object') {
          updated.income = { ...updated.income, businessIncome: 0 };
          hasChanges = true;
        }

        // Ensure professionalIncome is 0 (not an object) for ITR-4
        if (typeof updated.income?.professionalIncome === 'object') {
          updated.income = { ...updated.income, professionalIncome: 0 };
          hasChanges = true;
        }

        // Ensure capitalGains is 0 (not an object) for ITR-4
        if (typeof updated.income?.capitalGains === 'object') {
          updated.income = { ...updated.income, capitalGains: 0 };
          hasChanges = true;
        }

        // Ensure foreignIncome is undefined (not an object) for ITR-4
        if (updated.income?.foreignIncome !== undefined) {
          const { foreignIncome, ...restIncome } = updated.income;
          updated.income = restIncome;
          hasChanges = true;
        }

        // Ensure directorPartner is undefined (not an object) for ITR-4
        if (updated.income?.directorPartner !== undefined) {
          const { directorPartner, ...restIncome } = updated.income;
          updated.income = restIncome;
          hasChanges = true;
        }

        // Ensure presumptiveBusiness is an object (not undefined) for ITR-4
        if (updated.income?.presumptiveBusiness === undefined) {
          updated.income = {
            ...updated.income,
            presumptiveBusiness: {
              hasPresumptiveBusiness: false,
              grossReceipts: 0,
              presumptiveRate: 8,
              presumptiveIncome: 0,
              optedOut: false,
            },
          };
          hasChanges = true;
        }

        // Ensure presumptiveProfessional is an object (not undefined) for ITR-4
        if (updated.income?.presumptiveProfessional === undefined) {
          updated.income = {
            ...updated.income,
            presumptiveProfessional: {
              hasPresumptiveProfessional: false,
              grossReceipts: 0,
              presumptiveRate: 50,
              presumptiveIncome: 0,
              optedOut: false,
            },
          };
          hasChanges = true;
        }

        // Remove ITR-3 specific fields if they exist
        if (updated.balanceSheet !== undefined) {
          const { balanceSheet, ...rest } = updated;
          updated = rest;
          hasChanges = true;
        }
        if (updated.auditInfo !== undefined) {
          const { auditInfo, ...rest } = updated;
          updated = rest;
          hasChanges = true;
        }
        if (updated.scheduleFA !== undefined) {
          const { scheduleFA, ...rest } = updated;
          updated = rest;
          hasChanges = true;
        }

        return hasChanges ? updated : prev;
      });
    }
  }, [selectedITR, formData?.income?.businessIncome, formData?.income?.professionalIncome, formData?.income?.capitalGains, formData?.income?.houseProperty?.properties?.length, formData?.income?.foreignIncome, formData?.income?.directorPartner, formData?.balanceSheet, formData?.auditInfo, formData?.income?.presumptiveBusiness, formData?.income?.presumptiveProfessional]);
  const [regimeComparison, setRegimeComparison] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [uploadedData, setUploadedData] = useState(null); // Track uploaded/scanned data

  // Auto-fill state
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [prefetchSources, setPrefetchSources] = useState({});
  const [autoFilledFields, setAutoFilledFields] = useState({});
  const [fieldSources, setFieldSources] = useState({}); // Track data source for each field
  const [fieldVerificationStatuses, setFieldVerificationStatuses] = useState({}); // Track verification status per field
  const [autoPopulationSummary, setAutoPopulationSummary] = useState(null);

  // AI Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // Enhanced auto-population on page load
  useEffect(() => {
    const prefetchData = async () => {
      const pan = selectedPerson?.panNumber || formData.personalInfo.pan;
      if (!pan) return;

      setIsPrefetching(true);
      try {
        // Collect data from all available sources
        const sources = {
          verified: {},
          previousYear: {},
          form16: {},
          ais: {},
          form26as: {},
          eri: {},
          userProfile: {},
        };

        // 1. Get AIS/26AS data via prefetch
        try {
          const prefetchResult = await itrAutoFillService.prefetchData(pan, assessmentYear);
          if (prefetchResult.data) {
            sources.ais = { income: prefetchResult.data.income, taxesPaid: prefetchResult.data.taxesPaid };
            sources.form26as = { income: prefetchResult.data.income, taxesPaid: prefetchResult.data.taxesPaid };
          }
          if (prefetchResult.sources) {
            setPrefetchSources(prefetchResult.sources);
          }
        } catch (error) {
          enterpriseLogger.warn('AIS/26AS prefetch failed', { error });
        }

        // 2. Get previous year data if available
        if (dataSource === 'previous-year' || copiedFromPreviousYear) {
          try {
            const previousYearService = (await import('../../features/itr/services/previous-year.service')).default;
            const previousYearData = await previousYearService.getPreviousYearData(location.state?.copyFilingId);
            if (previousYearData) {
              sources.previousYear = {
                personalInfo: previousYearData.personalInfo || previousYearData.personal_info,
                income: previousYearData.income,
                deductions: previousYearData.deductions,
                taxesPaid: previousYearData.taxesPaid || previousYearData.taxes_paid,
                bankDetails: previousYearData.bankDetails || previousYearData.bank_details,
              };
            }
          } catch (error) {
            enterpriseLogger.warn('Previous year data fetch failed', { error });
          }
        }

        // 3. Get user profile data
        // Merge selectedPerson with user profile data (email from user profile)
        if (selectedPerson || user) {
          sources.userProfile = {
            personalInfo: {
              name: selectedPerson?.name || user?.firstName || user?.name || '',
              pan: selectedPerson?.panNumber || selectedPerson?.pan || '',
              // Email from user profile (Google OAuth) or selectedPerson
              email: user?.email || selectedPerson?.email || '',
              phone: selectedPerson?.phone || user?.phone || '',
              dateOfBirth: user?.dateOfBirth || selectedPerson?.dateOfBirth || '',
            },
          };
        }

        // 4. Get verified data from verification result
        if (verificationResult) {
          sources.verified = {
            personalInfo: {
              pan: verificationResult.pan,
              name: verificationResult.name,
            },
          };
        }

        // Use enhanced auto-population service
        const result = autoPopulationService.autoPopulateWithPriority(
          sources,
          formData,
          fieldVerificationStatuses,
        );

        // Log auto-population results for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('[ITRComputation] Auto-population result:', {
            sources,
            personalInfoBefore: formData.personalInfo,
            personalInfoAfter: result.formData.personalInfo,
            autoFilledFields: result.autoFilledFields,
            fieldSources: result.fieldSources,
          });
        }

        setFormData(result.formData);
        setAutoFilledFields(result.autoFilledFields);
        setFieldSources(result.fieldSources);

        // Update verification statuses
        const newVerificationStatuses = { ...fieldVerificationStatuses };
        Object.keys(result.fieldSources).forEach((section) => {
          if (!newVerificationStatuses[section]) {
            newVerificationStatuses[section] = {};
          }
          Object.keys(result.fieldSources[section]).forEach((field) => {
            const sourceInfo = result.fieldSources[section][field];
            if (sourceInfo.source === 'verified') {
              newVerificationStatuses[section][field] = VERIFICATION_STATUS.VERIFIED;
            } else if (['form16', 'ais', 'form26as', 'previous_year'].includes(sourceInfo.source)) {
              newVerificationStatuses[section][field] = VERIFICATION_STATUS.AUTO_FILLED;
            }
          });
        });
        setFieldVerificationStatuses(newVerificationStatuses);

        // Generate summary
        const summary = autoPopulationService.getAutoPopulationSummary(
          result.autoFilledFields,
          result.fieldSources,
        );
        setAutoPopulationSummary(summary);

        toast.success(`Auto-filled ${summary.autoFilledCount} fields from ${Object.keys(summary.bySource).length} sources`);
      } catch (error) {
        enterpriseLogger.error('Auto-population failed', { error });
        toast.error('Auto-fill failed: ' + error.message);
      } finally {
        setIsPrefetching(false);
      }
    };

    prefetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPerson?.panNumber, assessmentYear, dataSource, copiedFromPreviousYear]);

  // Load verified data from verification result
  useEffect(() => {
    if (verificationResult) {
      setFormData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          pan: verificationResult.pan || prev.personalInfo.pan,
          name: verificationResult.name || prev.personalInfo.name,
        },
      }));

      // Mark PAN and name as verified
      setFieldVerificationStatuses(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          pan: VERIFICATION_STATUS.VERIFIED,
          name: VERIFICATION_STATUS.VERIFIED,
        },
      }));

      // Set field sources
      setFieldSources(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          pan: { source: 'verified', priority: 10, timestamp: Date.now() },
          name: { source: 'verified', priority: 10, timestamp: Date.now() },
        },
      }));
    }
  }, [verificationResult]);

  // Validate selected person still exists (handle family member deletion)
  useEffect(() => {
    const validateSelectedPerson = async () => {
      if (!selectedPerson || selectedPerson.type !== 'family') return;

      try {
        const memberService = (await import('../../services/memberService')).default;
        const response = await memberService.getMembers();
        const members = response.data?.members || [];
        const memberExists = members.some(m => m.id === selectedPerson.id || m.id === selectedPerson.member?.id);

        if (!memberExists) {
          toast.error('The selected family member no longer exists. Please select a different person.');
          navigate('/itr/select-person');
        }
      } catch (error) {
        enterpriseLogger.error('Failed to validate selected person', { error });
        // Don't block user if validation fails, but log it
      }
    };

    validateSelectedPerson();
  }, [selectedPerson, navigate]);

  // Load draft on component mount
  // Persistence Hook
  const {
    isSaving: isSavingDraft,
    // Rename to avoid collision if local state exists, or replace local state usage
    isPrefetching: isPrefetchingHook,
    handleSaveDraft,
    loadDraft,
  } = useITRPersistence({
    formData,
    setFormData,
    selectedITR,
    setSelectedITR,
    assessmentYear,
    setAssessmentYear,
    taxRegime,
    setTaxRegime,
    draftId: effectiveDraftId || draftIdLocal,
    setDraftId: setDraftIdLocal,
    filingId: effectiveFilingId || filingIdLocal,
    setFilingId: setFilingIdLocal,
    taxComputation,
    verificationStatuses: fieldVerificationStatuses,
    setFieldVerificationStatuses,
    user,
  });

  // Sync hook loading state with local state if needed, or use hook state directly
  // For now, let's just trigger load
  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  /* Refactored to useITRPersistence
  useEffect(() => {
    const loadDraft = async () => {
      // If user is explicitly starting a new computation journey (e.g., coming from /itr/determine),
      // do NOT overwrite their chosen ITR with stale localStorage state from a previous draft.
      // LocalStorage restore should primarily serve refresh/resume (draftId present).
      const hasExplicitStartState = !!(
        location.state?.selectedPerson &&
        (location.state?.selectedITR ||
          location.state?.recommendedITR ||
          location.state?.dataSource ||
          location.state?.entryPoint)
      );
      const allowLocalStorageRestore = !!draftId || !hasExplicitStartState;
      // ALWAYS try to load from localStorage first (for page refresh recovery)
      // Check both draftId-specific and 'current' localStorage keys
      const localStorageKeys = allowLocalStorageRestore
        ? (draftId ? [`itr_draft_${draftId}`, 'itr_draft_current'] : ['itr_draft_current'])
        : [];
        let savedDraft = null;
      let savedDraftKey = null;
        // Try to find saved draft in localStorage
      for (const key of localStorageKeys) {
        const parsed = safeLocalStorageGet(key, null);
        if (parsed) {
          // Prefer draft with actual draftId over 'current'
          if (!savedDraft || (parsed.draftId && parsed.draftId !== 'current')) {
            savedDraft = parsed;
            savedDraftKey = key;
          }
        }
      }
      // Restore from localStorage if found
      if (savedDraft && savedDraft.formData) {
        try {
          setFormData(savedDraft.formData);
          if (savedDraft.assessmentYear) setAssessmentYear(savedDraft.assessmentYear);
          if (savedDraft.taxRegime) setTaxRegime(savedDraft.taxRegime);
          if (savedDraft.selectedITR) setSelectedITR(savedDraft.selectedITR);
          // If localStorage draft has a real draftId, update URL
          if (savedDraft.draftId && savedDraft.draftId !== 'current') {
            navigate(`/itr/computation?draftId=${savedDraft.draftId}`, { replace: true });
            toast.success('Draft restored from local storage', { icon: '💾', duration: 2000 });
          } else if (!draftId) {
            // Show restoration indicator even if no draftId yet
            toast('Draft data restored from local storage', { icon: '💾', duration: 2000 });
          }
        } catch (e) {
          enterpriseLogger.warn('Failed to restore draft from localStorage', { error: e });
        }
      }
      // If we have a draftId, also try to load from backend
      if (!draftId) return;
      setIsPrefetching(true); // Show loading state
      try {
        // Use FormDataService to load draft data
        const loadedFormData = await formDataService.loadFormData(draftId, false);
        // Don't use cache on initial load
        // Also load verification statuses
        const loadedVerificationStatuses = await verificationStatusService.loadVerificationStatuses(draftId);

        if (loadedFormData && Object.keys(loadedFormData).length > 0) {
          // Restore form data
          setFormData(prev => ({
            ...prev,
            ...loadedFormData,
          }));

          // Restore verification statuses
          if (loadedVerificationStatuses && Object.keys(loadedVerificationStatuses).length > 0) {
            setFieldVerificationStatuses(loadedVerificationStatuses);
          }

          // Also get draft metadata from API for assessment year, regime, etc.
          const draftResponse = await itrService.getDraftById(draftId);
          const parsedData = loadedFormData;

          // Declare variables in outer scope for use in draftToSave
          let restoredYear = assessmentYear;
          let restoredRegime = taxRegime;
          let restoredITR = selectedITR;

          // Restore assessment year if available
          if (draftResponse.draft?.assessmentYear || parsedData.assessmentYear) {
            restoredYear = draftResponse.draft?.assessmentYear || parsedData.assessmentYear;
            setAssessmentYear(restoredYear);
          }

          // Restore tax regime if available
          if (draftResponse.draft?.taxRegime || parsedData.taxRegime) {
            restoredRegime = draftResponse.draft?.taxRegime || parsedData.taxRegime;
            setTaxRegime(restoredRegime);
          }

          // Restore selected ITR if available
          if (draftResponse.draft?.itrType || parsedData.selectedITR) {
            restoredITR = draftResponse.draft?.itrType || parsedData.selectedITR;
            setSelectedITR(restoredITR);
            // Ensure ITR-1 data structure is correct when loading
            if (restoredITR === 'ITR-1' || restoredITR === 'ITR1') {
              setFormData(prev => {
                const updated = { ...prev };
                // Ensure businessIncome is 0 (not an object)
                if (typeof updated.income?.businessIncome === 'object') {
                  updated.income.businessIncome = 0;
                }
                // Ensure professionalIncome is 0 (not an object)
                if (typeof updated.income?.professionalIncome === 'object') {
                  updated.income.professionalIncome = 0;
                }
                // Ensure capitalGains is 0 (not an object)
                if (typeof updated.income?.capitalGains === 'object') {
                  updated.income.capitalGains = 0;
                }
                // Ensure only one house property
                if (updated.income?.houseProperty?.properties?.length > 1) {
                  updated.income.houseProperty.properties = updated.income.houseProperty.properties.slice(0, 1);
                }
                // Remove ITR-3/4 specific fields
                delete updated.balanceSheet;
                delete updated.auditInfo;
                delete updated.scheduleFA;
                return updated;
              });
            }

            // Ensure ITR-2 data structure is correct when loading
            if (restoredITR === 'ITR-2' || restoredITR === 'ITR2') {
              setFormData(prev => {
                const updated = { ...prev };
                // Ensure businessIncome is 0 (not an object)
                if (typeof updated.income?.businessIncome === 'object') {
                  updated.income.businessIncome = 0;
                }
                // Ensure professionalIncome is 0 (not an object)
                if (typeof updated.income?.professionalIncome === 'object') {
                  updated.income.professionalIncome = 0;
                }
                // Ensure capitalGains is an object (not 0)
                if (typeof updated.income?.capitalGains === 'number' && updated.income.capitalGains === 0) {
                  updated.income.capitalGains = {
                    hasCapitalGains: false,
                    stcgDetails: [],
                    ltcgDetails: [],
                  };
                }
                // Ensure foreignIncome is an object (not undefined)
                if (updated.income?.foreignIncome === undefined) {
                  updated.income.foreignIncome = {
                    hasForeignIncome: false,
                    foreignIncomeDetails: [],
                  };
                }
                // Ensure directorPartner is an object (not undefined)
                if (updated.income?.directorPartner === undefined) {
                  updated.income.directorPartner = {
                    isDirector: false,
                    directorIncome: 0,
                    isPartner: false,
                    partnerIncome: 0,
                  };
                }
                // Remove ITR-3/4 specific fields
                delete updated.balanceSheet;
                delete updated.auditInfo;
                delete updated.presumptiveIncome;
                delete updated.goodsCarriage;
                return updated;
              });
            }

            // Ensure ITR-3 data structure is correct when loading
            if (restoredITR === 'ITR-3' || restoredITR === 'ITR3') {
              setFormData(prev => {
                const updated = { ...prev };
                // Ensure businessIncome is an object (not a number)
                if (typeof updated.income?.businessIncome === 'number') {
                  updated.income.businessIncome = {
                    businesses: [],
                  };
                }
                // Ensure professionalIncome is an object (not a number)
                if (typeof updated.income?.professionalIncome === 'number') {
                  updated.income.professionalIncome = {
                    professions: [],
                  };
                }
                // Ensure capitalGains is an object (not 0)
                if (typeof updated.income?.capitalGains === 'number' && updated.income.capitalGains === 0) {
                  updated.income.capitalGains = {
                    hasCapitalGains: false,
                    stcgDetails: [],
                    ltcgDetails: [],
                  };
                }
                // Ensure foreignIncome is an object (not undefined)
                if (updated.income?.foreignIncome === undefined) {
                  updated.income.foreignIncome = {
                    hasForeignIncome: false,
                    foreignIncomeDetails: [],
                  };
                }
                // Ensure directorPartner is an object (not undefined)
                if (updated.income?.directorPartner === undefined) {
                  updated.income.directorPartner = {
                    isDirector: false,
                    directorIncome: 0,
                    isPartner: false,
                    partnerIncome: 0,
                  };
                }
                // Ensure balanceSheet is an object (not undefined)
                if (updated.balanceSheet === undefined) {
                  updated.balanceSheet = {
                    hasBalanceSheet: false,
                    assets: {
                      currentAssets: { total: 0 },
                      fixedAssets: { total: 0 },
                      investments: 0,
                      loansAdvances: 0,
                      total: 0,
                    },
                    liabilities: {
                      currentLiabilities: { total: 0 },
                      longTermLiabilities: { total: 0 },
                      capital: 0,
                      total: 0,
                    },
                  };
                }
                // Ensure auditInfo is an object (not undefined)
                if (updated.auditInfo === undefined) {
                  updated.auditInfo = {
                    isAuditApplicable: false,
                    auditReportNumber: '',
                    auditReportDate: '',
                    caDetails: {},
                  };
                }
                // Remove ITR-4 specific fields
                delete updated.presumptiveIncome;
                delete updated.goodsCarriage;
                delete updated.presumptiveBusiness;
                delete updated.presumptiveProfessional;
                return updated;
              });
            }

            // Ensure ITR-4 data structure is correct when loading
            if (restoredITR === 'ITR-4' || restoredITR === 'ITR4') {
              setFormData(prev => {
                const updated = { ...prev };
                // Ensure businessIncome is 0 (not an object)
                if (typeof updated.income?.businessIncome === 'object') {
                  updated.income.businessIncome = 0;
                }
                // Ensure professionalIncome is 0 (not an object)
                if (typeof updated.income?.professionalIncome === 'object') {
                  updated.income.professionalIncome = 0;
                }
                // Ensure capitalGains is 0 (not an object)
                if (typeof updated.income?.capitalGains === 'object') {
                  updated.income.capitalGains = 0;
                }
                // Ensure foreignIncome is undefined
                if (updated.income?.foreignIncome !== undefined) {
                  const { foreignIncome, ...restIncome } = updated.income;
                  updated.income = restIncome;
                }
                // Ensure directorPartner is undefined
                if (updated.income?.directorPartner !== undefined) {
                  const { directorPartner, ...restIncome } = updated.income;
                  updated.income = restIncome;
                }
                // Ensure presumptiveBusiness is an object (not undefined)
                if (updated.income?.presumptiveBusiness === undefined) {
                  updated.income.presumptiveBusiness = {
                    hasPresumptiveBusiness: false,
                    grossReceipts: 0,
                    presumptiveRate: 8,
                    presumptiveIncome: 0,
                    optedOut: false,
                  };
                }
                // Ensure presumptiveProfessional is an object (not undefined)
                if (updated.income?.presumptiveProfessional === undefined) {
                  updated.income.presumptiveProfessional = {
                    hasPresumptiveProfessional: false,
                    grossReceipts: 0,
                    presumptiveRate: 50,
                    presumptiveIncome: 0,
                    optedOut: false,
                  };
                }
                // Remove ITR-3 specific fields
                delete updated.balanceSheet;
                delete updated.auditInfo;
                delete updated.scheduleFA;
                return updated;
              });
            }
          }

          // Save to localStorage for page refresh recovery
          const draftToSave = {
            formData: parsedData,
            assessmentYear: restoredYear,
            taxRegime: restoredRegime,
            selectedITR: restoredITR,
            draftId,
            savedAt: new Date().toISOString(),
          };
          safeLocalStorageSet(`itr_draft_${draftId}`, draftToSave);
          toast.success('Draft loaded successfully');
        } else {
          toast.error('Draft data not found');
        }
      } catch (error) {
        enterpriseLogger.error('Failed to load draft', { error });
        toast.error('Failed to load draft: ' + (error.message || 'Unknown error'));
      } finally {
        setIsPrefetching(false);
      }
    };
    loadDraft();
  }, [draftId]); */

  // Tax computation loading state
  const [isComputingTax, setIsComputingTax] = useState(false);

  // Client-side tax calculation (immediate fallback while server computation is in progress)
  const calculateClientSideTax = useCallback((data, regime, itrType = selectedITR) => {
    if (!data || !data.income) return null;

    const income = data.income || {};
    const deductions = data.deductions || {};
    const taxesPaid = data.taxesPaid || {};

    // Calculate gross income - match the same logic as grossIncome useMemo
    const salaryIncome = parseFloat(income.salary || 0);

    // Business income (excluded for ITR-1)
    let businessIncome = 0;
    if (itrType !== 'ITR-1' && itrType !== 'ITR1') {
      if (typeof income.businessIncome === 'object' && income.businessIncome?.businesses) {
        businessIncome = income.businessIncome.businesses.reduce((sum, biz) =>
          sum + (parseFloat(biz.pnl?.netProfit || biz.netProfit || 0)), 0);
      } else {
        businessIncome = parseFloat(income.businessIncome || 0);
      }
    }

    // Professional income (excluded for ITR-1, ITR-2, and ITR-4, included for ITR-3)
    let professionalIncome = 0;
    if (itrType !== 'ITR-1' && itrType !== 'ITR1' && itrType !== 'ITR-2' && itrType !== 'ITR2' && itrType !== 'ITR-4' && itrType !== 'ITR4') {
      if (typeof income.professionalIncome === 'object' && income.professionalIncome?.professions) {
        professionalIncome = income.professionalIncome.professions.reduce((sum, prof) =>
          sum + (parseFloat(prof.pnl?.netIncome || prof.netIncome || prof.netProfit || 0)), 0);
      } else {
        professionalIncome = parseFloat(income.professionalIncome || 0);
      }
    }

    // House property income
    let housePropertyIncome = 0;
    if (typeof income.houseProperty === 'object' && income.houseProperty?.properties) {
      housePropertyIncome = income.houseProperty.properties.reduce((sum, p) => {
        const rental = parseFloat(p.annualRentalIncome) || 0;
        const taxes = parseFloat(p.municipalTaxes) || 0;
        const interest = parseFloat(p.interestOnLoan) || 0;
        return sum + Math.max(0, rental - taxes - interest);
      }, 0);
    } else {
      housePropertyIncome = parseFloat(income.houseProperty || 0);
    }

    // Capital gains (excluded for ITR-1 and ITR-4, included for ITR-2 and ITR-3)
    let capitalGains = 0;
    if (itrType !== 'ITR-1' && itrType !== 'ITR1' && itrType !== 'ITR-4' && itrType !== 'ITR4') {
      if (typeof income.capitalGains === 'object' && income.capitalGains?.stcgDetails) {
        capitalGains = (income.capitalGains.stcgDetails || []).reduce((sum, e) => sum + (parseFloat(e.gainAmount) || 0), 0) +
          (income.capitalGains.ltcgDetails || []).reduce((sum, e) => sum + (parseFloat(e.gainAmount) || 0), 0);
      } else {
        capitalGains = parseFloat(income.capitalGains || 0);
      }
    }

    // Other sources income (from OtherSourcesForm - structured format)
    let otherSourcesIncome = 0;
    if (typeof income.otherSources === 'object' && income.otherSources) {
      otherSourcesIncome = parseFloat(income.otherSources.totalOtherSourcesIncome || 0) ||
        (parseFloat(income.otherSources.totalInterestIncome || 0) +
          parseFloat(income.otherSources.totalOtherIncome || 0));
    } else {
      // Fallback to legacy otherIncome field for backward compatibility
      otherSourcesIncome = parseFloat(income.otherIncome || 0);
    }

    // Also check data.otherSources (root level) for backward compatibility
    if (data?.otherSources && typeof data.otherSources === 'object') {
      const rootOtherSourcesTotal = parseFloat(data.otherSources.totalOtherSourcesIncome || 0) ||
        (parseFloat(data.otherSources.totalInterestIncome || 0) +
          parseFloat(data.otherSources.totalOtherIncome || 0));
      // Only add if not already included via income.otherSources
      if (!income.otherSources || !income.otherSources.totalOtherSourcesIncome) {
        otherSourcesIncome += rootOtherSourcesTotal;
      }
    }

    // Foreign income (excluded for ITR-1 and ITR-4, included for ITR-2 and ITR-3)
    const foreignIncome = (itrType !== 'ITR-1' && itrType !== 'ITR1' && itrType !== 'ITR-4' && itrType !== 'ITR4')
      ? (income.foreignIncome?.foreignIncomeDetails || []).reduce((sum, e) =>
        sum + (parseFloat(e.amountInr) || 0), 0)
      : 0;

    // Director/Partner income (excluded for ITR-1 and ITR-4, included for ITR-2 and ITR-3)
    const directorPartnerIncome = (itrType !== 'ITR-1' && itrType !== 'ITR1' && itrType !== 'ITR-4' && itrType !== 'ITR4')
      ? (parseFloat(income.directorPartner?.directorIncome || 0) +
        parseFloat(income.directorPartner?.partnerIncome || 0))
      : 0;

    // Presumptive business income (ITR-4 only)
    let presumptiveBusinessIncome = 0;
    if (itrType === 'ITR-4' || itrType === 'ITR4') {
      const presumptiveBusiness = income.presumptiveBusiness || {};
      if (presumptiveBusiness.hasPresumptiveBusiness && !presumptiveBusiness.optedOut) {
        const presumptiveRate = presumptiveBusiness.presumptiveRate || 8;
        presumptiveBusinessIncome = (presumptiveBusiness.grossReceipts || 0) * (presumptiveRate / 100);
      } else if (presumptiveBusiness.hasPresumptiveBusiness && presumptiveBusiness.optedOut) {
        presumptiveBusinessIncome = parseFloat(presumptiveBusiness.actualProfit || 0);
      }
    }

    // Presumptive professional income (ITR-4 only)
    let presumptiveProfessionalIncome = 0;
    if (itrType === 'ITR-4' || itrType === 'ITR4') {
      const presumptiveProfessional = income.presumptiveProfessional || {};
      if (presumptiveProfessional.hasPresumptiveProfessional && !presumptiveProfessional.optedOut) {
        const presumptiveRate = presumptiveProfessional.presumptiveRate || 50;
        presumptiveProfessionalIncome = (presumptiveProfessional.grossReceipts || 0) * (presumptiveRate / 100);
      } else if (presumptiveProfessional.hasPresumptiveProfessional && presumptiveProfessional.optedOut) {
        presumptiveProfessionalIncome = parseFloat(presumptiveProfessional.actualIncome || 0);
      }
    }

    // Goods carriage income (ITR-4 only, Section 44AE)
    let goodsCarriageIncome = 0;
    if (itrType === 'ITR-4' || itrType === 'ITR4') {
      const goodsCarriage = data.goodsCarriage || {};
      if (goodsCarriage.hasGoodsCarriage) {
        const heavyVehicles = goodsCarriage.heavyVehicles || 0;
        const lightVehicles = goodsCarriage.lightVehicles || 0;
        // Heavy vehicle: ₹1,000 per ton per month, Light vehicle: ₹7,500 per vehicle per month
        const heavyVehicleIncome = (heavyVehicles * 1000 * 12); // Assuming average tonnage calculation
        const lightVehicleIncome = (lightVehicles * 7500 * 12);
        goodsCarriageIncome = heavyVehicleIncome + lightVehicleIncome;
      }
    }

    const grossIncome = salaryIncome + businessIncome + professionalIncome + housePropertyIncome +
      capitalGains + otherSourcesIncome + foreignIncome + directorPartnerIncome +
      presumptiveBusinessIncome + presumptiveProfessionalIncome + goodsCarriageIncome;

    // Calculate deductions
    const totalDeductions = regime === 'old'
      ? (parseFloat(deductions.section80C || 0) +
        parseFloat(deductions.section80D || 0) +
        parseFloat(deductions.section80E || 0) +
        parseFloat(deductions.section80G || 0) +
        parseFloat(deductions.section80TTA || 0) +
        parseFloat(deductions.section80TTB || 0) +
        Object.values(deductions.otherDeductions || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0))
      : 50000; // Standard deduction for new regime

    const taxableIncome = Math.max(0, grossIncome - totalDeductions);

    // Calculate tax based on slabs
    let taxLiability = 0;
    if (taxableIncome > 0) {
      if (taxableIncome <= 250000) {
        taxLiability = 0;
      } else if (taxableIncome <= 500000) {
        taxLiability = (taxableIncome - 250000) * 0.05;
      } else if (taxableIncome <= 1000000) {
        taxLiability = 12500 + (taxableIncome - 500000) * 0.2;
      } else {
        taxLiability = 112500 + (taxableIncome - 1000000) * 0.3;
      }
    }

    // Add 4% cess
    const totalTax = taxLiability + (taxLiability * 0.04);

    const totalTaxesPaid = (parseFloat(taxesPaid.tds || 0) +
      parseFloat(taxesPaid.advanceTax || 0) +
      parseFloat(taxesPaid.selfAssessmentTax || 0));

    return {
      grossIncome,
      totalDeductions,
      taxableIncome,
      taxLiability,
      totalTax,
      taxesPaid: totalTaxesPaid,
      refundOrPayable: totalTaxesPaid - totalTax,
    };
  }, [selectedITR]);

  // Compute tax function
  const handleComputeTax = useCallback(async () => {
    if (!formData.personalInfo?.pan || !formData.income) {
      // If no PAN or income, clear tax computation
      setTaxComputation(null);
      return;
    }

    trackEvent('itr_compute_clicked', {
      role: user?.role || null,
      itrType: selectedITR,
      draftId: effectiveDraftId || null,
      filingId: effectiveFilingId || null,
      taxRegime,
      assessmentYear,
    });

    // Immediately update with client-side calculation for instant feedback
    const clientSideTax = calculateClientSideTax(formData, taxRegime, selectedITR);
    if (clientSideTax) {
      setTaxComputation({
        ...clientSideTax,
        isClientSide: true, // Flag to indicate this is client-side calculation
      });
    }

    setIsComputingTax(true);
    try {
      const taxResult = await itrService.computeTax(
        formData,
        taxRegime,
        assessmentYear,
      );

      if (taxResult.success && taxResult.data) {
        setTaxComputation({
          ...taxResult.data,
          isClientSide: false, // Server-side calculation
        });
        trackEvent('itr_compute_success', {
          role: user?.role || null,
          itrType: selectedITR,
          draftId: effectiveDraftId || null,
          filingId: effectiveFilingId || null,
          totalTax: taxResult.data.totalTax ?? null,
          refund: taxResult.data.refund ?? null,
          taxRegime,
          assessmentYear,
        });

        // Also get regime comparison if available
        if (taxResult.data.comparison) {
          setRegimeComparison(taxResult.data.comparison);
          setShowComparison(true);
        }
      }
    } catch (error) {
      enterpriseLogger.error('Tax computation failed', { error });
      // Keep client-side calculation if server fails
      // Don't show error toast - computation happens frequently
    } finally {
      setIsComputingTax(false);
    }
  }, [formData, taxRegime, assessmentYear, calculateClientSideTax]);

  // Real-time validation on formData changes
  useEffect(() => {
    if (!formData || isReadOnly) return;

    // Map formData section names to validation engine section names
    const sectionMapping = {
      personalInfo: 'personal_info',
      income: 'income',
      deductions: 'deductions',
      taxesPaid: 'taxes_paid',
      businessIncome: 'businessIncome',
      professionalIncome: 'professionalIncome',
      balanceSheet: 'balanceSheet',
      auditInfo: 'auditInfo',
    };

    // Validate all sections
    const validateAllSections = async () => {
      const allErrors = {};
      const sectionsToValidate = ['personalInfo', 'income', 'deductions', 'taxesPaid'];
      if (selectedITR === 'ITR-3' || selectedITR === 'ITR3') {
        sectionsToValidate.push('businessIncome', 'professionalIncome', 'balanceSheet', 'auditInfo');
      }

      for (const sectionId of sectionsToValidate) {
        const validationSectionId = sectionMapping[sectionId] || sectionId;
        const sectionData = formData[sectionId] || {};
        try {
          const result = validationEngine.validateSection(validationSectionId, sectionData, formData);
          if (!result.isValid && result.errors) {
            allErrors[sectionId] = result.errors;
          }
        } catch (error) {
          enterpriseLogger.warn('Validation error for section', { sectionId, error });
        }
      }

      // Cross-section validation
      const income = formData.income || {};
      const deductions = formData.deductions || {};

      // Calculate total income
      let totalIncome = 0;
      totalIncome += parseFloat(income.salary) || 0;
      totalIncome += parseFloat(income.otherIncome) || 0;
      if (typeof income.businessIncome === 'number') {
        totalIncome += income.businessIncome;
      }
      if (typeof income.professionalIncome === 'number') {
        totalIncome += income.professionalIncome;
      }
      if (typeof income.houseProperty === 'number') {
        totalIncome += income.houseProperty;
      }
      if (typeof income.capitalGains === 'number') {
        totalIncome += income.capitalGains;
      }

      // Calculate total deductions
      let totalDeductions = 0;
      totalDeductions += parseFloat(deductions.section80C) || 0;
      totalDeductions += parseFloat(deductions.section80D) || 0;
      totalDeductions += parseFloat(deductions.section80G) || 0;
      totalDeductions += parseFloat(deductions.section80TTA) || 0;
      totalDeductions += parseFloat(deductions.section80TTB) || 0;
      totalDeductions += Object.values(deductions.otherDeductions || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

      // Validate deductions don't exceed income
      if (totalDeductions > totalIncome && totalIncome > 0) {
        allErrors.deductions = {
          ...allErrors.deductions,
          total: `Total deductions (₹${totalDeductions.toLocaleString('en-IN')}) cannot exceed total income (₹${totalIncome.toLocaleString('en-IN')})`,
        };
      }

      // Validate negative income values
      if (totalIncome < 0) {
        allErrors.income = {
          ...allErrors.income,
          total: 'Total income cannot be negative',
        };
      }

      // Validate negative deduction values
      if (totalDeductions < 0) {
        allErrors.deductions = {
          ...allErrors.deductions,
          total: 'Total deductions cannot be negative',
        };
      }

      // Validate PAN format if present
      if (formData.personalInfo?.pan) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(formData.personalInfo.pan)) {
          allErrors.personalInfo = {
            ...allErrors.personalInfo,
            pan: 'PAN must be in format: ABCDE1234F',
          };
        }
      }

      // Validate assessment year format
      if (assessmentYear && !/^\d{4}-\d{2}$/.test(assessmentYear)) {
        allErrors.personalInfo = {
          ...allErrors.personalInfo,
          assessmentYear: 'Assessment year must be in format: YYYY-YY (e.g., 2024-25)',
        };
      }

      // ITR-1 specific validations
      if (selectedITR === 'ITR-1' || selectedITR === 'ITR1') {
        // Validate total income ≤ ₹50 lakhs
        if (totalIncome > 5000000) {
          allErrors.income = {
            ...allErrors.income,
            total: 'ITR-1 is applicable only for total income up to ₹50 lakhs. Please use ITR-2.',
          };
        }

        // Validate agricultural income ≤ ₹5,000
        const agriIncome = formData.exemptIncome?.agriculturalIncome?.netAgriculturalIncome
          || formData.exemptIncome?.netAgriculturalIncome
          || formData.agriculturalIncome
          || 0;
        if (agriIncome > 5000) {
          allErrors.exemptIncome = {
            ...allErrors.exemptIncome,
            agriculturalIncome: `Agricultural income (₹${agriIncome.toLocaleString('en-IN')}) exceeds ₹5,000 limit. ITR-1 is not permitted. You must file ITR-2.`,
          };
        }

        // Validate no business income
        const businessIncome = typeof income.businessIncome === 'number' ? income.businessIncome : 0;
        if (businessIncome > 0) {
          allErrors.income = {
            ...allErrors.income,
            businessIncome: 'Business income cannot be declared in ITR-1. Consider ITR-3 or ITR-4.',
          };
        }

        // Validate no capital gains
        const capitalGains = typeof income.capitalGains === 'number' ? income.capitalGains : 0;
        if (capitalGains > 0) {
          allErrors.income = {
            ...allErrors.income,
            capitalGains: 'Capital gains cannot be declared in ITR-1. Please use ITR-2.',
          };
        }

        // Validate maximum 1 house property
        const houseProperties = income.houseProperty?.properties || formData.houseProperty?.properties || [];
        if (houseProperties.length > 1) {
          allErrors.income = {
            ...allErrors.income,
            houseProperty: 'ITR-1 allows only one house property. Consider ITR-2 for multiple properties.',
          };
        }
      }

      // ITR-2 specific validations
      if (selectedITR === 'ITR-2' || selectedITR === 'ITR2') {
        // Validate no business income
        const businessIncome = typeof income.businessIncome === 'number' ? income.businessIncome : 0;
        if (businessIncome > 0) {
          allErrors.income = {
            ...allErrors.income,
            businessIncome: 'Business income cannot be declared in ITR-2. Consider ITR-3 or ITR-4.',
          };
        }

        // Validate no professional income
        const professionalIncome = typeof income.professionalIncome === 'number' ? income.professionalIncome : 0;
        if (professionalIncome > 0) {
          allErrors.income = {
            ...allErrors.income,
            professionalIncome: 'Professional income cannot be declared in ITR-2. Consider ITR-3 or ITR-4.',
          };
        }

        // Schedule FA warning if foreign income exists but no Schedule FA
        const hasForeignIncome = (income.foreignIncome?.foreignIncomeDetails?.length > 0) ||
          (income.foreignIncome?.totalIncome > 0) ||
          (formData.income?.foreignIncome?.totalIncome > 0);
        const hasScheduleFA = formData.scheduleFA?.assets?.length > 0;
        if (hasForeignIncome && !hasScheduleFA) {
          // Add as warning, not error
          if (!allErrors.warnings) allErrors.warnings = [];
          allErrors.warnings.push('You have declared foreign income. Consider declaring foreign assets in Schedule FA if applicable.');
        }
      }

      // Validate ITR type-specific income limits
      if (selectedITR === 'ITR-1' || selectedITR === 'ITR1') {
        // ITR-1: Total income should not exceed ₹50L
        if (totalIncome > 5000000) {
          allErrors.income = {
            ...allErrors.income,
            itrTypeLimit: 'ITR-1 is only for total income up to ₹50 lakhs. Please select ITR-2 or ITR-3.',
          };
        }
      }

      // Also run complete form validation for cross-section checks
      // Convert formData to validation engine format
      // eslint-disable-next-line camelcase
      const validationFormData = {
        // eslint-disable-next-line camelcase
        personal_info: formData.personalInfo || {},
        income: formData.income || {},
        deductions: formData.deductions || {},
        // eslint-disable-next-line camelcase
        taxes_paid: formData.taxesPaid || {},
        businessIncome: formData.income?.businessIncome,
        professionalIncome: formData.income?.professionalIncome,
        balanceSheet: formData.balanceSheet,
        auditInfo: formData.auditInfo,
      };

      try {
        const completeValidation = validationEngine.validateCompleteForm(validationFormData, selectedITR);
        if (!completeValidation.isValid) {
          // Map errors back to formData section names
          const mappedErrors = {};
          // eslint-disable-next-line camelcase
          const reverseMapping = {
            // eslint-disable-next-line camelcase
            personal_info: 'personalInfo',
            income: 'income',
            deductions: 'deductions',
            // eslint-disable-next-line camelcase
            taxes_paid: 'taxesPaid',
            businessIncome: 'businessIncome',
            professionalIncome: 'professionalIncome',
            balanceSheet: 'balanceSheet',
            auditInfo: 'auditInfo',
          };

          Object.keys(completeValidation.errors || {}).forEach(sectionId => {
            const mappedSection = reverseMapping[sectionId] || sectionId;
            mappedErrors[mappedSection] = completeValidation.errors[sectionId];
          });

          setValidationErrors(mappedErrors);
        } else {
          setValidationErrors({});
        }
      } catch (error) {
        enterpriseLogger.warn('Complete form validation error', { error });
      }
    };

    // Debounce validation - 300ms for real-time feel
    const timeoutId = setTimeout(validateAllSections, 300);
    return () => clearTimeout(timeoutId);
  }, [formData, selectedITR, isReadOnly]);

  // Generate recommendations when form data changes
  useEffect(() => {
    const generateRecommendations = async () => {
      if (!formData.personalInfo.pan) return;

      setIsLoadingRecommendations(true);
      try {
        const recs = await aiRecommendationEngine.getRecommendations(
          formData,
          selectedITR,
          assessmentYear,
        );
        setRecommendations(recs);
      } catch (error) {
        // Silently fail - recommendations are optional
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    // Debounce recommendation generation
    const timeoutId = setTimeout(generateRecommendations, 1000);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, selectedITR, assessmentYear]);

  const handleRegimeChange = useCallback((newRegime) => {
    setTaxRegime(newRegime);
    // Manual mode: clear computed values and let user explicitly compute
    setTaxComputation(null);
    setRegimeComparison(null);
    setShowComparison(false);
    // Show comparison if available
    if (regimeComparison) {
      setShowComparison(true);
    }
  }, [regimeComparison, formData.personalInfo.pan, formData.income]);

  const handleBack = useCallback(() => {
    // Context-aware back navigation based on entry point
    const currentEntryPoint = entryPoint || safeLocalStorageGet('itr_computation_entry_point', null);
    // Check for returnTo in query params (for refresh-safe navigation from review)
    const returnToFromQuery = searchParams.get('returnTo');
    const returnToFromState = location.state?.returnTo;
    const returnTo = returnToFromQuery || returnToFromState;

    // If we have a returnTo (e.g., from review), navigate there
    if (returnTo) {
      navigate(returnTo, { replace: false });
      return;
    }

    switch (currentEntryPoint) {
      case 'review': {
        // From Review page - navigate back to review with query params
        const reviewUrl = new URLSearchParams();
        if (effectiveDraftId) reviewUrl.set('draftId', effectiveDraftId);
        if (effectiveFilingId) reviewUrl.set('filingId', effectiveFilingId);
        if (selectedITR) reviewUrl.set('itrType', selectedITR);
        if (assessmentYear) reviewUrl.set('ay', assessmentYear);
        navigate(`/itr/review?${reviewUrl.toString()}`, { replace: false });
        break;
      }

      case 'form16':
      case 'it-portal':
      case 'direct-selection':
      case 'guided-selection':
      case 'auto':
      case 'upload':
      case 'manual':
      case 'override':
      case 'previous-year':
      case 'revised-return':
        // From Determine ITR - go back to canonical determine screen
        navigate('/itr/determine', {
          state: {
            selectedPerson,
            assessmentYear,
          },
        });
        break;

      case 'expert':
        // Legacy entry point - canonicalize
        navigate('/itr/determine', {
          state: {
            selectedPerson,
          },
        });
        break;

      case 'guided':
        // Legacy entry point - canonicalize
        navigate('/itr/determine', {
          state: {
            selectedPerson,
          },
        });
        break;

      case 'form-selection':
        // Legacy entry point - canonicalize
        navigate('/itr/determine', {
          state: {
            selectedPerson,
          },
        });
        break;

      case 'direct-access':
      default:
        // For drafts/filings accessed directly or unknown entry point
        if (draftId || filingId) {
          navigate('/dashboard');
        } else if (selectedPerson) {
          // Fallback: go to person selector
          navigate('/itr/select-person', {
            state: {
              selectedPerson,
              returnTo: '/itr/computation',
              ...(draftId && { draftId }),
            },
          });
        } else {
          navigate('/dashboard');
        }
        break;
    }
  }, [navigate, selectedPerson, draftId, filingId, entryPoint, location.state, assessmentYear, initialVerificationResult]);

  const handleResolveDiscrepancy = useCallback((fieldPath, action) => {
    // Handle resolution - update formData based on action
    if (action === 'useUploaded') {
      // Update formData with uploaded value
      // Implementation would update formData based on fieldPath
      toast.success(`Updated ${fieldPath} with uploaded data`);
    } else if (action === 'useManual') {
      toast.info(`Keeping manual entry for ${fieldPath}`);
    }
  }, []);

  const handleDataUploaded = useCallback((uploadedData) => {
    // Merge uploaded data for discrepancy checking
    setUploadedData(prev => ({
      ...prev,
      income: {
        ...prev?.income,
        ...uploadedData,
      },
    }));
  }, []);

  const handleRefreshPrefetch = async () => {
    const pan = selectedPerson?.panNumber || formData.personalInfo.pan;
    if (!pan) return;

    setIsPrefetching(true);
    try {
      // Clear cache
      itrAutoFillService.clearCacheFor(pan, assessmentYear);

      // Collect data from all available sources (same as initial load)
      const sources = {
        verified: {},
        previousYear: {},
        form16: {},
        ais: {},
        form26as: {},
        eri: {},
        userProfile: {},
      };

      // Get AIS/26AS data
      try {
        const prefetchResult = await itrAutoFillService.prefetchData(pan, assessmentYear);
        if (prefetchResult.data) {
          sources.ais = { income: prefetchResult.data.income, taxesPaid: prefetchResult.data.taxesPaid };
          sources.form26as = { income: prefetchResult.data.income, taxesPaid: prefetchResult.data.taxesPaid };
        }
        if (prefetchResult.sources) {
          setPrefetchSources(prefetchResult.sources);
        }
      } catch (error) {
        console.warn('AIS/26AS prefetch failed:', error);
      }

      // Use enhanced auto-population service
      const result = autoPopulationService.autoPopulateWithPriority(
        sources,
        formData,
        fieldVerificationStatuses,
      );

      setFormData(result.formData);
      setAutoFilledFields(result.autoFilledFields);
      setFieldSources(result.fieldSources);

      // Generate summary
      const summary = autoPopulationService.getAutoPopulationSummary(
        result.autoFilledFields,
        result.fieldSources,
      );
      setAutoPopulationSummary(summary);

      toast.success(`Refreshed ${summary.autoFilledCount} fields from ${Object.keys(summary.bySource).length} sources`);
    } catch (error) {
      enterpriseLogger.error('Refresh failed', { error });
      toast.error('Refresh failed: ' + error.message);
    } finally {
      setIsPrefetching(false);
    }
  };

  const handleApplyRecommendation = (recommendation) => {
    if (!recommendation.action) return;

    const updatedFormData = aiRecommendationEngine.applyRecommendation(recommendation, formData);
    setFormData(updatedFormData);
    toast.success('Recommendation applied');
  };

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleSectionExpand = useCallback((sectionId) => {
    setExpandedSectionId(sectionId);
    if (sectionId) {
      setExpandedSections((prev) => ({
        ...prev,
        [sectionId]: true,
      }));
    } else {
      // Collapse all when sectionId is null
      setExpandedSections({});
    }
  }, []);

  // Handle section selection from sidebar
  const handleSectionSelect = useCallback((sectionId) => {
    setActiveSectionId(sectionId);
    setExpandedSectionId(sectionId);
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: true,
    }));
  }, []);

  // Calculate section summary values for BreathingGrid
  const getSectionSummary = useCallback((sectionId) => {
    const sectionData = formData[sectionId];
    if (!sectionData && sectionId !== 'scheduleFA' && sectionId !== 'taxOptimizer') return { primaryValue: null, secondaryValue: null, status: 'pending', statusCount: 0 };

    // Check for validation errors in this section
    const sectionErrors = validationErrors[sectionId] || {};
    const errorCount = Object.keys(sectionErrors).length;
    const hasErrors = errorCount > 0;
    const hasWarnings = validationErrors.cross_section?.some(err => err.toLowerCase().includes(sectionId.toLowerCase())) || false;

    // Determine base status
    let baseStatus = 'pending';
    let statusCount = 0;

    switch (sectionId) {
      case 'scheduleFA':
        // Schedule FA summary - foreign assets are fetched separately via API
        return {
          primaryValue: 'Schedule FA',
          secondaryValue: 'Foreign Assets',
          status: 'info',
          statusCount: 0,
        };
      case 'taxOptimizer':
        // Tax Optimizer summary
        return {
          primaryValue: taxComputation?.totalTaxLiability ? `₹${parseFloat(taxComputation.totalTaxLiability).toLocaleString('en-IN')}` : null,
          secondaryValue: 'Optimize Tax',
          status: taxComputation ? 'complete' : 'pending',
          statusCount: 0,
        };
      case 'personalInfo': {
        const hasData = sectionData.pan && sectionData.name;
        baseStatus = hasData ? 'complete' : 'pending';
        // Override with error/warning status if validation errors exist
        if (hasErrors) {
          baseStatus = 'error';
          statusCount = errorCount;
        } else if (hasWarnings) {
          baseStatus = 'warning';
          statusCount = 1;
        }

        // Truncate PAN for display: XXXXX1234X
        const panDisplay = sectionData.pan ? `${sectionData.pan.substring(0, 5)}${sectionData.pan.substring(9)}` : null;
        const residentStatus = sectionData.residentialStatus || 'Resident Individual';

        return {
          primaryValue: sectionData.name || 'Personal Info',
          secondaryValue: panDisplay || null,
          status: baseStatus,
          statusCount,
          metaText: residentStatus,
        };
      }
      case 'income': {
        const income = sectionData;
        let businessTotal = 0;
        let professionalTotal = 0;
        let presumptiveBusinessTotal = 0;
        let presumptiveProfessionalTotal = 0;

        // Handle ITR-3 business income structure
        if (selectedITR === 'ITR-3' || selectedITR === 'ITR3') {
          if (income.businessIncome?.businesses) {
            businessTotal = income.businessIncome.businesses.reduce((sum, biz) =>
              sum + (biz.pnl?.netProfit || 0), 0);
          } else {
            businessTotal = parseFloat(income.businessIncome) || 0;
          }

          if (income.professionalIncome?.professions) {
            professionalTotal = income.professionalIncome.professions.reduce((sum, prof) =>
              sum + (prof.pnl?.netIncome || 0), 0);
          } else {
            professionalTotal = parseFloat(income.professionalIncome) || 0;
          }
        } else if (selectedITR === 'ITR-4' || selectedITR === 'ITR4') {
          // Handle ITR-4 presumptive income
          presumptiveBusinessTotal = income.presumptiveBusiness?.presumptiveIncome || 0;
          presumptiveProfessionalTotal = income.presumptiveProfessional?.presumptiveIncome || 0;
        } else {
          businessTotal = parseFloat(income.businessIncome) || 0;
          professionalTotal = parseFloat(income.professionalIncome) || 0;
        }

        const salary = parseFloat(income.salary) || 0;
        const capitalGainsTotal = typeof income.capitalGains === 'object' && income.capitalGains?.stcgDetails
          ? (income.capitalGains.stcgDetails || []).reduce((sum, e) => sum + (parseFloat(e.gainAmount) || 0), 0) +
          (income.capitalGains.ltcgDetails || []).reduce((sum, e) => sum + (parseFloat(e.gainAmount) || 0), 0)
          : parseFloat(income.capitalGains) || 0;
        const housePropertyTotal = typeof income.houseProperty === 'object' && income.houseProperty?.properties
          ? income.houseProperty.properties.reduce((sum, p) => {
            const rental = parseFloat(p.annualRentalIncome) || 0;
            const taxes = parseFloat(p.municipalTaxes) || 0;
            const interest = parseFloat(p.interestOnLoan) || 0;
            return sum + Math.max(0, rental - taxes - interest);
          }, 0)
          : parseFloat(income.houseProperty) || 0;
        // Handle other sources income (structured format)
        let otherSourcesTotal = 0;
        if (typeof income.otherSources === 'object' && income.otherSources) {
          otherSourcesTotal = parseFloat(income.otherSources.totalOtherSourcesIncome || 0) ||
            (parseFloat(income.otherSources.totalInterestIncome || 0) + parseFloat(income.otherSources.totalOtherIncome || 0));
        } else {
          otherSourcesTotal = parseFloat(income.otherIncome) || 0;
        }

        // Extract agricultural income (exempt but shown for completeness)
        const agriculturalIncome = parseFloat(
          formData?.exemptIncome?.agriculturalIncome?.netAgriculturalIncome ||
          formData?.exemptIncome?.netAgriculturalIncome ||
          formData?.agriculturalIncome ||
          0,
        );

        // Handle foreign income (ITR-2, ITR-3)
        let foreignIncomeTotal = 0;
        if (income.foreignIncome && typeof income.foreignIncome === 'object') {
          if (income.foreignIncome.foreignIncomeDetails && Array.isArray(income.foreignIncome.foreignIncomeDetails)) {
            foreignIncomeTotal = income.foreignIncome.foreignIncomeDetails.reduce((sum, item) =>
              sum + (parseFloat(item.amount || item.income || 0)), 0);
          } else {
            foreignIncomeTotal = parseFloat(income.foreignIncome.totalIncome || income.foreignIncome.amount || 0);
          }
        }

        // Handle director/partner income (ITR-2, ITR-3)
        let directorPartnerIncomeTotal = 0;
        if (income.directorPartner && typeof income.directorPartner === 'object') {
          directorPartnerIncomeTotal =
            (parseFloat(income.directorPartner.directorIncome) || 0) +
            (parseFloat(income.directorPartner.partnerIncome) || 0);
        }

        const totalIncome =
          salary +
          businessTotal +
          professionalTotal +
          presumptiveBusinessTotal +
          presumptiveProfessionalTotal +
          otherSourcesTotal +
          capitalGainsTotal +
          housePropertyTotal +
          foreignIncomeTotal +
          directorPartnerIncomeTotal +
          agriculturalIncome; // Include agricultural income (exempt but shown)

        // Build breakdown string for collapsed card
        const breakdownParts = [];
        if (salary > 0) {
          breakdownParts.push(`Salary ₹${(salary / 100000).toFixed(1)}L`);
        }
        if (capitalGainsTotal > 0) {
          breakdownParts.push(`Capital ₹${(capitalGainsTotal / 100000).toFixed(1)}L`);
        }
        if (businessTotal > 0 || presumptiveBusinessTotal > 0) {
          const bizTotal = businessTotal || presumptiveBusinessTotal;
          breakdownParts.push(`Business ₹${(bizTotal / 100000).toFixed(1)}L`);
        }
        if (professionalTotal > 0 || presumptiveProfessionalTotal > 0) {
          const profTotal = professionalTotal || presumptiveProfessionalTotal;
          breakdownParts.push(`Prof ₹${(profTotal / 100000).toFixed(1)}L`);
        }
        if (housePropertyTotal > 0) {
          breakdownParts.push(`House ₹${(housePropertyTotal / 100000).toFixed(1)}L`);
        }
        if (otherSourcesTotal > 0) {
          breakdownParts.push(`Other ₹${(otherSourcesTotal / 100000).toFixed(1)}L`);
        }
        if (foreignIncomeTotal > 0) {
          breakdownParts.push(`Foreign ₹${(foreignIncomeTotal / 100000).toFixed(1)}L`);
        }
        if (directorPartnerIncomeTotal > 0) {
          breakdownParts.push(`Dir/Part ₹${(directorPartnerIncomeTotal / 100000).toFixed(1)}L`);
        }
        if (agriculturalIncome > 0) {
          breakdownParts.push(`Agri ₹${(agriculturalIncome / 100000).toFixed(1)}L (exempt)`);
        }

        const breakdown = breakdownParts.length > 0 ? breakdownParts.join(', ') : null;
        const sourceCount = [
          salary > 0,
          businessTotal > 0 || presumptiveBusinessTotal > 0,
          professionalTotal > 0 || presumptiveProfessionalTotal > 0,
          capitalGainsTotal > 0,
          housePropertyTotal > 0,
          otherSourcesTotal > 0,
          foreignIncomeTotal > 0,
          directorPartnerIncomeTotal > 0,
          agriculturalIncome > 0,
        ].filter(Boolean).length;

        baseStatus = totalIncome > 0 ? 'complete' : 'pending';
        if (hasErrors) {
          baseStatus = 'error';
          statusCount = errorCount;
        } else if (hasWarnings) {
          baseStatus = 'warning';
          statusCount = 1;
        }
        return {
          primaryValue: totalIncome,
          secondaryValue: breakdown || `${sourceCount} source${sourceCount !== 1 ? 's' : ''}`,
          status: baseStatus,
          statusCount,
          metaText: sourceCount > 0 ? `from ${sourceCount} source${sourceCount !== 1 ? 's' : ''}` : null,
        };
      }
      case 'deductions': {
        const deductions = sectionData;
        const section80C = parseFloat(deductions.section80C) || 0;
        const section80D = parseFloat(deductions.section80D) || 0;
        const section80G = parseFloat(deductions.section80G) || 0;
        const section80TTA = parseFloat(deductions.section80TTA) || 0;
        const section80TTB = parseFloat(deductions.section80TTB) || 0;
        const otherDeductions = Object.values(deductions.otherDeductions || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

        const totalDeductions = section80C + section80D + section80G + section80TTA + section80TTB + otherDeductions;

        // Build breakdown string for collapsed card
        const breakdownParts = [];
        if (section80C > 0) {
          breakdownParts.push(`80C ₹${(section80C / 1000).toFixed(0)}K`);
        }
        if (section80D > 0) {
          breakdownParts.push(`80D ₹${(section80D / 1000).toFixed(0)}K`);
        }
        if (section80G > 0) {
          breakdownParts.push(`80G ₹${(section80G / 1000).toFixed(0)}K`);
        }
        if (section80TTA > 0 || section80TTB > 0) {
          const ttaTotal = section80TTA + section80TTB;
          breakdownParts.push(`80TT ₹${(ttaTotal / 1000).toFixed(0)}K`);
        }

        const breakdown = breakdownParts.length > 0 ? breakdownParts.join(', ') : null;
        const claimCount = [
          section80C > 0,
          section80D > 0,
          section80G > 0,
          section80TTA > 0,
          section80TTB > 0,
          otherDeductions > 0,
        ].filter(Boolean).length;

        baseStatus = totalDeductions > 0 ? 'complete' : 'pending';
        if (hasErrors) {
          baseStatus = 'error';
          statusCount = errorCount;
        } else if (hasWarnings) {
          baseStatus = 'warning';
          statusCount = 1;
        }

        // Check if new regime is selected (deductions not applicable)
        const regimeNote = taxRegime === 'new' ? '(Old Regime only)' : null;

        return {
          primaryValue: totalDeductions,
          secondaryValue: breakdown || `${claimCount} claim${claimCount !== 1 ? 's' : ''}`,
          status: baseStatus,
          statusCount,
          metaText: regimeNote || (claimCount > 0 ? `${claimCount} claim${claimCount !== 1 ? 's' : ''}` : null),
        };
      }
      case 'businessIncome': {
        const businesses = sectionData?.businesses || [];
        const totalNetProfit = businesses.reduce((sum, biz) => sum + (biz.pnl?.netProfit || 0), 0);
        baseStatus = businesses.length > 0 && totalNetProfit !== 0 ? 'complete' : 'pending';
        if (hasErrors) {
          baseStatus = 'error';
          statusCount = errorCount;
        } else if (hasWarnings) {
          baseStatus = 'warning';
          statusCount = 1;
        }
        return {
          primaryValue: totalNetProfit,
          secondaryValue: `${businesses.length} business${businesses.length !== 1 ? 'es' : ''}`,
          status: baseStatus,
          statusCount,
        };
      }
      case 'professionalIncome': {
        const professions = sectionData?.professions || [];
        const totalNetIncome = professions.reduce((sum, prof) => sum + (prof.pnl?.netIncome || 0), 0);
        baseStatus = professions.length > 0 && totalNetIncome !== 0 ? 'complete' : 'pending';
        if (hasErrors) {
          baseStatus = 'error';
          statusCount = errorCount;
        } else if (hasWarnings) {
          baseStatus = 'warning';
          statusCount = 1;
        }
        return {
          primaryValue: totalNetIncome,
          secondaryValue: `${professions.length} profession${professions.length !== 1 ? 's' : ''}`,
          status: baseStatus,
          statusCount,
        };
      }
      case 'presumptiveIncome': {
        const presumptiveBusiness = formData.income?.presumptiveBusiness || {};
        const presumptiveProfessional = formData.income?.presumptiveProfessional || {};
        const businessIncome = presumptiveBusiness.presumptiveIncome || 0;
        const professionalIncome = presumptiveProfessional.presumptiveIncome || 0;
        const total = businessIncome + professionalIncome;
        baseStatus = total > 0 ? 'complete' : 'pending';
        if (hasErrors) {
          baseStatus = 'error';
          statusCount = errorCount;
        } else if (hasWarnings) {
          baseStatus = 'warning';
          statusCount = 1;
        }
        return {
          primaryValue: total,
          secondaryValue: businessIncome > 0 && professionalIncome > 0
            ? 'Business + Professional'
            : businessIncome > 0
              ? 'Business'
              : professionalIncome > 0
                ? 'Professional'
                : null,
          status: baseStatus,
          statusCount,
        };
      }
      case 'balanceSheet': {
        const assets = sectionData?.assets?.total || 0;
        const liabilities = sectionData?.liabilities?.total || 0;
        const isBalanced = assets === liabilities && assets > 0;
        return {
          primaryValue: assets,
          secondaryValue: isBalanced ? 'Balanced' : assets > 0 ? 'Not Balanced' : null,
          status: isBalanced ? 'complete' : (assets > 0 ? 'warning' : 'pending'),
        };
      }
      case 'auditInfo': {
        const isApplicable = sectionData?.isAuditApplicable || false;
        const hasReport = !!(sectionData?.auditReportNumber && sectionData?.auditReportDate);
        return {
          primaryValue: isApplicable ? 'Required' : 'Not Required',
          secondaryValue: isApplicable && hasReport ? 'Report Filed' : isApplicable ? 'Report Pending' : null,
          status: isApplicable ? (hasReport ? 'complete' : 'warning') : 'complete',
        };
      }
      case 'taxesPaid': {
        const taxesPaid = sectionData;
        const tds = parseFloat(taxesPaid.tds) || 0;
        const advanceTax = parseFloat(taxesPaid.advanceTax) || 0;
        const selfAssessmentTax = parseFloat(taxesPaid.selfAssessmentTax) || 0;
        const totalPaid = tds + advanceTax + selfAssessmentTax;

        // Build breakdown string for collapsed card
        const breakdownParts = [];
        if (tds > 0) {
          breakdownParts.push(`TDS ₹${(tds / 100000).toFixed(1)}L`);
        }
        if (advanceTax > 0) {
          breakdownParts.push(`Advance ₹${(advanceTax / 1000).toFixed(0)}K`);
        }
        if (selfAssessmentTax > 0) {
          breakdownParts.push(`Self ₹${(selfAssessmentTax / 1000).toFixed(0)}K`);
        }

        const breakdown = breakdownParts.length > 0 ? breakdownParts.join(', ') : null;

        baseStatus = totalPaid > 0 ? 'complete' : 'pending';
        if (hasErrors) {
          baseStatus = 'error';
          statusCount = errorCount;
        } else if (hasWarnings) {
          baseStatus = 'warning';
          statusCount = 1;
        }

        // Check for mismatches (would need to compare with AIS/26AS data)
        const mismatchCount = 0; // TODO: Compare with AIS data

        return {
          primaryValue: totalPaid,
          secondaryValue: breakdown,
          status: baseStatus,
          statusCount,
          metaText: mismatchCount > 0 ? `${mismatchCount} mismatch${mismatchCount !== 1 ? 'es' : ''} found` : null,
        };
      }
      case 'taxComputation':
        return {
          primaryValue: taxComputation?.totalTax || 0,
          secondaryValue: taxComputation ? `Refund: ₹${Math.max(0, (formData.taxesPaid?.tds || 0) + (formData.taxesPaid?.advanceTax || 0) + (formData.taxesPaid?.selfAssessmentTax || 0) - (taxComputation.totalTax || 0)).toLocaleString('en-IN')}` : null,
          status: taxComputation ? 'complete' : 'pending',
        };
      case 'bankDetails': {
        const hasData = sectionData.accountNumber && sectionData.ifsc;
        baseStatus = hasData ? 'complete' : 'pending';
        if (hasErrors) {
          baseStatus = 'error';
          statusCount = errorCount;
        } else if (hasWarnings) {
          baseStatus = 'warning';
          statusCount = 1;
        }
        return {
          primaryValue: sectionData.accountNumber ? `****${sectionData.accountNumber.slice(-4)}` : null,
          secondaryValue: sectionData.bankName || null,
          status: baseStatus,
          statusCount,
        };
      }
      default:
        return { primaryValue: null, secondaryValue: null, status: 'pending', statusCount: 0 };
    }
  }, [formData, taxComputation, validationErrors, selectedITR, taxRegime]);

  // Get section status for sidebar (must be after getSectionSummary)
  const getSectionStatus = useCallback((sectionId, returnType = 'status') => {
    const summary = getSectionSummary(sectionId);

    // Guided completion (soft gating): show missing required count when no validation errors exist
    const missingRequired = getMissingRequired(sectionId, formData, selectedITR);
    const hasValidationErrors = (summary.status === 'error' && (summary.statusCount || 0) > 0);

    if (returnType === 'count') {
      if (!hasValidationErrors && missingRequired.length > 0) return missingRequired.length;
      return summary.statusCount || 0;
    }

    if (!hasValidationErrors && missingRequired.length > 0) return 'pending';
    return summary.status || 'pending';
  }, [getSectionSummary, formData, selectedITR]);

  // Validation helper to prevent negative values
  const validateNonNegative = useCallback((value, fieldName) => {
    if (value < 0) {
      toast.error(`${fieldName} cannot be negative`);
      return 0;
    }
    return value;
  }, []);

  // Validation helper for income values
  const validateIncomeValue = useCallback((value, fieldName) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    if (isNaN(numValue) || numValue < 0) {
      toast.error(`${fieldName} must be a non-negative number`);
      return 0;
    }
    return numValue;
  }, []);

  // Validation helper for deduction values
  const validateDeductionValue = useCallback((value, fieldName, maxLimit = null) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    if (isNaN(numValue) || numValue < 0) {
      toast.error(`${fieldName} must be a non-negative number`);
      return 0;
    }
    if (maxLimit !== null && numValue > maxLimit) {
      toast.error(`${fieldName} cannot exceed ₹${maxLimit.toLocaleString('en-IN')}`);
      return maxLimit;
    }
    return numValue;
  }, []);

  const updateFormData = useCallback((section, data) => {
    // LANE 1: FAST LANE - Pure State Update
    // Decouple validation and heavy computation from keystrokes

    setFormData(prev => {
      // Basic merge logic
      const currentSectionData = prev[section];
      let newSectionData = { ...data };

      // Normalize nested update payloads (legacy support)
      if (
        (section === 'balanceSheet' || section === 'auditInfo' || section === 'goodsCarriage') &&
        newSectionData &&
        typeof newSectionData === 'object' &&
        newSectionData[section] &&
        typeof newSectionData[section] === 'object'
      ) {
        newSectionData = newSectionData[section];
      }

      // Merge with previous data
      const mergedData = {
        ...currentSectionData,
        ...newSectionData,
      };

      const updated = {
        ...prev,
        [section]: mergedData,
      };

      // Sync otherSources to income.otherSources logic (Specific fast-lane sync needed for aggregation)
      if (section === 'otherSources') {
        updated.income = {
          ...prev.income,
          otherSources: mergedData,
          // Simple aggregation update - cheap enough for fast lane?
          // If this causes lag, move to useEffect on debounced data
          otherIncome: parseFloat(mergedData.totalOtherSourcesIncome || 0) ||
            (parseFloat(mergedData.totalInterestIncome || 0) +
              parseFloat(mergedData.totalOtherIncome || 0)) ||
            prev.income?.otherIncome || 0,
        };
      }

      return updated;
    });

    // LANE 2: SLOW LANE - Heavy Logic (Validation, Toasts, Recompute)
    // NOTE: Validation logic formerly here has been identified as a performance blocker.
    // Ideally, this should be moved to explicit handlers (onBlur, onSave, onCompute).
    // For now, we simply omitted the synchronous validation blocks for:
    // - income (negative checks)
    // - deductions (limits)
    // - taxesPaid (negative checks)
    // - otherSources (negative checks)
    // These should be run during 'validateSection' or 'onSaveDraft'.

  }, []);

  // Stable handler for active section updates to prevent render loops
  // This is critical because passing an inline arrow function to ComputationSection
  // (which passes it to child forms' useEffect) causes infinite update cycles.
  const handleActiveSectionUpdate = useCallback((data) => {
    // activeSectionId is a state variable available in closure
    // We need to use a ref or depend on activeSectionId.
    // Since activeSectionId updates rarely (nav only), this dependence is fine.
    // However, to be extra safe inside the render loop, we rely on the component state.
    if (activeSectionId) {
      updateFormData(activeSectionId, data);
    }
  }, [activeSectionId, updateFormData]);

  // Create draft automatically when user starts entering data
  const createDraftAutomatically = useCallback(async (dataToSave) => {
    // Don't create if already creating, if we have a draftId, or if navigation is in progress
    const currentDraftId = effectiveDraftId;
    if (isCreatingDraftRef.current || currentDraftId || isNavigatingRef.current) {
      return null;
    }

    // Don't retry if previous attempt failed (circuit breaker)
    if (draftCreationErrorRef.current) {
      return null;
    }

    // Cooldown: Don't attempt creation within 5 seconds of last attempt
    const now = Date.now();
    if (lastCreationAttemptRef.current && (now - lastCreationAttemptRef.current) < 5000) {
      return null;
    }

    // Check if there's meaningful data to save (require PAN + at least one income field > 0)
    const hasData = dataToSave && (
      dataToSave.personalInfo?.pan &&
      dataToSave.personalInfo.pan.length === 10 && // Valid PAN format
      (
        (dataToSave.income?.salary > 0) ||
        (dataToSave.income?.otherIncome > 0) ||
        (dataToSave.income?.otherSources && (
          (dataToSave.income.otherSources.totalOtherSourcesIncome || 0) > 0 ||
          (dataToSave.income.otherSources.totalInterestIncome || 0) > 0 ||
          (dataToSave.income.otherSources.totalOtherIncome || 0) > 0
        )) ||
        (dataToSave.income?.businessIncome > 0) ||
        (dataToSave.income?.professionalIncome > 0) ||
        (dataToSave.income?.houseProperty > 0) ||
        (dataToSave.income?.capitalGains > 0)
      )
    );

    if (!hasData) {
      return null;
    }

    // If there's already a pending creation, return that promise
    if (pendingDraftCreationRef.current) {
      return pendingDraftCreationRef.current;
    }

    // Record attempt timestamp
    lastCreationAttemptRef.current = now;
    isCreatingDraftRef.current = true;
    const creationPromise = (async () => {
      try {
        if (!createDraftIdempotencyKeyRef.current) {
          createDraftIdempotencyKeyRef.current = `itr_draft_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        }

        // Create filing and draft (createITR now calls /drafts endpoint which creates both)
        const response = await itrService.createITR({
          itrType: selectedITR,
          formData: dataToSave,
          assessmentYear,
          taxRegime,
        }, {
          headers: {
            'X-Idempotency-Key': createDraftIdempotencyKeyRef.current,
            // Stable per-draft-creation attempt so backend logs can be traced
            'X-Client-Request-Id': createDraftIdempotencyKeyRef.current,
          },
        });

        if (response?.draft?.id || response?.id) {
          const newDraftId = response.draft?.id || response.id;
          const newFilingId = response.filing?.id || response.filingId;

          // Update local draft identity immediately to prevent duplicate draft creation
          setDraftIdLocal(newDraftId);
          if (newFilingId) setFilingIdLocal(newFilingId);
          trackEvent('itr_draft_created', {
            source: 'auto',
            role: user?.role || null,
            itrType: selectedITR,
            draftId: newDraftId,
            filingId: newFilingId || null,
            assessmentYear,
          });

          // Mark navigation as in progress
          isNavigatingRef.current = true;

          // Update URL with draft ID + filing ID (critical for refresh + preventing re-creation)
          const nextUrl = `/itr/computation?draftId=${newDraftId}${newFilingId ? `&filingId=${newFilingId}` : ''}`;
          navigate(nextUrl, {
            replace: true,
            state: { ...location.state, draftId: newDraftId, filingId: newFilingId },
          });

          // Store draftId in localStorage
          try {
            const draftToSave = {
              formData: dataToSave,
              assessmentYear,
              taxRegime,
              selectedITR,
              draftId: newDraftId,
              filingId: newFilingId,
              savedAt: new Date().toISOString(),
            };
            safeLocalStorageSet(`itr_draft_${newDraftId}`, draftToSave);
          } catch (e) {
            // Error already handled by safeLocalStorageSet
          }

          // Reset error flag on success
          draftCreationErrorRef.current = false;
          errorDisplayedRef.current = false;

          // Show success notification
          toast.success('Draft saved automatically', {
            icon: '💾',
            duration: 2000,
          });

          // Allow navigation to complete
          setTimeout(() => {
            isNavigatingRef.current = false;
          }, 1000);

          return newDraftId;
        }
        return null;
      } catch (error) {
        console.error('Failed to create draft automatically', { error });
        // Set error flag to prevent infinite retries
        draftCreationErrorRef.current = true;

        // Show error only once
        if (!errorDisplayedRef.current) {
          errorDisplayedRef.current = true;
          // Only show error for 404 (endpoint not found) or 500 (server error)
          // Don't show for 401 (auth) or 400 (validation) as those are handled elsewhere
          if (error.response?.status === 404 || error.response?.status === 500) {
            toast.error('Unable to create draft automatically. Your data is saved locally.', {
              duration: 5000,
              id: 'draft-creation-error', // Use ID to prevent duplicates
            });
          }
        }

        // Reset error flag after 30 seconds (circuit breaker cooldown)
        setTimeout(() => {
          draftCreationErrorRef.current = false;
          errorDisplayedRef.current = false;
        }, 30000);

        return null;
      } finally {
        isCreatingDraftRef.current = false;
        pendingDraftCreationRef.current = null;
      }
    })();

    pendingDraftCreationRef.current = creationPromise;
    return creationPromise;
  }, [effectiveDraftId, selectedITR, assessmentYear, taxRegime, navigate, location.state]);

  // Enhanced auto-save using useAutoSave hook
  const saveDraftData = useCallback(async (dataToSave) => {
    if (!effectiveDraftId) {
      // Try to create draft automatically if we have meaningful data
      const newDraftId = await createDraftAutomatically(dataToSave);

      if (newDraftId) {
        // Draft was created, now save to backend
        try {
          await formDataService.saveFormData('all', dataToSave, newDraftId);
          return;
        } catch (error) {
          enterpriseLogger.error('Auto-save failed after draft creation', { error });
          throw error;
        }
      }

      // Save to localStorage only if no draftId and draft creation failed/not needed
      const localStorageKey = 'itr_draft_current';
      try {
        const draftToSave = {
          formData: dataToSave,
          assessmentYear,
          taxRegime,
          selectedITR,
          draftId: 'current',
          savedAt: new Date().toISOString(),
        };
        safeLocalStorageSet(localStorageKey, draftToSave);
        lastSavedTimestampRef.current = draftToSave.savedAt;
      } catch (e) {
        enterpriseLogger.warn('Failed to save draft to localStorage', { error: e });
      }
      return;
    }

    // Save to backend via FormDataService
    try {
      // Use FormDataService to save all form data
      await formDataService.saveFormData('all', dataToSave, effectiveDraftId);
    } catch (error) {
      enterpriseLogger.error('Auto-save failed', { error });
      throw error;
    }
  }, [effectiveDraftId, assessmentYear, taxRegime, selectedITR, createDraftAutomatically]);

  // Use enhanced auto-save hook - enabled for all ITR types regardless of PAN status
  // Auto-save works as long as we have a draftId (or will save to localStorage as fallback)
  const {
    saveStatus: autoSaveStatusFromHook,
    handleSectionChange: autoSaveSectionChange,
    triggerSave: triggerAutoSave,
    pendingChanges,
  } = useAutoSave({
    saveFn: saveDraftData,
    data: formData,
    debounceMs: 2000,
    localStorageKey: effectiveDraftId ? `itr_draft_${effectiveDraftId}` : 'itr_draft_current',
    enabled: true, // Always enabled - will save to localStorage if no draftId, or to backend if draftId exists
    onSaveSuccess: () => {
      setAutoSaveStatus('saved');
      // Reset error flags on successful save
      draftCreationErrorRef.current = false;
      errorDisplayedRef.current = false;
      setTimeout(() => {
        setAutoSaveStatus(prev => (prev === 'saved' ? 'idle' : prev));
      }, 2000);
    },
    onSaveError: (error) => {
      setAutoSaveStatus('error');
      // Only log non-blocking errors (don't spam console)
      if (error.response?.status !== 404) {
        enterpriseLogger.warn('Auto-save error (non-blocking)', { error });
      }
    },
  });

  // Update autoSaveStatus from hook
  useEffect(() => {
    if (autoSaveStatusFromHook && autoSaveStatusFromHook !== 'idle') {
      setAutoSaveStatus(autoSaveStatusFromHook);
    }
  }, [autoSaveStatusFromHook]);

  // Track if there are unsaved changes for beforeunload warning
  // Consider unsaved if status is 'saving' or 'error', or if there are pending changes
  const hasUnsavedChanges = useMemo(() => {
    return autoSaveStatusFromHook === 'saving' || autoSaveStatusFromHook === 'error' || pendingChanges;
  }, [autoSaveStatusFromHook, pendingChanges]);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges || isReadOnly) return;

    const handleBeforeUnload = (e) => {
      // Modern browsers ignore custom messages, but we can still trigger the default dialog
      e.preventDefault();
      e.returnValue = ''; // Required for Chrome
      return ''; // Required for some browsers
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, isReadOnly]);

  // Cleanup error toasts on unmount to prevent layout distortion
  useEffect(() => {
    return () => {
      // Dismiss any pending error toasts when component unmounts
      toast.dismiss('draft-creation-error');
    };
  }, []);

  // Handle page visibility changes (pause/resume auto-save when tab is hidden/visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - pause auto-save to save resources
        // The useAutoSave hook will handle this automatically via its internal logic
        enterpriseLogger.debug('Page hidden - auto-save will pause');
      } else {
        // Tab is visible - resume auto-save
        enterpriseLogger.debug('Page visible - auto-save will resume');
        // Trigger a save if there are unsaved changes
        if (hasUnsavedChanges && draftId) {
          // The useAutoSave hook will handle this automatically
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasUnsavedChanges, draftId]);

  // Handle section change with immediate save
  useEffect(() => {
    if (activeSectionId && autoSaveSectionChange) {
      autoSaveSectionChange(activeSectionId, formData);
    }
  }, [activeSectionId, autoSaveSectionChange, formData]);

  // Listen for storage events from other tabs to sync state
  useEffect(() => {
    const handleStorageChange = (e) => {
      const localStorageKey = draftId ? `itr_draft_${draftId}` : 'itr_draft_current';
      if (e.key === localStorageKey && e.newValue) {
        try {
          const updatedDraft = JSON.parse(e.newValue);
          // Prevent recursive updates: only update if this is from another tab (different timestamp)
          if (updatedDraft.savedAt && updatedDraft.savedAt !== lastSavedTimestampRef.current) {
            // Only update if the draft is newer (to avoid overwriting with stale data)
            const currentSavedAt = lastSavedTimestampRef.current;
            if (!currentSavedAt || updatedDraft.savedAt > currentSavedAt) {
              // Update ref FIRST to prevent this update from triggering another save
              lastSavedTimestampRef.current = updatedDraft.savedAt;

              // Only update state if values actually changed to prevent unnecessary re-renders
              if (updatedDraft.formData) {
                setFormData(prev => {
                  const prevStr = JSON.stringify(prev);
                  const newStr = JSON.stringify(updatedDraft.formData);
                  if (prevStr !== newStr) {
                    return { ...prev, ...updatedDraft.formData };
                  }
                  return prev;
                });
              }
              if (updatedDraft.assessmentYear && updatedDraft.assessmentYear !== assessmentYear) {
                setAssessmentYear(updatedDraft.assessmentYear);
              }
              if (updatedDraft.taxRegime && updatedDraft.taxRegime !== taxRegime) {
                setTaxRegime(updatedDraft.taxRegime);
              }
              if (updatedDraft.selectedITR && updatedDraft.selectedITR !== selectedITR) {
                setSelectedITR(updatedDraft.selectedITR);
              }

              // Only show notification if we actually updated something
              const hasChanges = updatedDraft.formData ||
                (updatedDraft.assessmentYear && updatedDraft.assessmentYear !== assessmentYear) ||
                (updatedDraft.taxRegime && updatedDraft.taxRegime !== taxRegime) ||
                (updatedDraft.selectedITR && updatedDraft.selectedITR !== selectedITR);

              if (hasChanges) {
                toast('Draft updated from another tab', { icon: '🔄', duration: 2000 });
              }
            }
          }
        } catch (e) {
          enterpriseLogger.warn('Failed to sync draft from storage event', { error: e });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [draftId, assessmentYear, taxRegime, selectedITR]);

  // Refactoring Note: handleSaveDraft logic moved to useITRPersistence hook

  const handlePaused = async (updatedFiling) => {
    setCurrentFiling(updatedFiling);
    toast.success('Filing paused successfully');
    // Optionally navigate back to dashboard
    // navigate('/dashboard');
  };

  const handleResumed = async (updatedFiling) => {
    setCurrentFiling(updatedFiling);
    setShowResumeModal(false);
    // Load form data from filing if available
    if (updatedFiling.formData) {
      setFormData(updatedFiling.formData);
    }
    toast.success('Filing resumed successfully');
  };

  const handleResumeFromModal = async () => {
    if (!currentFiling) return;
    await handleResumed(currentFiling);
  };

  const handleStartFresh = () => {
    setCurrentFiling(null);
    setShowResumeModal(false);
    // Clear readonly viewMode and IDs if user chooses to start fresh (otherwise inputs stay disabled)
    const nextState = { ...(location.state || {}) };
    delete nextState.viewMode;
    delete nextState.filing;
    delete nextState.draftId;
    delete nextState.filingId;
    navigate('/itr/computation', {
      replace: true,
      state: {
        ...nextState,
        // Keep person context if we have it; otherwise route guard will ask user to pick.
        selectedPerson: selectedPerson || nextState.selectedPerson,
        selectedITR,
        assessmentYear,
      },
    });
    // Reset form data to match initial state structure
    setFormData({
      personalInfo: {
        pan: selectedPerson?.panNumber || '',
        name: selectedPerson?.name || '',
        dateOfBirth: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
      },
      income: {
        salary: 0,
        businessIncome: (selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? {
          businesses: [],
        } : 0,
        professionalIncome: (selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? {
          professions: [],
        } : 0,
        presumptiveBusiness: (selectedITR === 'ITR-4' || selectedITR === 'ITR4') ? {
          hasPresumptiveBusiness: false,
          grossReceipts: 0,
          presumptiveRate: 8,
          presumptiveIncome: 0,
          optedOut: false,
        } : undefined,
        presumptiveProfessional: (selectedITR === 'ITR-4' || selectedITR === 'ITR4') ? {
          hasPresumptiveProfessional: false,
          grossReceipts: 0,
          presumptiveRate: 50,
          presumptiveIncome: 0,
          optedOut: false,
        } : undefined,
        capitalGains: (selectedITR === 'ITR-2' || selectedITR === 'ITR2' || selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? {
          hasCapitalGains: false,
          stcgDetails: [],
          ltcgDetails: [],
        } : 0,
        houseProperty: (selectedITR === 'ITR-2' || selectedITR === 'ITR2' || selectedITR === 'ITR-3' || selectedITR === 'ITR3' || selectedITR === 'ITR-4' || selectedITR === 'ITR4') ? {
          properties: [],
        } : [],
        foreignIncome: (selectedITR === 'ITR-2' || selectedITR === 'ITR2' || selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? {
          hasForeignIncome: false,
          foreignIncomeDetails: [],
        } : undefined,
        directorPartner: (selectedITR === 'ITR-2' || selectedITR === 'ITR2' || selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? {
          isDirector: false,
          directorIncome: 0,
          isPartner: false,
          partnerIncome: 0,
        } : undefined,
        otherIncome: 0,
      },
      balanceSheet: (selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? {
        hasBalanceSheet: false,
        assets: {
          currentAssets: { total: 0 },
          fixedAssets: { total: 0 },
          investments: 0,
          loansAdvances: 0,
          total: 0,
        },
        liabilities: {
          currentLiabilities: { total: 0 },
          longTermLiabilities: { total: 0 },
          capital: 0,
          total: 0,
        },
      } : undefined,
      auditInfo: (selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? {
        isAuditApplicable: false,
        auditReportNumber: '',
        auditReportDate: '',
        caDetails: {},
      } : undefined,
      deductions: {
        section80C: 0,
        section80D: 0,
        section80G: 0,
        section80TTA: 0,
        section80TTB: 0,
        otherDeductions: {},
      },
      taxesPaid: {
        tds: 0,
        advanceTax: 0,
        selfAssessmentTax: 0,
      },
      bankDetails: {
        accountNumber: '',
        ifsc: '',
        accountType: 'savings',
        bankName: '',
      },
    });
  };

  // Load filing if filingId is present
  useEffect(() => {
    const loadFiling = async () => {
      if (filingId && !currentFiling) {
        try {
          const response = await itrService.getUserITRs();
          const filings = response?.data || response?.filings || response?.all || [];
          const filing = filings.find(f => String(f.id) === String(filingId));
          if (filing) {
            setCurrentFiling(filing);
            if (filing.status === 'paused') {
              setShowResumeModal(true);
            }
            // Load form data if available
            if (filing.formData) {
              setFormData(filing.formData);
            }

            // Try to find and load associated draft for this filing
            try {
              const draftsResponse = await itrService.getUserDrafts();
              // Backend returns { success, data: [...], pagination }
              const drafts = draftsResponse?.data || draftsResponse?.drafts || [];
              const filingDraft = drafts.find(d => String(d.filingId) === String(filing.id));
              if (filingDraft && filingDraft.id) {
                // Load draft data
                const draftData = await itrService.getDraftById(filingDraft.id);
                if (draftData?.draft?.formData) {
                  setFormData(draftData.draft.formData);
                  // Update URL to include draftId if not already present
                  if (!draftId) {
                    navigate(`/itr/computation?filingId=${filingId}&draftId=${filingDraft.id}`, { replace: true });
                  }
                  // Restore other draft metadata
                  if (draftData.draft.assessmentYear) {
                    setAssessmentYear(draftData.draft.assessmentYear);
                  }
                  if (draftData.draft.taxRegime) {
                    setTaxRegime(draftData.draft.taxRegime);
                  }
                  if (draftData.draft.itrType) {
                    setSelectedITR(draftData.draft.itrType);
                  }
                  toast.success('Draft loaded for filing');
                }
              }
            } catch (draftError) {
              enterpriseLogger.warn('Failed to load draft for filing', { error: draftError, filingId });
              // Don't show error to user - filing data is already loaded
            }
          }
        } catch (error) {
          enterpriseLogger.error('Failed to load filing', { error });
          toast.error('Failed to load filing: ' + (error.message || 'Unknown error'));
        }
      }
    };
    loadFiling();
  }, [filingId, currentFiling, draftId, navigate]);

  const handleDownloadJSON = useCallback(async () => {
    // Check authentication before export
    if (!user) {
      toast.error('Please log in to download JSON file');
      return;
    }

    // Determine filing status for labels and warnings
    const isFiled = currentFiling && (currentFiling.status === 'submitted' || currentFiling.status === 'verified');
    const label = isFiled ? 'Filed JSON (Submitted to ITD)' : 'Draft JSON (Not Filed)';

    setIsDownloading(true);
    try {
      // Validate ITR-1 specific rules before export
      if (selectedITR === 'ITR-1' || selectedITR === 'ITR1') {
        const validationResult = validationEngine.validateBusinessRules(formData, selectedITR);
        if (!validationResult.isValid && validationResult.errors.length > 0) {
          toast.error(validationResult.errors[0], {
            duration: 6000,
          });
          setIsDownloading(false);
          return;
        }
      }

      // Validation is now handled by backend API during export

      const result = await itrJsonExportService.exportToJson(
        formData,
        selectedITR,
        assessmentYear,
      );

      // Trigger download
      itrJsonExportService.downloadJsonFile(
        result.jsonPayload,
        result.fileName,
      );

      if (isFiled) {
        toast.success(`Downloaded ${label}`);
      } else {
        toast(t => (
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-slate-900">Draft Downloaded</div>
              <div className="text-sm text-slate-600">This JSON is for review only. It is NOT filed.</div>
            </div>
          </div>
        ), { duration: 4000 });
      }
    } catch (error) {
      enterpriseLogger.error('Download error', { error });
      if (error.message && error.message.includes('logged in')) {
        toast.error('Please log in to download JSON file');
      } else if (error.message && error.message.includes('validation')) {
        toast.error(error.message, { duration: 6000 });
      } else {
        toast.error('Failed to download JSON file: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsDownloading(false);
    }
  }, [formData, selectedITR, assessmentYear, user, currentFiling]);

  // Base sections for all ITR types - ITR-Specific Labels
  const getSectionTitle = (sectionId) => {
    if (sectionId === 'income') {
      if (selectedITR === 'ITR-1' || selectedITR === 'ITR1') {
        return 'Salary Income (From Form 16)';
      }
      return 'Income Details';
    }
    if (sectionId === 'deductions') {
      return 'Deductions Under Chapter VI-A';
    }
    if (sectionId === 'taxComputation') {
      return `Tax Calculation - ${getITRDisplayName(selectedITR)} Compliant`;
    }
    return null;
  };

  const baseSections = [
    {
      id: 'personalInfo',
      title: 'Personal Information',
      icon: User,
      description: 'PAN, Name, Address, Contact details',
    },
    {
      id: 'income',
      title: getSectionTitle('income') || 'Income Details',
      icon: IndianRupee,
      description: selectedITR === 'ITR-1' || selectedITR === 'ITR1'
        ? 'Salary income from Form 16 and other sources'
        : selectedITR === 'ITR-3' || selectedITR === 'ITR3'
          ? 'Salary, Business, Professional, Capital Gains, House Property, Other Sources'
          : selectedITR === 'ITR-4' || selectedITR === 'ITR4'
            ? 'Salary, Presumptive income, House Property, Other Sources'
            : 'Salary, Capital Gains, House Property, Other Sources',
    },
    {
      id: 'exemptIncome',
      title: 'Exempt & Agricultural Income',
      icon: Wheat,
      description: 'Agricultural income, exempt allowances, partnership share',
    },
  ];

  // ITR-3 specific sections
  const itr3Sections = (selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? [
    {
      id: 'businessIncome',
      title: 'Business Income',
      icon: Building2,
      description: 'P&L statement, business details',
    },
    {
      id: 'professionalIncome',
      title: 'Professional Income',
      icon: FileText,
      description: 'Professional fees and expenses',
    },
    {
      id: 'balanceSheet',
      title: 'Balance Sheet',
      icon: FileText,
      description: 'Assets, Liabilities, Capital (optional)',
    },
    {
      id: 'auditInfo',
      title: 'Audit Information',
      icon: FileText,
      description: 'Tax audit details (if applicable)',
    },
  ] : [];

  // ITR-4 specific sections
  const itr4Sections = (selectedITR === 'ITR-4' || selectedITR === 'ITR4') ? [
    {
      id: 'presumptiveIncome',
      title: 'Presumptive Income (44AD/44ADA)',
      icon: Calculator,
      description: 'Business income u/s 44AD, Professional income u/s 44ADA',
    },
    {
      id: 'goodsCarriage',
      title: 'Goods Carriage (44AE)',
      icon: FileText,
      description: 'Presumptive income from plying, hiring or leasing goods carriages',
    },
  ] : [];

  // Schedule FA section for ITR-2 and ITR-3 (hidden until triggered)
  const scheduleFASection = scheduleFAEligible ? [
    {
      id: 'scheduleFA',
      title: 'Schedule FA - Foreign Assets',
      icon: Globe,
      description: 'Foreign bank accounts, equity holdings, immovable property',
    },
  ] : [];

  // Common sections for all ITR types
  const commonSections = [
    {
      id: 'deductions',
      title: 'Deductions Under Chapter VI-A',
      icon: Calculator,
      description: 'Section 80C, 80D, 80G, and other deductions',
    },
    {
      id: 'taxesPaid',
      title: 'Tax Credit and Payment',
      icon: CreditCard,
      description: 'TDS, Advance Tax, Self Assessment Tax',
    },
    {
      id: 'taxComputation',
      title: 'Tax Calculation',
      icon: Building2,
      description: 'Slab-wise tax breakdown and liability calculation',
    },
    {
      id: 'bankDetails',
      title: 'Bank Details',
      icon: FileText,
      description: 'Refund/Payment bank account information',
    },
  ];

  // Helper: single source of truth (sectionFlow) for ITR visibility + progressive disclosure
  const shouldShowSection = useCallback(
    (sectionId) => shouldShowGuidedSection(sectionId, formData, selectedITR, sectionVisibilityOpts),
    [formData, selectedITR, sectionVisibilityOpts],
  );

  // Combine all sections and filter based on ITR type - Memoized
  const allSections = useMemo(() => [...baseSections, ...itr3Sections, ...itr4Sections, ...scheduleFASection, ...commonSections], [baseSections, itr3Sections, itr4Sections, scheduleFASection, commonSections]);
  const sections = useMemo(() => allSections.filter((section) => shouldShowSection(section.id)), [allSections, shouldShowSection]);
  const orderedSections = useMemo(() => orderGuidedSections(sections), [sections]);
  const activeSection = useMemo(
    () => orderedSections.find((s) => s.id === activeSectionId) || orderedSections[0] || null,
    [orderedSections, activeSectionId],
  );
  const activeSectionTitle = activeSection?.title || 'Section';
  const nextSectionId = useMemo(
    () => getNextSectionId(orderedSections, activeSectionId),
    [orderedSections, activeSectionId],
  );
  const prevSectionId = useMemo(
    () => getPrevSectionId(orderedSections, activeSectionId),
    [orderedSections, activeSectionId],
  );
  const nextSection = useMemo(
    () => orderedSections.find((s) => s.id === nextSectionId) || null,
    [orderedSections, nextSectionId],
  );
  const missingRequiredActive = useMemo(
    () => getMissingRequired(activeSectionId, formData, selectedITR),
    [activeSectionId, formData, selectedITR],
  );
  const canGoNext = useMemo(() => {
    if (!nextSectionId) return false;
    return canProceedGuided(activeSectionId, formData, selectedITR);
  }, [nextSectionId, activeSectionId, formData, selectedITR]);

  const shouldTrackSectionCompletion = useCallback((sectionId) => {
    if (!sectionId) return false;
    if (['personalInfo', 'income', 'bankDetails'].includes(sectionId)) return true;
    if (sectionId === 'balanceSheet') return !!(formData.balanceSheet?.hasBalanceSheet || formData.balanceSheet?.balanceSheet?.hasBalanceSheet);
    if (sectionId === 'auditInfo') return !!(formData.auditInfo?.isAuditApplicable || formData.auditInfo?.auditInfo?.isAuditApplicable);
    return false;
  }, [formData.balanceSheet?.hasBalanceSheet, formData.balanceSheet?.balanceSheet?.hasBalanceSheet, formData.auditInfo?.isAuditApplicable, formData.auditInfo?.auditInfo?.isAuditApplicable]);

  const goNextSection = useCallback(() => {
    const toId = nextSectionId;
    if (!toId) return;

    const canProceed = canProceedGuided(activeSectionId, formData, selectedITR);
    if (!canProceed) return;

    // Mark current section completed (once per journey) for key sections only.
    if (shouldTrackSectionCompletion(activeSectionId) && !sectionCompletedOnceRef.current.has(activeSectionId)) {
      sectionCompletedOnceRef.current.add(activeSectionId);
      trackEvent('itr_section_completed', { sectionId: activeSectionId, itrType: selectedITR || null });
    }

    trackEvent('itr_section_next_clicked', {
      fromSectionId: activeSectionId,
      toSectionId: toId,
      itrType: selectedITR || null,
    });

    setActiveSectionId(toId);
  }, [nextSectionId, activeSectionId, formData, selectedITR, shouldTrackSectionCompletion]);

  const goPrevSection = useCallback(() => {
    const toId = prevSectionId;
    if (!toId) return;
    setActiveSectionId(toId);
  }, [prevSectionId]);

  // Initialize activeSectionId to first section if not set
  useEffect(() => {
    if (orderedSections.length > 0 && !orderedSections.find(s => s.id === activeSectionId)) {
      setActiveSectionId(orderedSections[0].id);
    }
  }, [orderedSections, activeSectionId]);

  // Accept initial section focus from review (or other entry points)
  useEffect(() => {
    if (initialSectionAppliedRef.current) return;
    const requested = location.state?.initialSectionId;
    if (!requested) return;
    if (!orderedSections.find((s) => s.id === requested)) return;
    initialSectionAppliedRef.current = true;
    setActiveSectionId(requested);
  }, [location.state?.initialSectionId, orderedSections]);

  // Helper function to convert Assessment Year to Financial Year format - Memoized
  const getFinancialYear = useCallback((ay) => {
    if (!ay) return '';
    const [startYear] = ay.split('-').map(Number);
    const fyStart = startYear - 1;
    return `FY ${fyStart}-${startYear.toString().slice(-2)}`;
  }, []);

  // Get ITR display name with full form name - Memoized
  const getITRDisplayName = useCallback((itr) => {
    const itrNames = {
      'ITR-1': 'ITR-1 (SAHAJ)',
      'ITR1': 'ITR-1 (SAHAJ)',
      'ITR-2': 'ITR-2',
      'ITR2': 'ITR-2',
      'ITR-3': 'ITR-3',
      'ITR3': 'ITR-3',
      'ITR-4': 'ITR-4 (SUGAM)',
      'ITR4': 'ITR-4 (SUGAM)',
    };
    return itrNames[itr] || itr;
  }, []);

  // Get user name for display - Memoized
  const userDisplayName = useMemo(() => {
    if (selectedPerson?.name) return selectedPerson.name;
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user?.email?.split('@')[0] || 'User';
  }, [selectedPerson?.name, user?.firstName, user?.lastName, user?.email]);

  // Memoized gross income calculation - expensive operation
  const grossIncome = useMemo(() => {
    const income = formData?.income || {};
    let total = 0;

    // Salary income
    total += parseFloat(income.salary) || 0;

    // Business income (excluded for ITR-1)
    if (selectedITR !== 'ITR-1' && selectedITR !== 'ITR1') {
      if (typeof income.businessIncome === 'object' && income.businessIncome?.businesses) {
        total += (income.businessIncome.businesses || []).reduce((sum, b) =>
          sum + (parseFloat(b.pnl?.netProfit || b.netProfit || 0)), 0);
      } else {
        total += parseFloat(income.businessIncome) || 0;
      }
    }

    // Professional income (excluded for ITR-1, ITR-2, and ITR-4, included for ITR-3)
    if (selectedITR !== 'ITR-1' && selectedITR !== 'ITR1' && selectedITR !== 'ITR-2' && selectedITR !== 'ITR2' && selectedITR !== 'ITR-4' && selectedITR !== 'ITR4') {
      if (typeof income.professionalIncome === 'object' && income.professionalIncome?.professions) {
        total += (income.professionalIncome.professions || []).reduce((sum, p) =>
          sum + (parseFloat(p.pnl?.netIncome || p.netIncome || p.netProfit || 0)), 0);
      } else {
        total += parseFloat(income.professionalIncome) || 0;
      }
    }

    // Other sources income (from OtherSourcesForm - structured format)
    if (typeof income.otherSources === 'object' && income.otherSources) {
      // Use totalOtherSourcesIncome if available, otherwise calculate from components
      const otherSourcesTotal = parseFloat(income.otherSources.totalOtherSourcesIncome || 0) ||
        (parseFloat(income.otherSources.totalInterestIncome || 0) +
          parseFloat(income.otherSources.totalOtherIncome || 0));
      total += otherSourcesTotal;
    } else {
      // Fallback to legacy otherIncome field for backward compatibility
      total += parseFloat(income.otherIncome) || 0;
    }

    // Also check formData.otherSources (root level) for backward compatibility
    if (formData?.otherSources && typeof formData.otherSources === 'object') {
      const rootOtherSourcesTotal = parseFloat(formData.otherSources.totalOtherSourcesIncome || 0) ||
        (parseFloat(formData.otherSources.totalInterestIncome || 0) +
          parseFloat(formData.otherSources.totalOtherIncome || 0));
      // Only add if not already included via income.otherSources
      if (!income.otherSources || !income.otherSources.totalOtherSourcesIncome) {
        total += rootOtherSourcesTotal;
      }
    }

    // Capital gains
    if (typeof income.capitalGains === 'object' && income.capitalGains?.stcgDetails) {
      total += (income.capitalGains.stcgDetails || []).reduce((sum, e) => sum + (parseFloat(e.gainAmount) || 0), 0) +
        (income.capitalGains.ltcgDetails || []).reduce((sum, e) => sum + (parseFloat(e.gainAmount) || 0), 0);
    } else {
      total += parseFloat(income.capitalGains) || 0;
    }

    // House property (max 1 property for ITR-1)
    if (typeof income.houseProperty === 'object' && income.houseProperty?.properties) {
      const properties = (selectedITR === 'ITR-1' || selectedITR === 'ITR1')
        ? income.houseProperty.properties.slice(0, 1) // Only first property for ITR-1
        : income.houseProperty.properties;
      total += properties.reduce((sum, p) => {
        const rental = parseFloat(p.annualRentalIncome) || 0;
        const taxes = parseFloat(p.municipalTaxes) || 0;
        const interest = parseFloat(p.interestOnLoan) || 0;
        return sum + Math.max(0, rental - taxes - interest);
      }, 0);
    } else {
      total += parseFloat(income.houseProperty) || 0;
    }

    // Foreign income (excluded for ITR-1 and ITR-4, included for ITR-2 and ITR-3)
    if (selectedITR !== 'ITR-1' && selectedITR !== 'ITR1' && selectedITR !== 'ITR-4' && selectedITR !== 'ITR4') {
      total += (income.foreignIncome?.foreignIncomeDetails || []).reduce((sum, e) =>
        sum + (parseFloat(e.amountInr) || 0), 0);
    }

    // Director/Partner income (excluded for ITR-1 and ITR-4, included for ITR-2 and ITR-3)
    if (selectedITR !== 'ITR-1' && selectedITR !== 'ITR1' && selectedITR !== 'ITR-4' && selectedITR !== 'ITR4') {
      total += parseFloat(income.directorPartner?.directorIncome) || 0;
      total += parseFloat(income.directorPartner?.partnerIncome) || 0;
    }

    // Presumptive business income (ITR-4 only)
    if (selectedITR === 'ITR-4' || selectedITR === 'ITR4') {
      const presumptiveBusiness = income.presumptiveBusiness || {};
      if (presumptiveBusiness.hasPresumptiveBusiness && !presumptiveBusiness.optedOut) {
        const presumptiveRate = presumptiveBusiness.presumptiveRate || 8;
        total += (presumptiveBusiness.grossReceipts || 0) * (presumptiveRate / 100);
      } else if (presumptiveBusiness.hasPresumptiveBusiness && presumptiveBusiness.optedOut) {
        total += parseFloat(presumptiveBusiness.actualProfit || 0);
      }
    }

    // Presumptive professional income (ITR-4 only)
    if (selectedITR === 'ITR-4' || selectedITR === 'ITR4') {
      const presumptiveProfessional = income.presumptiveProfessional || {};
      if (presumptiveProfessional.hasPresumptiveProfessional && !presumptiveProfessional.optedOut) {
        const presumptiveRate = presumptiveProfessional.presumptiveRate || 50;
        total += (presumptiveProfessional.grossReceipts || 0) * (presumptiveRate / 100);
      } else if (presumptiveProfessional.hasPresumptiveProfessional && presumptiveProfessional.optedOut) {
        total += parseFloat(presumptiveProfessional.actualIncome || 0);
      }
    }

    // Goods carriage income (ITR-4 only, Section 44AE)
    if (selectedITR === 'ITR-4' || selectedITR === 'ITR4') {
      const goodsCarriage = formData.goodsCarriage || {};
      if (goodsCarriage.hasGoodsCarriage) {
        const heavyVehicles = goodsCarriage.heavyVehicles || 0;
        const lightVehicles = goodsCarriage.lightVehicles || 0;
        // Heavy vehicle: ₹1,000 per ton per month, Light vehicle: ₹7,500 per vehicle per month
        const heavyVehicleIncome = (heavyVehicles * 1000 * 12); // Assuming average tonnage calculation
        const lightVehicleIncome = (lightVehicles * 7500 * 12);
        total += heavyVehicleIncome + lightVehicleIncome;
      }
    }

    // Validation: Log warning if income sources might be missing (development only)
    if (process.env.NODE_ENV === 'development') {
      const hasOtherSources = (income.otherSources && (
        (income.otherSources.totalOtherSourcesIncome || 0) > 0 ||
        (income.otherSources.totalInterestIncome || 0) > 0 ||
        (income.otherSources.totalOtherIncome || 0) > 0
      )) || (formData?.otherSources && (
        (formData.otherSources.totalOtherSourcesIncome || 0) > 0 ||
        (formData.otherSources.totalInterestIncome || 0) > 0 ||
        (formData.otherSources.totalOtherIncome || 0) > 0
      ));

      if (hasOtherSources && total === 0) {
        enterpriseLogger.warn('[Income Validation] otherSources data exists but grossIncome is 0 - check aggregation logic');
      }

      // Check if otherSources is in formData but not in income
      if (formData?.otherSources && !income.otherSources) {
        enterpriseLogger.warn('[Income Validation] otherSources found at root level but not in income.otherSources - may not be aggregated correctly');
      }

      // Check for very large numbers that might cause precision issues
      if (total > 100000000) { // 10 crores
        enterpriseLogger.warn('[Income Validation] Very large gross income detected', { total });
      }

      // Check for income structure consistency
      const hasStructuredBusiness = typeof income.businessIncome === 'object' && income.businessIncome?.businesses;
      const hasLegacyBusiness = typeof income.businessIncome === 'number' && income.businessIncome > 0;
      if (hasStructuredBusiness && hasLegacyBusiness) {
        enterpriseLogger.warn('[Income Validation] Both structured and legacy businessIncome formats detected - potential data inconsistency');
      }

      // Check for negative income values
      if (total < 0) {
        enterpriseLogger.error('[Income Validation] Negative gross income detected', { total });
      }
    }

    return total;
  }, [formData?.income, formData?.otherSources, selectedITR]);

  // Memoized deductions calculation
  const deductions = useMemo(() => {
    const deductionsData = formData?.deductions || {};
    const oldRegimeDeductions =
      (parseFloat(deductionsData.section80C) || 0) +
      (parseFloat(deductionsData.section80D) || 0) +
      (parseFloat(deductionsData.section80G) || 0) +
      (parseFloat(deductionsData.section80TTA) || 0) +
      (parseFloat(deductionsData.section80TTB) || 0) +
      Object.values(deductionsData.otherDeductions || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

    return {
      old: oldRegimeDeductions,
      new: 50000, // Standard deduction for new regime
    };
  }, [formData?.deductions]);

  // Memoized taxable income calculation
  const taxableIncome = useMemo(() => {
    return {
      old: Math.max(0, grossIncome - deductions.old),
      new: Math.max(0, grossIncome - deductions.new),
    };
  }, [grossIncome, deductions]);

  // Memoized TDS paid calculation
  const tdsPaid = useMemo(() => {
    const taxesPaid = formData?.taxesPaid || {};
    return (parseFloat(taxesPaid.tds) || 0) +
      (parseFloat(taxesPaid.advanceTax) || 0) +
      (parseFloat(taxesPaid.selfAssessmentTax) || 0);
  }, [formData?.taxesPaid]);

  // Memoized tax payable
  const taxPayable = useMemo(() => ({
    old: regimeComparison?.oldRegime?.totalTax || taxComputation?.totalTax || 0,
    new: regimeComparison?.newRegime?.totalTax || 0,
  }), [regimeComparison, taxComputation]);

  return (
    <div className="bg-slate-50 flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Enhanced Header - ITR-Specific Dashboard */}
      <header className="bg-white border-b border-slate-200 z-50 flex-shrink-0">
        <div className="max-w-[1400px] mx-auto px-3">
          {/* Main Header Bar - Compact 48px height */}
          <div className="flex items-center justify-between h-12">
            {/* Left: Back + Title - Compact spacing */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleBack}
                className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4 text-slate-600" />
              </button>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold font-display text-slate-900">
                  Income Tax Computation
                </h1>
                {userDisplayName && (
                  <>
                    <span className="text-slate-300 text-body-small">•</span>
                    <span className="text-body-small font-medium text-slate-700">{userDisplayName}</span>
                  </>
                )}
                <span className="text-slate-300 text-body-small">•</span>
                <span className="text-body-small font-medium text-slate-700">{getFinancialYear(assessmentYear)}</span>
              </div>
            </div>

            {/* Center: ITR Toggle and Regime Toggle */}
            <div className="hidden lg:flex items-center gap-2">
              <ITRToggle
                selectedITR={selectedITR}
                onITRChange={async (newITR) => {
                  // Route ITR change through backend Domain Core (if filing exists)
                  if (effectiveFilingId && newITR !== selectedITR) {
                    try {
                      const result = await itrService.changeITRType(effectiveFilingId, newITR);
                      if (result?.filing) {
                        // Backend validated and changed ITR type
                        setSelectedITR(newITR);
                        toast.success('ITR type changed successfully');
                        // If recommendation suggests different ITR, show warning
                        if (result.filing.recommendation) {
                          toast(`Recommended ITR: ${result.filing.recommendation.recommended} - ${result.filing.recommendation.reason}`, {
                            icon: 'ℹ️',
                            duration: 5000,
                          });
                        }
                        return; // Exit early - backend handled the change
                      }
                    } catch (error) {
                      toast.error(error.response?.data?.message || 'Failed to change ITR type');
                      enterpriseLogger.error('ITR type change failed', {
                        filingId: effectiveFilingId,
                        newITR,
                        error: error.message,
                      });
                      return; // Don't proceed with frontend change if backend rejected
                    }
                  }

                  // For new drafts (no filingId yet) or if backend change succeeded, continue with frontend data sanitization
                  // Validate ITR change for ITR-1
                  if (newITR === 'ITR-1' || newITR === 'ITR1') {
                    // Check if current data is compatible with ITR-1
                    const validationResult = validationEngine.validateBusinessRules(formData, newITR);
                    if (!validationResult.isValid && validationResult.errors.length > 0) {
                      toast.error(validationResult.errors[0] + ' Cannot switch to ITR-1.', { duration: 6000 });
                      return; // Don't change ITR type
                    }
                    // Sanitize form data for ITR-1
                    setFormData(prev => {
                      const updated = { ...prev };
                      // Ensure businessIncome is 0 (not an object)
                      if (typeof updated.income?.businessIncome === 'object') {
                        updated.income.businessIncome = 0;
                      }
                      // Ensure professionalIncome is 0 (not an object)
                      if (typeof updated.income?.professionalIncome === 'object') {
                        updated.income.professionalIncome = 0;
                      }
                      // Ensure capitalGains is 0 (not an object)
                      if (typeof updated.income?.capitalGains === 'object') {
                        updated.income.capitalGains = 0;
                      }
                      // Ensure only one house property
                      if (updated.income?.houseProperty?.properties?.length > 1) {
                        updated.income.houseProperty.properties = updated.income.houseProperty.properties.slice(0, 1);
                        toast.warning('Only first house property retained for ITR-1');
                      }
                      // Remove ITR-3/4 specific fields
                      delete updated.balanceSheet;
                      delete updated.auditInfo;
                      delete updated.scheduleFA;
                      return updated;
                    });
                  }

                  // Validate ITR change for ITR-2
                  if (newITR === 'ITR-2' || newITR === 'ITR2') {
                    // Check if current data is compatible with ITR-2
                    const validationResult = validationEngine.validateBusinessRules(formData, newITR);
                    if (!validationResult.isValid && validationResult.errors.length > 0) {
                      toast.error(validationResult.errors[0] + ' Cannot switch to ITR-2.', { duration: 6000 });
                      return; // Don't change ITR type
                    }
                    // Sanitize form data for ITR-2
                    setFormData(prev => {
                      const updated = { ...prev };
                      // Ensure businessIncome is 0 (not an object)
                      if (typeof updated.income?.businessIncome === 'object') {
                        updated.income.businessIncome = 0;
                      }
                      // Ensure professionalIncome is 0 (not an object)
                      if (typeof updated.income?.professionalIncome === 'object') {
                        updated.income.professionalIncome = 0;
                      }
                      // Ensure capitalGains is an object (not 0)
                      if (typeof updated.income?.capitalGains === 'number' && updated.income.capitalGains === 0) {
                        updated.income.capitalGains = {
                          hasCapitalGains: false,
                          stcgDetails: [],
                          ltcgDetails: [],
                        };
                      }
                      // Ensure foreignIncome is an object (not undefined)
                      if (updated.income?.foreignIncome === undefined) {
                        updated.income.foreignIncome = {
                          hasForeignIncome: false,
                          foreignIncomeDetails: [],
                        };
                      }
                      // Ensure directorPartner is an object (not undefined)
                      if (updated.income?.directorPartner === undefined) {
                        updated.income.directorPartner = {
                          isDirector: false,
                          directorIncome: 0,
                          isPartner: false,
                          partnerIncome: 0,
                        };
                      }
                      // Remove ITR-3/4 specific fields
                      delete updated.balanceSheet;
                      delete updated.auditInfo;
                      delete updated.presumptiveIncome;
                      delete updated.goodsCarriage;
                      return updated;
                    });
                  }

                  // Validate ITR change for ITR-3
                  if (newITR === 'ITR-3' || newITR === 'ITR3') {
                    // Check if current data is compatible with ITR-3
                    const validationResult = validationEngine.validateBusinessRules(formData, newITR);
                    if (!validationResult.isValid && validationResult.errors.length > 0) {
                      toast.error(validationResult.errors[0] + ' Cannot switch to ITR-3.', { duration: 6000 });
                      return; // Don't change ITR type
                    }
                    // Sanitize form data for ITR-3
                    setFormData(prev => {
                      const updated = { ...prev };
                      // Ensure businessIncome is an object (not a number)
                      if (typeof updated.income?.businessIncome === 'number') {
                        updated.income.businessIncome = {
                          businesses: [],
                        };
                      }
                      // Ensure professionalIncome is an object (not a number)
                      if (typeof updated.income?.professionalIncome === 'number') {
                        updated.income.professionalIncome = {
                          professions: [],
                        };
                      }
                      // Ensure capitalGains is an object (not 0)
                      if (typeof updated.income?.capitalGains === 'number' && updated.income.capitalGains === 0) {
                        updated.income.capitalGains = {
                          hasCapitalGains: false,
                          stcgDetails: [],
                          ltcgDetails: [],
                        };
                      }
                      // Ensure foreignIncome is an object (not undefined)
                      if (updated.income?.foreignIncome === undefined) {
                        updated.income.foreignIncome = {
                          hasForeignIncome: false,
                          foreignIncomeDetails: [],
                        };
                      }
                      // Ensure directorPartner is an object (not undefined)
                      if (updated.income?.directorPartner === undefined) {
                        updated.income.directorPartner = {
                          isDirector: false,
                          directorIncome: 0,
                          isPartner: false,
                          partnerIncome: 0,
                        };
                      }
                      // Ensure balanceSheet is an object (not undefined)
                      if (updated.balanceSheet === undefined) {
                        updated.balanceSheet = {
                          hasBalanceSheet: false,
                          assets: {
                            currentAssets: { total: 0 },
                            fixedAssets: { total: 0 },
                            investments: 0,
                            loansAdvances: 0,
                            total: 0,
                          },
                          liabilities: {
                            currentLiabilities: { total: 0 },
                            longTermLiabilities: { total: 0 },
                            capital: 0,
                            total: 0,
                          },
                        };
                      }
                      // Ensure auditInfo is an object (not undefined)
                      if (updated.auditInfo === undefined) {
                        updated.auditInfo = {
                          isAuditApplicable: false,
                          auditReportNumber: '',
                          auditReportDate: '',
                          caDetails: {},
                        };
                      }
                      // Remove ITR-4 specific fields
                      delete updated.presumptiveIncome;
                      delete updated.goodsCarriage;
                      delete updated.presumptiveBusiness;
                      delete updated.presumptiveProfessional;
                      return updated;
                    });
                  }

                  // Validate ITR change for ITR-4
                  if (newITR === 'ITR-4' || newITR === 'ITR4') {
                    // Check if current data is compatible with ITR-4
                    const validationResult = validationEngine.validateBusinessRules(formData, newITR);
                    if (!validationResult.isValid && validationResult.errors.length > 0) {
                      toast.error(validationResult.errors[0] + ' Cannot switch to ITR-4.', { duration: 6000 });
                      return; // Don't change ITR type
                    }
                    // Sanitize form data for ITR-4
                    setFormData(prev => {
                      const updated = { ...prev };
                      // Ensure businessIncome is 0 (not an object)
                      if (typeof updated.income?.businessIncome === 'object') {
                        updated.income.businessIncome = 0;
                      }
                      // Ensure professionalIncome is 0 (not an object)
                      if (typeof updated.income?.professionalIncome === 'object') {
                        updated.income.professionalIncome = 0;
                      }
                      // Ensure capitalGains is 0 (not an object)
                      if (typeof updated.income?.capitalGains === 'object') {
                        updated.income.capitalGains = 0;
                      }
                      // Remove foreign income if it exists
                      if (updated.income?.foreignIncome !== undefined) {
                        const { foreignIncome, ...restIncome } = updated.income;
                        updated.income = restIncome;
                      }
                      // Remove director/partner income if it exists
                      if (updated.income?.directorPartner !== undefined) {
                        const { directorPartner, ...restIncome } = updated.income;
                        updated.income = restIncome;
                      }
                      // Remove balance sheet if it exists
                      if (updated.balanceSheet !== undefined) {
                        delete updated.balanceSheet;
                      }
                      // Remove audit info if it exists
                      if (updated.auditInfo !== undefined) {
                        delete updated.auditInfo;
                      }
                      // Remove Schedule FA if it exists
                      if (updated.scheduleFA !== undefined) {
                        delete updated.scheduleFA;
                      }
                      // Initialize presumptive business income if it doesn't exist
                      if (updated.income?.presumptiveBusiness === undefined) {
                        updated.income.presumptiveBusiness = {
                          hasPresumptiveBusiness: false,
                          grossReceipts: 0,
                          presumptiveRate: 8,
                          presumptiveIncome: 0,
                          optedOut: false,
                        };
                      }
                      // Initialize presumptive professional income if it doesn't exist
                      if (updated.income?.presumptiveProfessional === undefined) {
                        updated.income.presumptiveProfessional = {
                          hasPresumptiveProfessional: false,
                          grossReceipts: 0,
                          presumptiveRate: 50,
                          presumptiveIncome: 0,
                          optedOut: false,
                        };
                      }
                      return updated;
                    });
                  }
                  setSelectedITR(newITR);
                }}
                currentFormData={formData}
                onValidateCompatibility={async (currentITR, proposedITR, formData) => {
                  // Basic compatibility check
                  const isCompatible =
                    (currentITR === 'ITR-1' && proposedITR === 'ITR-2') ||
                    (currentITR === 'ITR-2' && proposedITR === 'ITR-1') ||
                    (currentITR === 'ITR-1' && proposedITR === 'ITR-3') ||
                    (currentITR === 'ITR-3' && proposedITR === 'ITR-1');

                  return {
                    isCompatible,
                    compatibleFields: isCompatible ? ['personalInfo', 'income', 'deductions'] : [],
                    incompatibleFields: !isCompatible ? ['businessIncome', 'professionalIncome'] : [],
                    reason: !isCompatible ? 'Switching ITR types may cause data loss for incompatible sections.' : null,
                  };
                }}
              />
              <RegimeToggle
                regime={taxRegime}
                onRegimeChange={handleRegimeChange}
                savings={regimeComparison ? {
                  amount: Math.abs(regimeComparison.savings || 0),
                  betterRegime: (regimeComparison.savings || 0) > 0 ? 'new' : 'old',
                } : null}
                isLoading={isComputingTax}
                disabled={!!taxComputation}
              />
            </div>

            {/* Right: Actions - Compact */}
            <div className="flex items-center gap-1.5">
              {/* Auto-save indicator - compact */}
              {!isReadOnly && (
                <div className="hidden sm:flex items-center text-[10px] text-slate-500" style={{ gap: '2px' }}>
                  {!navigator.onLine ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center text-warning-500"
                      style={{ gap: '2px' }}
                    >
                      <CloudOff className="w-3 h-3" />
                    </motion.span>
                  ) : autoSaveStatus === 'saving' ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center text-info-500"
                      style={{ gap: '2px' }}
                    >
                      <Cloud className="w-3 h-3 animate-pulse" />
                    </motion.span>
                  ) : autoSaveStatus === 'error' ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center text-error-500"
                      style={{ gap: '2px' }}
                    >
                      <AlertCircle className="w-3 h-3" />
                    </motion.span>
                  ) : (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center text-success-500"
                      style={{ gap: '2px' }}
                    >
                      <Check className="w-3 h-3" />
                    </motion.span>
                  )}
                </div>
              )}

              {/* Invoice Badge - compact */}
              {currentFiling?.invoice && (
                <InvoiceBadge invoice={currentFiling.invoice} />
              )}

              {/* Pause/Resume */}
              {currentFiling && (currentFiling.status === 'draft' || currentFiling.status === 'paused') && (
                <PauseResumeButton
                  filing={currentFiling}
                  onPaused={handlePaused}
                  onResumed={handleResumed}
                />
              )}

              {/* Save button - compact */}
              {!isReadOnly && (
                <button
                  onClick={() => handleSaveDraft({ exitAfterSave: false })}
                  disabled={!allowedActions.includes('edit_data') || isSaving}
                  className="flex items-center px-2 py-1 text-body-small font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                  style={{ gap: '2px' }}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save</span>
                </button>
              )}

              {/* Save & Exit */}
              {!isReadOnly && (
                <button
                  onClick={() => handleSaveDraft({ exitAfterSave: true })}
                  disabled={isSaving}
                  className="flex items-center px-2 py-1 text-body-small font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                  style={{ gap: '2px' }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save &amp; Exit</span>
                  <span className="sm:hidden">Exit</span>
                </button>
              )}

              {/* Compute / Refresh Tax (manual mode) */}
              {!isReadOnly && (
                <button
                  onClick={handleComputeTax}
                  disabled={!allowedActions.includes('compute_tax') || isComputingTax}
                  className="flex items-center px-2 py-1 text-body-small font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                  style={{ gap: '2px' }}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isComputingTax ? 'Computing…' : 'Compute'}</span>
                </button>
              )}

              {/* Next section (guided flow) */}
              {!isReadOnly && nextSectionId && (
                <button
                  onClick={goNextSection}
                  disabled={!canGoNext}
                  title={
                    canGoNext
                      ? `Next: ${nextSection?.title || 'Next section'}`
                      : `Complete required fields in ${activeSectionTitle} to continue.`
                  }
                  className="flex items-center px-2 py-1 text-body-small font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ gap: '2px' }}
                >
                  <span className="hidden sm:inline">
                    Next{nextSection?.title ? `: ${nextSection.title}` : ''}
                  </span>
                  <span className="sm:hidden">Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {/* V3.4: Send to CA Button */}
              {!isReadOnly && taxComputation?.caContext?.caAssistEligible && (
                <button
                  onClick={() => setShowSubmitCAModal(true)}
                  disabled={currentFiling?.status === 'SUBMITTED_TO_CA' || currentFiling?.status === 'FILED'}
                  className={`flex items-center px-4 py-1.5 text-body-small font-bold text-white rounded-xl transition-colors shadow-sm
                        ${currentFiling?.status === 'SUBMITTED_TO_CA'
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  style={{ gap: '6px' }}
                >
                  <Send className="w-3.5 h-3.5" />
                  {currentFiling?.status === 'SUBMITTED_TO_CA' ? 'Sent to CA' : 'Send to CA'}
                </button>
              )}

              {/* Download JSON button - compact */}
              {!isReadOnly && (
                <button
                  onClick={handleDownloadJSON}
                  disabled={isDownloading}
                  className="flex items-center px-2 py-1 text-body-small font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                  style={{ gap: '2px' }}
                >
                  {isDownloading ? (
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {currentFiling && (currentFiling.status === 'submitted' || currentFiling.status === 'verified')
                      ? 'Filed JSON'
                      : 'Draft JSON'}
                  </span>
                </button>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* Tax Computation Bar - Sticky top (Desktop) / Fixed top (Mobile) */}
      <TaxComputationBar
        grossIncome={grossIncome}
        deductions={deductions}
        taxableIncome={taxableIncome}
        taxPayable={taxPayable}
        tdsPaid={tdsPaid}
        onFileClick={async () => {
          // Core rule: never enter Review without a persisted draft.
          // This prevents Review from validating/submitting stale draft snapshots.
          try {
            let nextDraftId = effectiveDraftId || draftIdLocal || null;
            let nextFilingId = effectiveFilingId || filingIdLocal || null;

            if (!nextDraftId) {
              await handleSaveDraft({ exitAfterSave: false });
              nextDraftId = draftIdLocal || searchParams.get('draftId') || null;
              nextFilingId = filingIdLocal || searchParams.get('filingId') || null;
            }

            if (!nextDraftId) {
              toast.error('Please save once before filing.');
              return;
            }

            const qs = new URLSearchParams();
            qs.set('draftId', nextDraftId);
            if (nextFilingId) qs.set('filingId', nextFilingId);
            if (selectedITR) qs.set('itrType', selectedITR);
            if (assessmentYear) qs.set('ay', assessmentYear);

            navigate(`/itr/review?${qs.toString()}`, {
              state: {
                selectedITR,
                assessmentYear,
                filingId: nextFilingId,
                draftId: nextDraftId,
              },
            });
          } catch (e) {
            toast.error('Failed to save before filing. Please try again.');
          }
        }}
        // Legacy props for backward compatibility
        formData={formData}
        taxComputation={taxComputation}
        regimeComparison={regimeComparison}
        selectedRegime={taxRegime}
        isComputingTax={isComputingTax}
      />

      {/* Resume Modal */}
      {showResumeModal && currentFiling && (
        <ResumeFilingModal />
      )}
      {/* Note: ResumeFilingModal was incomplete in original snippet, assuming it closes properly */}

      {/* V3.4 Submit Modal */}
      <SubmitToCAModal
        isOpen={showSubmitCAModal}
        onClose={() => setShowSubmitCAModal(false)}
        onConfirm={handleSubmitToCA}
        loading={submitCALoading}
      />
      filing={currentFiling}
      onResume={handleResumeFromModal}
      onStartFresh={handleStartFresh}
      onClose={() => setShowResumeModal(false)}
        />
      )}

      {/* Filing Confirmation Panel - Safety step before filing */}
      {showFilingConfirmation && (
        <FilingConfirmationPanel
          blueprint={blueprint}
          formData={formData}
          taxComputation={taxComputation}
          selectedITR={selectedITR}
          assessmentYear={assessmentYear}
          taxRegime={taxRegime}
          isSubmitting={isSaving}
          onConfirm={async () => {
            // Navigate to review page for final submission
            try {
              let nextDraftId = effectiveDraftId || draftIdLocal || null;
              let nextFilingId = effectiveFilingId || filingIdLocal || null;

              if (!nextDraftId) {
                await handleSaveDraft({ exitAfterSave: false });
                nextDraftId = draftIdLocal || searchParams.get('draftId') || null;
                nextFilingId = filingIdLocal || searchParams.get('filingId') || null;
              }

              if (!nextDraftId) {
                toast.error('Please save once before filing.');
                setShowFilingConfirmation(false);
                return;
              }

              const qs = new URLSearchParams();
              qs.set('draftId', nextDraftId);
              if (nextFilingId) qs.set('filingId', nextFilingId);
              if (selectedITR) qs.set('itrType', selectedITR);
              if (assessmentYear) qs.set('ay', assessmentYear);

              setShowFilingConfirmation(false);
              navigate(`/itr/review?${qs.toString()}`, {
                state: {
                  selectedITR,
                  assessmentYear,
                  filingId: nextFilingId,
                  draftId: nextDraftId,
                  fromConfirmation: true,
                },
              });
            } catch (e) {
              toast.error('Failed to prepare filing. Please try again.');
              setShowFilingConfirmation(false);
            }
          }}
          onCancel={() => setShowFilingConfirmation(false)}
        />
      )}

      {/* Main Content - Sidebar + Content Layout */}
      {/* Height calculation: 100vh - header (48px) - tax bar (56px desktop, 48px mobile) */}
      <main
        className="flex-1 overflow-hidden flex itr-computation-main"
        style={{
          // Desktop: header (48px) + tax bar (56px) = 104px
          // Mobile: header (48px) + tax bar (48px) = 96px
          height: 'calc(100vh - var(--header-height) - var(--tax-bar-height-desktop))',
        }}
      >
        {/* Sidebar Navigation */}
        <div className="hidden lg:flex flex-col w-[280px] border-r border-slate-200 bg-white">
          <div className="flex-1 overflow-hidden">
            <ComputationSidebar
              sections={orderedSections}
              activeSectionId={activeSectionId}
              onSectionSelect={handleSectionSelect}
              getSectionStatus={getSectionStatus}
              autoFilledFields={autoFilledFields}
              fieldVerificationStatuses={fieldVerificationStatuses}
              isMobile={false}
              className="w-full border-r-0"
            />
          </div>
          {isCAUser && effectiveFilingId && (
            <div className="flex-shrink-0 p-4 border-t border-slate-200 bg-slate-50 space-y-3 overflow-y-auto max-h-[300px]">
              <CANotes filingId={effectiveFilingId} />
              <ClientCommunication filingId={effectiveFilingId} />
            </div>
          )}
        </div>

        {/* Mobile Sidebar */}
        <ComputationSidebar
          sections={orderedSections}
          activeSectionId={activeSectionId}
          onSectionSelect={handleSectionSelect}
          getSectionStatus={getSectionStatus}
          autoFilledFields={autoFilledFields}
          fieldVerificationStatuses={fieldVerificationStatuses}
          isMobile={true}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area - Split for Pinned Timeline */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">

          {/* PINNED: Financial Year Timeline */}
          {!isPrefetching && (
            <div className="flex-shrink-0 bg-white border-b border-slate-200 z-10 shadow-sm">
              <FinancialYearTimeline
                formData={formData}
                taxComputation={taxComputation}
                selectedITR={selectedITR}
                activeSectionId={activeSectionId}
                onSectionSelect={handleSectionSelect}
              />
            </div>
          )}

          {/* SCROLLABLE: Content */}
          <div className="flex-1 overflow-y-auto itr-computation-container">

            {/* Auto-Population Progress Banner - Compact */}
            {(isPrefetching || autoPopulationSummary) && (
              <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex-shrink-0">
                <div className="max-w-[1200px] mx-auto">
                  <AutoPopulationProgress
                    isActive={isPrefetching}
                    summary={autoPopulationSummary}
                    onDismiss={() => setAutoPopulationSummary(null)}
                    onRefresh={handleRefreshPrefetch}
                  />
                </div>
              </div>
            )}

            {/* Validation Summary Banner - Compact */}
            {showValidationSummary && Object.keys(validationErrors).length > 0 && (
              <div className="bg-info-50 border-b border-info-200 px-3 py-1 flex-shrink-0">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-body-small text-info-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{Object.keys(validationErrors).length} issues</span>
                    <button
                      onClick={() => setShowValidationSummary(false)}
                      className="text-[10px] underline hover:text-info-900 ml-1"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ITR Form Selector Modal (only shown initially) */}
            {showITRSelector && selectedPerson && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6">
                  <ITRFormSelector
                    selectedPerson={selectedPerson}
                    verificationResult={verificationResult}
                    onITRSelect={(itr) => {
                      setSelectedITR(itr);
                      setShowITRSelector(false);
                    }}
                    initialITR={selectedITR}
                    autoDetect={autoDetectITR}
                  />
                </div>
              </div>
            )}

            {/* Content Container - Compact padding */}
            <div className={`${focusMode ? 'flex gap-4' : 'max-w-[1200px] mx-auto'} px-3 py-3`}>
              {/* Financial Blueprint Overview - Sticky sidebar in focus mode */}
              {effectiveFilingId && (
                <div className={focusMode ? 'w-80 flex-shrink-0' : 'w-full'}>
                  <FinancialBlueprintOverview
                    blueprint={blueprint}
                    isLoading={blueprintLoading}
                    isCollapsed={blueprintCollapsed}
                    focusMode={focusMode}
                    onToggleCollapse={() => setBlueprintCollapsed(!blueprintCollapsed)}
                    onClose={() => setFocusMode(false)}
                    onActionClick={(action) => {
                      setFocusMode(true);
                      setBlueprintCollapsed(false);
                      // Navigate to appropriate section based on action
                      if (action === 'edit_data') {
                        setActiveSectionId('personalInfo');
                      } else if (action === 'compute_tax') {
                        setActiveSectionId('taxComputation');
                      } else if (action === 'file_itr') {
                        // Show filing confirmation panel instead of just navigating
                        setShowFilingConfirmation(true);
                      }
                    }}
                  />
                  {!focusMode && <FinancialYearEvents blueprint={blueprint} formData={formData} />}
                </div>
              )}

              {/* Focused Content Area */}
              <div className={focusMode ? 'flex-1 min-w-0' : 'w-full'}>
                {focusMode && effectiveFilingId && (
                  <FinancialYearEvents blueprint={blueprint} formData={formData} />
                )}

                {/* Auto-Population Actions - Compact */}
                {Object.keys(autoFilledFields).some(section => autoFilledFields[section]?.length > 0) && (
                  <div className="mb-3">
                    <AutoPopulationActions
                      autoFilledFields={autoFilledFields}
                      onAcceptAll={() => {
                        toast.success('All auto-filled values accepted');
                        // Values are already in formData, just acknowledge
                      }}
                      onOverrideAll={() => {
                        toast.info('You can now manually edit all fields');
                        // Clear auto-filled tracking to allow manual edits
                        setAutoFilledFields({});
                      }}
                    />
                  </div>
                )}

                {/* U3.3 Tax Opportunities Card (Educational Nudges) */}
                {showOpportunities && !isPrefetching && (
                  <TaxOpportunitiesCard
                    formData={formData}
                    selectedITR={selectedITR}
                    onDismiss={() => setShowOpportunities(false)}
                  />
                )}

                {/* Section Header - Compact */}
                {(() => {
                  const Icon = activeSection?.icon;
                  return (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        {Icon && (
                          <div className="w-8 h-8 rounded-xl bg-gold-100 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-gold-700" />
                          </div>
                        )}
                        <div>
                          <h2 className="text-heading-4 font-bold font-display text-slate-900">
                            {activeSection?.title || 'Section'}
                          </h2>
                          {activeSection?.description && (
                            <p className="text-body-small text-slate-600 mt-0.5">
                              {activeSection.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Section Content Card - Compact */}
                <motion.div
                  key={activeSectionId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="bg-white rounded-xl border border-slate-200 shadow-elevation-1 p-4"
                  style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                >
                  {(() => {
                    if (activeSection?.id === 'taxOptimizer') {
                      return (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-elevation-1 p-4">
                          <TaxOptimizer
                            key={activeSection.id}
                            filingId={filingId || draftId}
                            currentTaxComputation={taxComputation}
                            onUpdate={() => {
                              // Manual tax compute mode: let user explicitly recompute
                              setTaxComputation(null);
                              setRegimeComparison(null);
                              setShowComparison(false);
                            }}
                          />
                        </div>
                      );
                    }

                    // U3.6 & V1: No Section Locking. Progressive Disclosure only.
                    const _isSectionLocked = false;

                    const commonProps = {
                      id: activeSection?.id,
                      title: activeSection?.title,
                      description: activeSection?.description,
                      icon: activeSection?.icon,
                      isExpanded: true,
                      onToggle: () => { },
                      formData: formData, // Passing complete formData
                      fullFormData: formData,
                      onUpdate: handleActiveSectionUpdate,
                      selectedITR: selectedITR,
                      readOnly: isReadOnly || _isSectionLocked,
                      disabled: _isSectionLocked, // Explicit disabled prop
                      onDataUploaded: handleDataUploaded,
                      validationErrors: validationErrors[activeSection?.id] || {},
                      autoFilledFields: autoFilledFields,
                      prefetchSources: prefetchSources,
                      fieldVerificationStatuses: fieldVerificationStatuses,
                      fieldSources: fieldSources,
                    };

                    switch (activeSection?.id) {
                      case 'personalInfo':
                        return <PersonalInfoSection {...commonProps} />;

                      case 'income':
                        return <IncomeSection {...commonProps} />;

                      case 'businessIncome':
                      case 'professionalIncome':
                      case 'presumptiveIncome':
                      case 'goodsCarriage':
                      case 'balanceSheet':
                      case 'auditInfo':
                        return <BusinessSection {...commonProps} />;

                      case 'capitalGains':
                        return <CapitalGainsSection {...commonProps} />;

                      case 'exemptIncome':
                        return <ExemptIncomeSection {...commonProps} />;

                      case 'deductions':
                        return <DeductionsSection {...commonProps} />;

                      case 'scheduleFA':
                        return (
                          <ForeignAssetsSection
                            {...commonProps}
                            filingId={effectiveFilingId || null}
                          />
                        );


                      case 'taxesPaid':
                        // Keep ReviewSection or specialized TaxPaidSection? 
                        // For now map taxesPaid to ReviewSection or a placeholder if ReviewSection is too much.
                        // But for V1, let's map it to ReviewSection or TaxOutcomeSection?
                        // Ideally TaxesPaid should be its own input section.
                        // I will keep it mapping to ReviewSection for now as fallback, or map to null if not implemented.
                        // Actually, I'll map it to ReviewSection but ensure ReviewSection handles it.
                        return (
                          <ReviewSection
                            {...commonProps}
                            taxComputation={taxComputation}
                            onTaxComputed={setTaxComputation}
                            regime={taxRegime}
                            assessmentYear={assessmentYear}
                          />
                        );

                      case 'taxComputation':
                        return (
                          <TaxOutcomeSection
                            {...commonProps}
                            taxComputation={taxComputation}
                            assessmentYear={assessmentYear}
                          />
                        );

                      case 'bankDetails':
                        return (
                          <BankDetailsSection
                            {...commonProps}
                            formData={formData}
                            onUpdate={handleActiveSectionUpdate}
                          />
                        );

                      default:
                        return (
                          <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                            <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <p>Section logic not found for "{activeSection?.id}".</p>
                          </div>
                        );
                    }
                  })()}
                </motion.div>

                {/* Optional sections (progressive disclosure) */}
                {!isReadOnly && (
                  <>
                    {/* Schedule FA (ITR-2/3): hidden until triggered */}
                    {!scheduleFAVisible && scheduleFAEligible && (
                      <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-elevation-1 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-body-regular font-semibold text-slate-900">Foreign assets?</div>
                            <div className="text-body-small text-slate-600 mt-0.5">
                              Add Schedule FA only if you held foreign assets during the year.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!effectiveFilingId) {
                                toast.error('Please save once to create your filing before adding foreign assets.');
                                return;
                              }
                              setScheduleFAOptIn(true);
                              setActiveSectionId('scheduleFA');
                            }}
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-semibold flex-shrink-0"
                          >
                            Add foreign assets
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Balance Sheet (ITR-3): hidden unless user maintains it */}
                    {(selectedITR === 'ITR-3' || selectedITR === 'ITR3') && !shouldShowBalanceSheet && (
                      <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-elevation-1 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-body-regular font-semibold text-slate-900">Maintain a balance sheet?</div>
                            <div className="text-body-small text-slate-600 mt-0.5">
                              Add Balance Sheet only if you maintain books for your business/profession.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setBalanceSheetOptIn(true);
                              setActiveSectionId('balanceSheet');
                            }}
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-semibold flex-shrink-0"
                          >
                            Add balance sheet
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Audit Info (ITR-3): auto-shown when audit signals exist, otherwise opt-in */}
                    {(selectedITR === 'ITR-3' || selectedITR === 'ITR3') && !shouldShowAuditInfo && (
                      <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-elevation-1 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-body-regular font-semibold text-slate-900">Tax audit?</div>
                            <div className="text-body-small text-slate-600 mt-0.5">
                              Add Audit Information only if tax audit is applicable for you (Section 44AB).
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAuditInfoOptIn(true);
                              setActiveSectionId('auditInfo');
                            }}
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-semibold flex-shrink-0"
                          >
                            Add audit info
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Goods Carriage (ITR-4): optional */}
                    {(selectedITR === 'ITR-4' || selectedITR === 'ITR4') && !shouldShowGoodsCarriage && (
                      <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-elevation-1 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-body-regular font-semibold text-slate-900">Goods carriage income?</div>
                            <div className="text-body-small text-slate-600 mt-0.5">
                              Add Section 44AE only if you have goods carriage business income.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setGoodsCarriageOptIn(true);
                              setActiveSectionId('goodsCarriage');
                            }}
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-semibold flex-shrink-0"
                          >
                            Add 44AE
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Read-only notice (minimal) - Positioned to avoid conflicts with mobile menu button */}
            {isReadOnly && (
              <div
                className="fixed left-1/2 -translate-x-1/2 bg-info-100 text-info-800 px-4 py-2 rounded-full text-body-regular shadow-elevation-2 z-40"
                style={{
                  // Position above mobile menu button (bottom-20 = 5rem = 80px)
                  bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
                }}
              >
                <Info className="h-4 w-4 inline mr-2" />
                Read-only mode
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default ITRComputation;
