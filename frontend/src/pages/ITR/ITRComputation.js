// =====================================================
// ITR COMPUTATION PAGE
// Single page with expandable sections for ITR filing
// =====================================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
// Lazy load icons to reduce initial bundle size
import { ArrowLeft, Save, Download, FileText, User, IndianRupee, Calculator, CreditCard, Building2, CheckCircle, Globe, Shield, Wheat } from 'lucide-react';
import ComputationSection from '../../components/ITR/ComputationSection';
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
import EVerificationModal from '../../components/ITR/EVerificationModal';
import { ScheduleFA } from '../../features/foreign-assets';
import { TaxOptimizer } from '../../features/tax-optimizer';
import { useExportDraftPDF } from '../../features/pdf-export/hooks/use-pdf-export';
import PDFExportButton from '../../features/pdf-export/components/pdf-export-button';
import useRealTimeValidation from '../../hooks/useRealTimeValidation';
import ITRValidationEngine from '../../components/ITR/core/ITRValidationEngine';
import { AlertCircle, XCircle, Cloud, CloudOff, Check } from 'lucide-react';
import ValidationSummary from '../../components/ITR/ValidationSummary';
import { formatIndianCurrency } from '../../lib/format';
import useAutoSave, { AutoSaveIndicator } from '../../hooks/useAutoSave';
import formDataService from '../../services/FormDataService';
import verificationStatusService from '../../services/VerificationStatusService';
import { motion, AnimatePresence } from 'framer-motion';
import ITRComputationHeader from '../../components/ITR/ITRComputationHeader';
import ITRComputationContent from '../../components/ITR/ITRComputationContent';

const ITRComputation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const { user } = useAuth();
  const isCAUser = user && isCA(user.role);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saving', 'saved', 'error', 'offline'
  const [isDownloading, setIsDownloading] = useState(false);
  const exportDraftPDF = useExportDraftPDF();
  const [expandedSections, setExpandedSections] = useState({
    personalInfo: true,
    income: false,
    deductions: false,
    taxesPaid: false,
    taxComputation: false,
    bankDetails: false,
  });
  const [expandedSectionId, setExpandedSectionId] = useState(null); // For BreathingGrid (legacy)
  const [activeSectionId, setActiveSectionId] = useState('personalInfo'); // For sidebar navigation
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Route guard: Check for selectedPerson, restore from localStorage if needed
  const getSelectedPersonFromStorage = () => {
    if (location.state?.selectedPerson) return location.state.selectedPerson;
    try {
      const saved = localStorage.getItem('itr_selected_person');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const selectedPerson = getSelectedPersonFromStorage();
  const initialVerificationResult = location.state?.verificationResult;
  const draftId = searchParams.get('draftId') || location.state?.draftId;
  const filingId = params.filingId || searchParams.get('filingId') || location.state?.filingId;
  const viewMode = location.state?.viewMode || searchParams.get('viewMode') || null; // 'readonly' for completed filings

  // Track entry point for context-aware back navigation
  const getEntryPoint = () => {
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

  // Store entry point in localStorage for page refresh recovery
  useEffect(() => {
    if (entryPoint) {
      try {
        localStorage.setItem('itr_computation_entry_point', entryPoint);
      } catch (e) {
        console.warn('Failed to save entry point to localStorage:', e);
      }
    }
  }, [entryPoint]);

  // Route guard: Redirect if no selectedPerson and no draftId/filingId
  useEffect(() => {
    if (!selectedPerson && !draftId && !filingId && !viewMode) {
      toast.error('Please select a person to file for');
      navigate('/itr/select-person');
    } else if (selectedPerson) {
      // Save selectedPerson to localStorage for page refresh recovery
      try {
        localStorage.setItem('itr_selected_person', JSON.stringify(selectedPerson));
      } catch (e) {
        console.warn('Failed to save selectedPerson to localStorage:', e);
      }
    }
  }, [selectedPerson, draftId, filingId, viewMode, navigate]);
  const autoDetectITR = location.state?.autoDetectITR || false;
  const initialITR = location.state?.selectedITR;
  const _recommendation = location.state?.recommendation;
  const dataSource = location.state?.dataSource; // 'form16', 'it-portal', 'manual', 'previous-year'
  const showDocumentUpload = location.state?.showDocumentUpload || false;
  const showITPortalConnect = location.state?.showITPortalConnect || false;
  const copiedFromPreviousYear = location.state?.copiedFromPreviousYear || false;
  const [selectedITR, setSelectedITR] = useState(initialITR || 'ITR-1');
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
  const [showEVerificationModal, setShowEVerificationModal] = useState(false);
  const [verificationResult, setVerificationResult] = useState(initialVerificationResult || null);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const lastSavedTimestampRef = useRef(null); // Track last saved timestamp to prevent recursive updates

  // Form data state (must be declared before useRealTimeValidation)
  const [formData, setFormData] = useState({
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
    businessIncome: (selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? {
      businesses: [],
    } : undefined,
    professionalIncome: (selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? {
      professions: [],
    } : undefined,
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

  // Real-time validation hook
  const validationEngine = new ITRValidationEngine();
  const {
    fieldErrors,
    hasErrors,
    getAllErrors,
    validateSection: validateSectionHook,
    isValidating: isValidatingForm,
  } = useRealTimeValidation(formData, selectedITR, 300);

  // Determine if filing is readonly (completed/submitted)
  const isReadOnly = viewMode === 'readonly' ||
                     (currentFiling && ['submitted', 'acknowledged', 'processed'].includes(currentFiling.status));

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
          console.warn('AIS/26AS prefetch failed:', error);
        }

        // 2. Get previous year data if available
        if (dataSource === 'previous-year' || copiedFromPreviousYear) {
          try {
            const previousYearService = (await import('../../services/business/PreviousYearCopyService')).default;
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
            console.warn('Previous year data fetch failed:', error);
          }
        }

        // 3. Get user profile data
        if (selectedPerson) {
          sources.userProfile = {
            personalInfo: {
              name: selectedPerson.name,
              pan: selectedPerson.panNumber,
              email: selectedPerson.email,
              phone: selectedPerson.phone,
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
        console.error('Auto-population failed:', error);
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
        console.error('Failed to validate selected person:', error);
        // Don't block user if validation fails, but log it
      }
    };

    validateSelectedPerson();
  }, [selectedPerson, navigate]);

  // Load draft on component mount
  useEffect(() => {
    const loadDraft = async () => {
      // Try to load from localStorage first (for page refresh recovery)
      const localStorageKey = draftId ? `itr_draft_${draftId}` : 'itr_draft_current';
      const savedDraft = localStorage.getItem(localStorageKey);

      if (savedDraft && !draftId) {
        // Restore from localStorage if no draftId in URL
        try {
          const parsedSavedDraft = JSON.parse(savedDraft);
          if (parsedSavedDraft.formData) {
            setFormData(parsedSavedDraft.formData);
            if (parsedSavedDraft.assessmentYear) setAssessmentYear(parsedSavedDraft.assessmentYear);
            if (parsedSavedDraft.taxRegime) setTaxRegime(parsedSavedDraft.taxRegime);
            if (parsedSavedDraft.selectedITR) setSelectedITR(parsedSavedDraft.selectedITR);
            // If localStorage draft has a draftId, update URL
            if (parsedSavedDraft.draftId && parsedSavedDraft.draftId !== 'current') {
              navigate(`/itr/computation?draftId=${parsedSavedDraft.draftId}`, { replace: true });
            }
            toast.success('Draft restored from local storage');
          }
        } catch (e) {
          console.warn('Failed to restore draft from localStorage:', e);
        }
      }

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
          localStorage.setItem(`itr_draft_${draftId}`, JSON.stringify(draftToSave));

          toast.success('Draft loaded successfully');
        } else {
          toast.error('Draft data not found');
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
        toast.error('Failed to load draft: ' + (error.message || 'Unknown error'));
      } finally {
        setIsPrefetching(false);
      }
    };

    loadDraft();
  }, [draftId]);

  // Tax computation loading state
  const [isComputingTax, setIsComputingTax] = useState(false);

  // Compute tax function
  const handleComputeTax = useCallback(async () => {
    if (!formData.personalInfo.pan || !formData.income) return;

    setIsComputingTax(true);
    try {
      const taxResult = await itrService.computeTax(
        formData,
        taxRegime,
        assessmentYear,
      );

      if (taxResult.success && taxResult.data) {
        setTaxComputation(taxResult.data);

        // Also get regime comparison if available
        if (taxResult.data.comparison) {
          setRegimeComparison(taxResult.data.comparison);
          setShowComparison(true);
        }
      }
    } catch (error) {
      console.error('Tax computation failed:', error);
      // Don't show error toast - computation happens frequently
    } finally {
      setIsComputingTax(false);
    }
  }, [formData, taxRegime, assessmentYear]);

  // Compute tax when form data or regime changes - 300ms debounce
  useEffect(() => {
    // Debounce computation - 300ms for responsive feel
    const timeoutId = setTimeout(handleComputeTax, 300);
    return () => clearTimeout(timeoutId);
  }, [handleComputeTax, taxRegime]);

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
          console.warn(`Validation error for section ${sectionId}:`, error);
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
        businessIncome: formData.businessIncome,
        professionalIncome: formData.professionalIncome,
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
        console.warn('Complete form validation error:', error);
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
    // Tax will be recalculated automatically via useEffect that watches taxRegime
    // Trigger immediate tax computation
    if (formData.personalInfo.pan && formData.income) {
      handleComputeTax();
    }
    // Show comparison if available
    if (regimeComparison) {
      setShowComparison(true);
    }
  }, [regimeComparison, formData.personalInfo.pan, formData.income]);

  const handleBack = useCallback(() => {
    // Context-aware back navigation based on entry point
    const currentEntryPoint = entryPoint || (() => {
      try {
        return localStorage.getItem('itr_computation_entry_point');
      } catch {
        return null;
      }
    })();

    switch (currentEntryPoint) {
      case 'form16':
      case 'it-portal':
      case 'direct-selection':
      case 'guided-selection':
      case 'previous-year':
      case 'revised-return':
        // From DataSourceSelector - go back to data source page
        navigate('/itr/data-source', {
          state: {
            selectedPerson,
            assessmentYear,
          },
        });
        break;

      case 'expert':
        // From ITRDirectSelection - go back to direct selection
        navigate('/itr/direct-selection', {
          state: {
            selectedPerson,
            userProfile: location.state?.userProfile,
          },
        });
        break;

      case 'guided':
        // From IncomeSourceSelector - go back to income sources
        navigate('/itr/income-sources', {
          state: {
            selectedPerson,
          },
        });
        break;

      case 'form-selection':
        // From ITRFormSelection - go back to form selection
        navigate('/itr/select-form', {
          state: {
            selectedPerson,
            verificationResult: initialVerificationResult,
            dataSource: location.state?.dataSource,
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
      console.error('Refresh failed:', error);
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
    if (returnType === 'count') {
      return summary.statusCount || 0;
    }
    return summary.status || 'pending';
  }, [getSectionSummary]);

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
    // Trigger immediate save on section update (debounced by auto-save hook)
    // The auto-save hook will handle debouncing, but we ensure it's triggered
    // Apply validation for income and deduction sections
    let validatedData = { ...data };

    if (section === 'income') {
      // Validate income fields - prevent negative values
      Object.keys(validatedData).forEach(key => {
        if (typeof validatedData[key] === 'number' && validatedData[key] < 0) {
          validatedData[key] = 0;
        } else if (typeof validatedData[key] === 'object' && validatedData[key] !== null && !Array.isArray(validatedData[key])) {
          // Handle nested objects (e.g., businessIncome, professionalIncome)
          Object.keys(validatedData[key]).forEach(nestedKey => {
            if (typeof validatedData[key][nestedKey] === 'number' && validatedData[key][nestedKey] < 0) {
              validatedData[key][nestedKey] = 0;
            }
          });
        }
      });
    } else if (section === 'deductions') {
      // Validate deduction fields - prevent negative values and enforce limits
      const deductionLimits = {
        section80C: 150000,
        section80D: 25000,
        section80E: 150000,
        section80G: null, // No specific limit
        section80TTA: 10000,
        section80TTB: 50000,
      };

      Object.keys(validatedData).forEach(key => {
        if (typeof validatedData[key] === 'number') {
          if (validatedData[key] < 0) {
            validatedData[key] = 0;
          } else if (deductionLimits[key] !== null && validatedData[key] > deductionLimits[key]) {
            validatedData[key] = deductionLimits[key];
            toast.error(`${key} deduction cannot exceed ₹${deductionLimits[key].toLocaleString('en-IN')}`);
          }
        }
      });
    } else if (section === 'taxesPaid') {
      // Validate tax paid fields - prevent negative values
      Object.keys(validatedData).forEach(key => {
        if (typeof validatedData[key] === 'number' && validatedData[key] < 0) {
          validatedData[key] = 0;
        }
      });
    }

    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...validatedData,
      },
    }));
  }, []);

  // Enhanced auto-save using useAutoSave hook
  const saveDraftData = useCallback(async (dataToSave) => {
    if (!draftId) {
      // Save to localStorage only if no draftId
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
        localStorage.setItem(localStorageKey, JSON.stringify(draftToSave));
        lastSavedTimestampRef.current = draftToSave.savedAt;
      } catch (e) {
        console.warn('Failed to save draft to localStorage:', e);
      }
      return;
    }

    // Save to backend via FormDataService
    try {
      // Use FormDataService to save all form data
      await formDataService.saveFormData('all', dataToSave, draftId);
    } catch (error) {
      console.error('Auto-save failed:', error);
      throw error;
    }
  }, [draftId, assessmentYear, taxRegime, selectedITR]);

  // Use enhanced auto-save hook
  const {
    saveStatus: autoSaveStatusFromHook,
    handleSectionChange: autoSaveSectionChange,
    triggerSave: triggerAutoSave,
  } = useAutoSave({
    saveFn: saveDraftData,
    data: formData,
    debounceMs: 2000,
    localStorageKey: draftId ? `itr_draft_${draftId}` : 'itr_draft_current',
    enabled: !!formData.personalInfo?.pan && !!draftId,
    onSaveSuccess: () => {
      setAutoSaveStatus('saved');
      setTimeout(() => {
        setAutoSaveStatus(prev => (prev === 'saved' ? 'idle' : prev));
      }, 2000);
    },
    onSaveError: (error) => {
      setAutoSaveStatus('error');
      console.warn('Auto-save error (non-blocking):', error);
    },
  });

  // Update autoSaveStatus from hook
  useEffect(() => {
    if (autoSaveStatusFromHook && autoSaveStatusFromHook !== 'idle') {
      setAutoSaveStatus(autoSaveStatusFromHook);
    }
  }, [autoSaveStatusFromHook]);

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
          console.warn('Failed to sync draft from storage event:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [draftId, assessmentYear, taxRegime, selectedITR]);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const draftData = {
        formData,
        selectedITR,
        assessmentYear,
        taxRegime,
        selectedPerson,
      };

      if (draftId) {
        // Update existing draft
        const updateData = {
          formData: draftData.formData,
          assessmentYear: draftData.assessmentYear,
          taxRegime: draftData.taxRegime,
        };
        await itrService.updateDraft(draftId, updateData);
        toast.success('Draft saved successfully', {
          icon: '✅',
          duration: 2000,
        });
      } else {
        // Create new draft
        const response = await itrService.createITR({
          itrType: selectedITR,
          formData: draftData.formData,
          assessmentYear: draftData.assessmentYear,
        });
        if (response?.filing?.id) {
          // Create draft for the filing
          const draftResponse = await apiClient.post('/itr/drafts', {
            filingId: response.filing.id,
            formData: draftData.formData,
            itrType: selectedITR,
            assessmentYear: draftData.assessmentYear,
            taxRegime: draftData.taxRegime,
          });
          if (draftResponse.data?.draft?.id) {
            // Update URL with draft ID
            navigate(`/itr/computation?draftId=${draftResponse.data.draft.id}`, {
              replace: true,
              state: { ...location.state, draftId: draftResponse.data.draft.id },
            });
            toast.success('Draft saved successfully', {
              icon: '✅',
              duration: 2000,
            });
          } else {
            toast.error('Failed to create draft. Please try again.');
          }
        } else {
          toast.error('Failed to create filing. Please try again.');
        }
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save draft';
      toast.error(errorMessage, {
        duration: 4000,
      });
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

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
      businessIncome: (selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? {
        businesses: [],
      } : undefined,
      professionalIncome: (selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? {
        professions: [],
      } : undefined,
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
          const filing = response.filings?.find(f => f.id === filingId);
          if (filing) {
            setCurrentFiling(filing);
            if (filing.status === 'paused') {
              setShowResumeModal(true);
            }
            // Load form data if available
            if (filing.formData) {
              setFormData(filing.formData);
            }
          }
        } catch (error) {
          console.error('Failed to load filing:', error);
        }
      }
    };
    loadFiling();
  }, [filingId, currentFiling]);

  const handleDownloadJSON = useCallback(async () => {
    // Check authentication before export
    if (!user) {
      toast.error('Please log in to download JSON file');
      return;
    }

    setIsDownloading(true);
    try {
      // Validate JSON schema before export
      try {
        itrJsonExportService.validateJsonForExport(formData, selectedITR);
      } catch (validationError) {
        toast.error('JSON validation failed: ' + validationError.message, {
          duration: 6000,
        });
        setIsDownloading(false);
        return;
      }

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

      toast.success('JSON file downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
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
  }, [formData, selectedITR, assessmentYear, user]);

  const handleFileReturns = useCallback(() => {
    // Validate form before submission
    try {
      // Convert formData to validation engine format
      // eslint-disable-next-line camelcase
      const validationFormData = {
        // eslint-disable-next-line camelcase
        personal_info: formData.personalInfo || {},
        income: formData.income || {},
        deductions: formData.deductions || {},
        // eslint-disable-next-line camelcase
        taxes_paid: formData.taxesPaid || {},
        businessIncome: formData.businessIncome,
        professionalIncome: formData.professionalIncome,
        balanceSheet: formData.balanceSheet,
        auditInfo: formData.auditInfo,
      };

      const completeValidation = validationEngine.validateCompleteForm(validationFormData, selectedITR);

      // Also check business rules (ITR type-specific validations)
      const businessRulesValidation = validationEngine.validateBusinessRules(validationFormData, selectedITR);

      // Combine validation errors
      const allErrors = { ...completeValidation.errors };
      if (businessRulesValidation.errors && businessRulesValidation.errors.length > 0) {
        allErrors.businessRules = businessRulesValidation.errors;
      }

      // Check for critical errors that should block submission
      const criticalErrors = [];

      // ITR-1 income limit check
      if ((selectedITR === 'ITR-1' || selectedITR === 'ITR1')) {
        const income = validationFormData.income || {};
        const totalIncome = (parseFloat(income.salary) || 0) +
                           (parseFloat(income.otherIncome) || 0) +
                           (typeof income.houseProperty === 'number' ? parseFloat(income.houseProperty) : 0);
        if (totalIncome > 5000000) {
          criticalErrors.push('ITR-1 income limit exceeded. Total income (₹' + totalIncome.toLocaleString('en-IN') + ') exceeds ₹50 lakh limit. Please use ITR-2.');
        }

        // CRITICAL: Agricultural income > ₹5,000 check - Regulatory requirement
        const agriIncome = formData.exemptIncome?.agriculturalIncome?.netAgriculturalIncome
          || formData.exemptIncome?.netAgriculturalIncome
          || formData.agriculturalIncome
          || validationFormData.exemptIncome?.agriculturalIncome?.netAgriculturalIncome
          || validationFormData.exemptIncome?.netAgriculturalIncome
          || validationFormData.agriculturalIncome
          || 0;
        if (agriIncome > 5000) {
          criticalErrors.push(
            `Agricultural income (₹${agriIncome.toLocaleString('en-IN')}) exceeds ₹5,000 limit. ` +
            'ITR-1 is not permitted. You must file ITR-2. This is a regulatory requirement - ITR-1 returns with agricultural income above ₹5,000 will be rejected by the Income Tax Department.',
          );
        }
      }

      // ITR-4 presumptive limits check
      if ((selectedITR === 'ITR-4' || selectedITR === 'ITR4')) {
        const presumptiveBusiness = validationFormData.income?.presumptiveBusiness || {};
        const presumptiveProfessional = validationFormData.income?.presumptiveProfessional || {};
        if (presumptiveBusiness.grossReceipts > 2000000) {
          criticalErrors.push('ITR-4 business income limit exceeded. Gross receipts (₹' + presumptiveBusiness.grossReceipts.toLocaleString('en-IN') + ') exceeds ₹20 lakh limit. Please use ITR-3.');
        }
        if (presumptiveProfessional.grossReceipts > 500000) {
          criticalErrors.push('ITR-4 professional income limit exceeded. Gross receipts (₹' + presumptiveProfessional.grossReceipts.toLocaleString('en-IN') + ') exceeds ₹5 lakh limit. Please use ITR-3.');
        }
      }

      // Check for ITR type violations
      if (businessRulesValidation.errors && businessRulesValidation.errors.length > 0) {
        criticalErrors.push(...businessRulesValidation.errors);
      }

      if (!completeValidation.isValid || criticalErrors.length > 0) {
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

        Object.keys(allErrors || {}).forEach(sectionId => {
          const mappedSection = reverseMapping[sectionId] || sectionId;
          mappedErrors[mappedSection] = allErrors[sectionId];
        });

        // Add critical errors
        if (criticalErrors.length > 0) {
          mappedErrors.critical = criticalErrors;
        }

        setValidationErrors(mappedErrors);
        setShowValidationSummary(true);

        // Scroll to first error section
        const firstErrorSection = Object.keys(mappedErrors)[0];
        if (firstErrorSection) {
          const sectionElement = document.querySelector(`[data-section-id="${firstErrorSection}"]`);
          if (sectionElement) {
            sectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Focus the section after a short delay
            setTimeout(() => {
              sectionElement.focus();
            }, 300);
          }
        }

        // Show critical error message
        if (criticalErrors.length > 0) {
          toast.error(criticalErrors[0] + (criticalErrors.length > 1 ? ` (+${criticalErrors.length - 1} more)` : ''), {
            duration: 6000,
          });
        } else {
          toast.error('Please fix validation errors before submitting');
        }
        return; // Block submission
      }

      // Form is valid, show E-verification modal
      setShowEVerificationModal(true);
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Validation failed. Please check your form data.');
    }
  }, [formData, selectedITR, validationEngine]);

  const handleVerificationComplete = useCallback(async (verificationData) => {
    setVerificationResult(verificationData);
    setShowEVerificationModal(false);

    try {
      if (!draftId) {
        toast.error('Draft ID not found');
        return;
      }

      // Validate form data before submission
      const validationResponse = await apiClient.post(`/itr/drafts/${draftId}/validate`, {
        formData,
      });

      if (!validationResponse.data.isValid) {
        toast.error('Please fix validation errors before submitting');
        return;
      }

      // Submit ITR with verification
      const submitResponse = await apiClient.post(`/itr/drafts/${draftId}/submit`, {
        verificationMethod: verificationData.method,
        verificationToken: verificationData.verificationToken,
      });

      if (submitResponse.data.filing) {
        toast.success('ITR submitted successfully!');
        navigate(`/itr/acknowledgment?filingId=${submitResponse.data.filing.id}`);
      }
    } catch (error) {
      console.error('ITR submission error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit ITR');
    }
  }, [draftId, formData, navigate]);

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
          : 'Salary, Business, Capital Gains, House Property, Other Sources',
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

  // Schedule FA section for ITR-2 and ITR-3
  const scheduleFASection = (selectedITR === 'ITR-2' || selectedITR === 'ITR2' || selectedITR === 'ITR-3' || selectedITR === 'ITR3') ? [
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

  // Helper function to check if section should be shown based on ITR type
  const shouldShowSection = useCallback((sectionId, selectedITR) => {
    const itr = selectedITR || 'ITR-1';

    // ITR-1 restrictions
    if (itr === 'ITR-1' || itr === 'ITR1') {
      // Hide capital gains, business, professional, Schedule FA, balance sheet, audit
      if (['businessIncome', 'professionalIncome', 'balanceSheet', 'auditInfo', 'scheduleFA'].includes(sectionId)) {
        return false;
      }
      return true;
    }

    // ITR-2 restrictions
    if (itr === 'ITR-2' || itr === 'ITR2') {
      // Hide business and professional income
      if (['businessIncome', 'professionalIncome', 'balanceSheet', 'auditInfo', 'presumptiveIncome', 'goodsCarriage'].includes(sectionId)) {
        return false;
      }
      return true;
    }

    // ITR-3 restrictions
    if (itr === 'ITR-3' || itr === 'ITR3') {
      // Show all sections except presumptive income
      if (['presumptiveIncome', 'goodsCarriage'].includes(sectionId)) {
        return false;
      }
      return true;
    }

    // ITR-4 restrictions
    if (itr === 'ITR-4' || itr === 'ITR4') {
      // Hide business, professional, balance sheet, audit, Schedule FA
      if (['businessIncome', 'professionalIncome', 'balanceSheet', 'auditInfo', 'scheduleFA'].includes(sectionId)) {
        return false;
      }
      return true;
    }

    return true;
  }, []);

  // Combine all sections and filter based on ITR type - Memoized
  const allSections = useMemo(() => [...baseSections, ...itr3Sections, ...itr4Sections, ...scheduleFASection, ...commonSections], [baseSections, itr3Sections, itr4Sections, scheduleFASection, commonSections]);
  const sections = useMemo(() => allSections.filter(section => shouldShowSection(section.id, selectedITR)), [allSections, selectedITR, shouldShowSection]);

  // Initialize activeSectionId to first section if not set
  useEffect(() => {
    if (sections.length > 0 && !sections.find(s => s.id === activeSectionId)) {
      setActiveSectionId(sections[0].id);
    }
  }, [sections, activeSectionId]);

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

    // Business income
    if (typeof income.businessIncome === 'object' && income.businessIncome?.businesses) {
      total += (income.businessIncome.businesses || []).reduce((sum, b) =>
        sum + (parseFloat(b.pnl?.netProfit || b.netProfit || 0)), 0);
    } else {
      total += parseFloat(income.businessIncome) || 0;
    }

    // Professional income
    if (typeof income.professionalIncome === 'object' && income.professionalIncome?.professions) {
      total += (income.professionalIncome.professions || []).reduce((sum, p) =>
        sum + (parseFloat(p.pnl?.netIncome || p.netIncome || p.netProfit || 0)), 0);
    } else {
      total += parseFloat(income.professionalIncome) || 0;
    }

    // Other income
    total += parseFloat(income.otherIncome) || 0;

    // Capital gains
    if (typeof income.capitalGains === 'object' && income.capitalGains?.stcgDetails) {
      total += (income.capitalGains.stcgDetails || []).reduce((sum, e) => sum + (parseFloat(e.gainAmount) || 0), 0) +
        (income.capitalGains.ltcgDetails || []).reduce((sum, e) => sum + (parseFloat(e.gainAmount) || 0), 0);
    } else {
      total += parseFloat(income.capitalGains) || 0;
    }

    // House property
    if (typeof income.houseProperty === 'object' && income.houseProperty?.properties) {
      total += income.houseProperty.properties.reduce((sum, p) => {
        const rental = parseFloat(p.annualRentalIncome) || 0;
        const taxes = parseFloat(p.municipalTaxes) || 0;
        const interest = parseFloat(p.interestOnLoan) || 0;
        return sum + Math.max(0, rental - taxes - interest);
      }, 0);
    } else {
      total += parseFloat(income.houseProperty) || 0;
    }

    // Foreign income
    total += (income.foreignIncome?.foreignIncomeDetails || []).reduce((sum, e) =>
      sum + (parseFloat(e.amountInr) || 0), 0);

    // Director/Partner income
    total += parseFloat(income.directorPartner?.directorIncome) || 0;
    total += parseFloat(income.directorPartner?.partnerIncome) || 0;

    return total;
  }, [formData?.income]);

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
    <div className="bg-neutral-50 flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Enhanced Header - ITR-Specific Dashboard */}
      <header className="bg-white border-b border-neutral-200 z-50 flex-shrink-0">
        <div className="max-w-[1400px] mx-auto px-3">
          {/* Main Header Bar - Compact 48px height */}
          <div className="flex items-center justify-between h-12">
            {/* Left: Back + Title - Compact spacing */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleBack}
                className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4 text-neutral-600" />
              </button>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold font-display text-neutral-900">
                  Income Tax Computation
                </h1>
                {userDisplayName && (
                  <>
                    <span className="text-neutral-300 text-xs">•</span>
                    <span className="text-xs font-medium text-neutral-700">{userDisplayName}</span>
                  </>
                )}
                <span className="text-neutral-300 text-xs">•</span>
                <span className="text-xs font-medium text-neutral-700">{getFinancialYear(assessmentYear)}</span>
              </div>
            </div>

            {/* Center: ITR Toggle and Regime Toggle */}
            <div className="hidden lg:flex items-center gap-2">
              <ITRToggle
                selectedITR={selectedITR}
                onITRChange={setSelectedITR}
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
                onRegimeChange={(newRegime) => {
                  setTaxRegime(newRegime);
                  // Tax computation will update automatically via useEffect
                }}
                savings={regimeComparison ? {
                  amount: Math.abs(regimeComparison.savings || 0),
                  betterRegime: (regimeComparison.savings || 0) > 0 ? 'new' : 'old',
                } : null}
                isLoading={isComputingTax}
              />
            </div>

            {/* Right: Actions - Compact */}
            <div className="flex items-center gap-1.5">
              {/* Auto-save indicator - compact */}
              {!isReadOnly && (
                <div className="hidden sm:flex items-center text-[10px] text-neutral-500" style={{ gap: '2px' }}>
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
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="flex items-center px-2 py-1 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50"
                  style={{ gap: '2px' }}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* Tax Computation Bar - Fixed below header - Compact */}
      <div className="bg-white border-b border-neutral-200 z-40 flex-shrink-0" style={{ height: '56px' }}>
        <div className="max-w-[1920px] mx-auto px-3 h-full flex items-center">
          <TaxComputationBar
            grossIncome={grossIncome}
            deductions={deductions}
            taxableIncome={taxableIncome}
            taxPayable={taxPayable}
            tdsPaid={tdsPaid}
        aiTip={recommendations?.[0]?.description || recommendations?.[0]?.title || null}
        onDismissTip={() => {
          // Remove the first recommendation from the list
          setRecommendations(prev => prev.slice(1));
        }}
        onFileClick={() => {
          // Navigate to review/filing page
          navigate('/itr/review', {
            state: {
              formData,
              taxComputation,
              regimeComparison,
              selectedITR,
              assessmentYear,
              filingId,
              draftId,
            },
          });
        }}
        // Legacy props for backward compatibility
        formData={formData}
        taxComputation={taxComputation}
        regimeComparison={regimeComparison}
        selectedRegime={taxRegime}
          />
        </div>
      </div>

      {/* Resume Modal */}
      {showResumeModal && currentFiling && (
        <ResumeFilingModal
          filing={currentFiling}
          onResume={handleResumeFromModal}
          onStartFresh={handleStartFresh}
          onClose={() => setShowResumeModal(false)}
        />
      )}

      {/* Main Content - Sidebar + Content Layout */}
      <main className="flex-1 overflow-hidden flex" style={{ height: 'calc(100vh - 48px - 56px)' }}>
        {/* Sidebar Navigation */}
        <div className="hidden lg:block">
          <ComputationSidebar
            sections={sections}
            activeSectionId={activeSectionId}
            onSectionSelect={handleSectionSelect}
            getSectionStatus={getSectionStatus}
            autoFilledFields={autoFilledFields}
            fieldVerificationStatuses={fieldVerificationStatuses}
            isMobile={false}
          />
        </div>

        {/* Mobile Sidebar */}
        <ComputationSidebar
          sections={sections}
          activeSectionId={activeSectionId}
          onSectionSelect={handleSectionSelect}
          getSectionStatus={getSectionStatus}
          autoFilledFields={autoFilledFields}
          fieldVerificationStatuses={fieldVerificationStatuses}
          isMobile={true}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-neutral-50">
          {/* Auto-Population Progress Banner - Compact */}
          {(isPrefetching || autoPopulationSummary) && (
            <div className="bg-neutral-50 border-b border-neutral-200 px-3 py-1.5 flex-shrink-0">
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
                <div className="flex items-center gap-1.5 text-xs text-info-700">
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
          <div className="max-w-[1200px] mx-auto px-3 py-3">
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

            {/* Section Header - Compact */}
            {(() => {
              const activeSection = sections.find(s => s.id === activeSectionId) || sections[0];
              const Icon = activeSection?.icon;
              return (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    {Icon && (
                      <div className="w-8 h-8 rounded-lg bg-gold-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-gold-700" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-bold font-display text-neutral-900">
                        {activeSection?.title || 'Section'}
                      </h2>
                      {activeSection?.description && (
                        <p className="text-xs text-neutral-600 mt-0.5">
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
              className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              {(() => {
                const activeSection = sections.find(s => s.id === activeSectionId) || sections[0];
                const Icon = activeSection?.icon;

                if (activeSection?.id === 'scheduleFA') {
                  return (
                    <ScheduleFA
                      key={activeSection.id}
                      filingId={filingId || draftId}
                      onUpdate={() => {
                        if (filingId || draftId) {
                          // Trigger refetch if needed
                        }
                      }}
                    />
                  );
                }

                if (activeSection?.id === 'taxOptimizer') {
                  return (
                    <TaxOptimizer
                      key={activeSection.id}
                      filingId={filingId || draftId}
                      currentTaxComputation={taxComputation}
                      onUpdate={() => {
                        if (filingId || draftId) {
                          handleComputeTax();
                        }
                      }}
                    />
                  );
                }

                return (
                  <ComputationSection
                    key={activeSection?.id}
                    id={activeSection?.id}
                    title={activeSection?.title}
                    icon={Icon}
                    description={activeSection?.description}
                    isExpanded={true}
                    onToggle={() => {}}
                    formData={formData[activeSection?.id] || {}}
                    fullFormData={formData || {}}
                    readOnly={isReadOnly}
                    onUpdate={(data) => updateFormData(activeSection?.id, data)}
                    selectedITR={selectedITR}
                    taxComputation={taxComputation}
                    onTaxComputed={setTaxComputation}
                    regime={taxRegime}
                    assessmentYear={assessmentYear}
                    onDataUploaded={handleDataUploaded}
                    renderContentOnly={true}
                    validationErrors={validationErrors[activeSection?.id] || {}}
                    autoFilledFields={autoFilledFields}
                    prefetchSources={prefetchSources}
                    fieldVerificationStatuses={fieldVerificationStatuses}
                    fieldSources={fieldSources}
                  />
                );
              })()}
            </motion.div>
          </div>

          {/* Read-only notice (minimal) */}
          {isReadOnly && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-info-100 text-info-800 px-4 py-2 rounded-full text-sm shadow-md z-40">
              <Info className="h-4 w-4 inline mr-2" />
              Read-only mode
            </div>
          )}

          {/* E-Verification Modal */}
          {showEVerificationModal && (
            <EVerificationModal
              isOpen={showEVerificationModal}
              onClose={() => setShowEVerificationModal(false)}
              draftId={draftId}
              filingId={filingId}
              onVerificationComplete={handleVerificationComplete}
              formData={formData}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default ITRComputation;
