/**
 * ITR Filing — Story Dashboard Layout
 * Single-page financial story: responsive card grid + result section + zoom editing.
 * All business logic (state, hooks, mutations, effects) unchanged.
 * Render rewrite only — accordion/stepper → card grid + Framer Motion zoom.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase, Home, TrendingUp, Building2, DollarSign, Globe,
  Loader2, Download, Send, CheckCircle,
  ArrowLeft, Trash2, Upload, AlertTriangle,
  User, FileText, Landmark, Check, MoreHorizontal, Clock, Plus, X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import useUnsavedWarning from '../../../hooks/useUnsavedWarning';
import useNetworkStatus from '../../../hooks/useNetworkStatus';
import useThemeStore from '../../../store/useThemeStore';
import { validateBankAccount } from '../../../utils/itrValidation';
import { generateWhispers, getWhispersForSection } from '../../../utils/taxBrain';
import toast from 'react-hot-toast';
import P from '../../../styles/palette';
import './itr-story.css';
import './filing-editor.css';

import SalaryEditor from './editors/SalaryEditor';
import HousePropertyEditor from './editors/HousePropertyEditor';
import OtherIncomeEditor from './editors/OtherIncomeEditor';
import CapitalGainsEditor from './editors/CapitalGainsEditor';
import BusinessEditor from './editors/BusinessEditor';
import ForeignIncomeEditor from './editors/ForeignIncomeEditor';
import DeductionsEditor from './editors/DeductionsEditor';
import BankEditor from './editors/BankEditor';
import ImportDocumentModal from './import/ImportDocumentModal';
import ImportReviewScreen from './import/ImportReviewScreen';
import ImportHistoryPanel from './import/ImportHistoryPanel';
import PersonalInfoEditor, { getCompletionInfo } from './editors/PersonalInfoEditor';
import TaxPaymentGuide from './TaxPaymentGuide';
import PaymentGate from './PaymentGate';
import FilerInfoCard from './editors/FilerInfoCard';
import ErrorBoundary from '../../../components/ErrorBoundary';
import FormulaBar from '../../../components/Filing/FormulaBar';
import SummaryCards from '../../../components/Filing/SummaryCards';
import TaxComputationCard from '../../../components/Filing/TaxComputationCard';
import SmartButton from '../../../components/UI/SmartButton';
import CountingNumber from '../../../components/UI/CountingNumber';
import { validateFilingCompleteness } from '../../../utils/filingCompletenessValidator';
import ProgressRing from '../../../components/Filing/ProgressRing';
import ReadinessChecklist from '../../../components/Filing/ReadinessChecklist';
import RecommendationsPanel from '../../../components/Filing/RecommendationsPanel';
import OnboardingFlow from '../../../components/Filing/OnboardingFlow';
import AutoFillOrchestrator from '../../../components/Filing/AutoFillOrchestrator';
import { computeProgress } from '../../../utils/progressScorer';
import { deriveChecklist } from '../../../utils/readinessDeriver';
import { generateRecommendations } from '../../../utils/taxBrain';
import { getDefaults, validateRegimeSwitch, checkITR1Applicability } from '../../../utils/smartDefaults';

const n = (v) => Number(v) || 0;
const fmt = (v) => `\u20B9${Math.abs(n(v)).toLocaleString('en-IN')}`;

const SOURCES = [
  { id: 'salary', icon: Briefcase, label: 'Salary', color: '#059669', bg: '#f0fdf4', editor: SalaryEditor },
  { id: 'house_property', icon: Home, label: 'House Property', color: '#7c3aed', bg: '#f5f3ff', editor: HousePropertyEditor },
  { id: 'other', icon: DollarSign, label: 'Other Income', color: '#6b7280', bg: '#f9fafb', editor: OtherIncomeEditor },
  { id: 'capital_gains', icon: TrendingUp, label: 'Capital Gains', color: '#0D9488', bg: '#F0FDFA', editor: CapitalGainsEditor },
  { id: 'business', icon: Building2, label: 'Business', color: '#CA8A04', bg: '#FEFCE8', editor: BusinessEditor },
  { id: 'foreign', icon: Globe, label: 'Foreign Income', color: '#0891b2', bg: '#f0f9ff', editor: ForeignIncomeEditor },
];

// ITR type based on active sources
function getITRType(active, payload) {
  if (active.includes('business')) {
    // Distinguish ITR-3 (full business) from ITR-4 (presumptive)
    // If user has presumptive entries but NO full business entries → ITR-4
    const hasPresumptive = (payload?.income?.presumptive?.entries || []).length > 0;
    const hasFullBusiness = (payload?.income?.business?.businesses || []).length > 0;
    if (hasPresumptive && !hasFullBusiness) return 'ITR-4';
    return 'ITR-3';
  }
  if (active.includes('capital_gains') || active.includes('foreign')) return 'ITR-2';
  return 'ITR-1';
}

const ITR_NAMES = { 'ITR-1': 'Sahaj', 'ITR-2': 'Capital Gains', 'ITR-3': 'Business', 'ITR-4': 'Sugam' };
const EP_MAP = { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3', 'ITR-4': 'itr4' };

// Map source IDs to relevant import document types
// eslint-disable-next-line camelcase
const SOURCE_IMPORTS = {
  salary: [{ type: 'form16', label: 'Form 16', color: '#059669' }],
  other: [{ type: 'form16a', label: 'Form 16A', color: '#0891b2' }, { type: '26as', label: '26AS', color: '#0D9488' }, { type: 'ais', label: 'AIS', color: '#7c3aed' }],
  'capital_gains': [{ type: 'form16b', label: 'Form 16B', color: '#CA8A04' }, { type: 'ais', label: 'AIS', color: '#7c3aed' }],
  'house_property': [{ type: 'form16c', label: 'Form 16C', color: '#6b7280' }, { type: '26as', label: '26AS', color: '#0D9488' }],
  deductions: [{ type: 'form16', label: 'Form 16', color: '#059669' }],
};

// ── Document definitions (moved from DocumentPanel.js) ──
// eslint-disable-next-line camelcase
const DOC_DEFS = {
  identity: [
    { id: 'pan', label: 'PAN Card', desc: 'Identity verification', group: 'Identity', importType: null, section: 'personalInfo' },
    { id: 'aadhaar', label: 'Aadhaar Card', desc: 'For e-verification after filing', group: 'Identity', importType: null, section: 'personalInfo' },
  ],
  salary: [
    { id: 'form16', label: 'Form 16', desc: 'Salary, TDS, employer details', group: 'Salary & TDS', importType: 'form16', section: 'salary' },
  ],
  tds: [
    { id: '26as', label: 'Form 26AS', desc: 'Verifies all TDS credits', group: 'Salary & TDS', importType: '26as', section: 'bank' },
    { id: 'ais', label: 'AIS', desc: 'Cross-checks all reported income', group: 'Salary & TDS', importType: 'ais', section: null },
  ],
  other: [
    { id: 'bank_stmt', label: 'Bank Statement', desc: 'Interest income + account details', group: 'Other Income', importType: null, section: 'other' },
    { id: 'form16a', label: 'Form 16A', desc: 'TDS on non-salary income', group: 'Other Income', importType: 'form16a', section: 'bank' },
  ],
  // eslint-disable-next-line camelcase
  house_property: [
    { id: 'loan_cert', label: 'Home Loan Certificate', desc: 'Interest paid on housing loan', group: 'House Property', importType: null, section: 'house_property' },
    { id: 'rent_receipts', label: 'Rent Receipts / Agreement', desc: 'Proof of rent received (let-out)', group: 'House Property', importType: null, section: 'house_property' },
    { id: 'form16c', label: 'Form 16C', desc: 'TDS on rent (from tenant)', group: 'House Property', importType: 'form16c', section: 'bank' },
  ],
  // eslint-disable-next-line camelcase
  capital_gains: [
    { id: 'broker_cg', label: 'Broker CG Statement', desc: 'Capital gains from shares/MF', group: 'Capital Gains', importType: null, section: 'capital_gains' },
    { id: 'form16b', label: 'Form 16B', desc: 'TDS on property sale', group: 'Capital Gains', importType: 'form16b', section: 'bank' },
  ],
  deductions: [
    { id: 'invest_proofs', label: 'Investment Proofs', desc: 'PPF, ELSS, LIC for 80C', group: 'Deductions', importType: null, section: 'deductions' },
    { id: 'health_receipt', label: 'Health Insurance Receipt', desc: '80D premium proof', group: 'Deductions', importType: null, section: 'deductions' },
    { id: 'donation_receipt', label: 'Donation Receipts', desc: '80G donation proof with PAN', group: 'Deductions', importType: null, section: 'deductions' },
  ],
  bank: [
    { id: 'bank_passbook', label: 'Bank Passbook / Cheque', desc: 'Account number, IFSC for refund', group: 'Bank', importType: null, section: 'bank' },
  ],
};

function fmtShort(v) {
  const num = Number(v) || 0;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`;
  return `₹${num.toLocaleString('en-IN')}`;
}

// ── Pure utility functions for Story Dashboard ──

/**
 * Mask a PAN string: first 5 + '****' + last char.
 * Returns '' for null/undefined/short strings.
 */
export function maskPan(pan) {
  if (!pan || typeof pan !== 'string' || pan.length < 6) return '';
  return pan.slice(0, 5) + '****' + pan.slice(-1);
}

/**
 * Get summary data for a card section.
 * Pure function: given (sectionId, payload, comp, income, selectedRegime) → { number, summary, completionText? }
 */
export function getCardSummary(sectionId, payload, comp, income, selectedRegime) {
  const bestRegime = comp?.[selectedRegime === 'old' ? 'oldRegime' : 'newRegime'];
  switch (sectionId) {
    case 'personalInfo': {
      const pi = payload?.personalInfo || {};
      const info = getCompletionInfo(pi);
      const name = [pi.firstName, pi.lastName].filter(Boolean).join(' ');
      return {
        number: name || null,
        summary: pi.pan ? `PAN: ${maskPan(pi.pan)}` : null,
        completionText: `${info.filled}/${info.total} fields`,
      };
    }
    case 'salary': {
      const employers = payload?.income?.salary?.employers || [];
      const total = income?.salary?.netTaxable;
      const empName = employers[0]?.name;
      return {
        number: total != null ? fmt(total) : null,
        summary: employers.length > 0
          ? `${empName}${employers.length > 1 ? ` + ${employers.length - 1} more` : ''}`
          : null,
      };
    }
    case 'house_property': {
      const hp = income?.houseProperty;
      return {
        number: hp?.netIncome != null ? fmt(hp.netIncome) : null,
        summary: hp?.type === 'SELF_OCCUPIED' ? 'Self-occupied' : hp?.type === 'LET_OUT' ? 'Let-out' : null,
      };
    }
    case 'other': {
      const os = payload?.income?.otherSources || {};
      const total = income?.otherSources?.total;
      const agri = n(payload?.income?.agriculturalIncome);
      const parts = [];
      if (n(os.fdInterest)) parts.push(`FD ${fmtShort(os.fdInterest)}`);
      if (n(os.savingsInterest)) parts.push(`Savings ${fmtShort(os.savingsInterest)}`);
      if (n(os.dividendIncome)) parts.push(`Div ${fmtShort(os.dividendIncome)}`);
      if (agri > 0) parts.push(`Agri ${fmtShort(agri)}`);
      return {
        number: total != null && total > 0 ? fmt(total) : null,
        summary: parts.length > 0 ? parts.slice(0, 3).join(' + ') : null,
      };
    }
    case 'capital_gains': {
      const txns = payload?.income?.capitalGains?.transactions || [];
      const total = income?.capitalGains?.totalTaxable;
      return {
        number: total != null ? fmt(total) : null,
        summary: txns.length > 0 ? `${txns.length} transaction${txns.length > 1 ? 's' : ''}` : null,
      };
    }
    case 'business': {
      const entries = payload?.income?.presumptive?.entries || [];
      const businesses = payload?.income?.business?.businesses || [];
      const total = income?.business?.netProfit || income?.presumptive?.totalIncome;
      const count = entries.length + businesses.length;
      return {
        number: total != null ? fmt(total) : null,
        summary: count > 0 ? `${count} entr${count > 1 ? 'ies' : 'y'}` : null,
      };
    }
    case 'deductions': {
      const totalDed = bestRegime?.deductions;
      const breakdown = bestRegime?.deductionBreakdown || {};
      const sections = Object.entries(breakdown)
        .filter(([, v]) => n(v) > 0)
        .map(([k]) => k.replace('section', ''));
      return {
        number: totalDed != null && totalDed > 0 ? fmt(totalDed) : null,
        summary: sections.length > 0 ? sections.slice(0, 2).join(' + ') : null,
      };
    }
    case 'bank': {
      const bd = payload?.bankDetails || {};
      return {
        number: bd.bankName ? `${bd.bankName} ****${(bd.accountNumber || '').slice(-4)}` : null,
        summary: bd.ifsc ? `IFSC: ${bd.ifsc}` : null,
      };
    }
    default:
      return { number: null, summary: null };
  }
}

/**
 * Build the card sections array in filing order:
 * Personal Info → active sources (in SOURCES order) → Deductions → Bank & Submit
 */
export function buildCardSections(active) {
  return [
    { id: 'personalInfo', icon: User, label: 'Personal Info', color: '#6366f1', bg: '#eef2ff' },
    ...SOURCES.filter(src => active.includes(src.id)).map(src => ({
      id: src.id, icon: src.icon, label: src.label, color: src.color, bg: src.bg,
    })),
    { id: 'deductions', icon: CheckCircle, label: 'Deductions', color: '#059669', bg: '#f0fdf4' },
    { id: 'bank', icon: Landmark, label: 'Bank & Submit', color: '#6b7280', bg: 'var(--bg-muted)' },
  ];
}

/**
 * Generate personalised document checklist based on active income sources.
 */
function generateChecklist(activeSources, payload, panVerified) {
  const docs = [];

  // Identity — always needed
  docs.push({
    ...DOC_DEFS.identity[0],
    status: panVerified ? 'done' : 'pending',
    summary: panVerified ? 'Verified' : null,
  });
  docs.push({
    ...DOC_DEFS.identity[1],
    status: payload?.personalInfo?.aadhaar ? 'done' : 'pending',
    summary: payload?.personalInfo?.aadhaar ? 'Added' : null,
  });

  // Salary docs
  if (activeSources.includes('salary')) {
    const hasForm16 = (payload?._importMeta?.imports || []).some(i => i.documentType === 'form16' && i.status === 'confirmed');
    const employers = payload?.income?.salary?.employers || [];
    docs.push({
      ...DOC_DEFS.salary[0],
      status: hasForm16 || employers.length > 0 ? 'done' : 'pending',
      summary: employers.length > 0 ? `${employers[0]?.name || 'Employer'} · ${fmtShort(employers.reduce((s, e) => s + (Number(e.grossSalary) || 0), 0))}` : null,
    });
  }

  // 26AS + AIS — always useful
  const has26AS = (payload?._importMeta?.imports || []).some(i => i.documentType === '26as' && i.status === 'confirmed');
  const hasAIS = (payload?._importMeta?.imports || []).some(i => i.documentType === 'ais' && i.status === 'confirmed');
  docs.push({ ...DOC_DEFS.tds[0], status: has26AS ? 'done' : 'pending', summary: has26AS ? 'Imported' : null });
  docs.push({ ...DOC_DEFS.tds[1], status: hasAIS ? 'done' : 'pending', summary: hasAIS ? 'Imported' : null });

  // Other income docs
  if (activeSources.includes('other')) {
    docs.push({ ...DOC_DEFS.other[0], status: 'pending', summary: null });
    const has16A = (payload?._importMeta?.imports || []).some(i => i.documentType === 'form16a' && i.status === 'confirmed');
    docs.push({ ...DOC_DEFS.other[1], status: has16A ? 'done' : 'pending', summary: has16A ? 'Imported' : null });
  }

  // House property docs
  if (activeSources.includes('house_property')) {
    DOC_DEFS.house_property.forEach(d => {
      const hasImport = d.importType ? (payload?._importMeta?.imports || []).some(i => i.documentType === d.importType && i.status === 'confirmed') : false;
      docs.push({ ...d, status: hasImport ? 'done' : 'pending', summary: hasImport ? 'Imported' : null });
    });
  }

  // Capital gains docs
  if (activeSources.includes('capital_gains')) {
    DOC_DEFS.capital_gains.forEach(d => {
      const hasImport = d.importType ? (payload?._importMeta?.imports || []).some(i => i.documentType === d.importType && i.status === 'confirmed') : false;
      docs.push({ ...d, status: hasImport ? 'done' : 'pending', summary: hasImport ? 'Imported' : null });
    });
  }

  // Deduction docs
  const hasDeductions = Number(payload?.deductions?.ppf || 0) + Number(payload?.deductions?.elss || 0) + Number(payload?.deductions?.healthSelf || 0) > 0;
  docs.push({ ...DOC_DEFS.deductions[0], status: hasDeductions ? 'done' : 'pending', summary: hasDeductions ? 'Added' : null });
  docs.push({ ...DOC_DEFS.deductions[1], status: Number(payload?.deductions?.healthSelf || 0) > 0 ? 'done' : 'pending', summary: null });
  const hasDonations = (payload?.deductions?.donations80G || []).length > 0;
  docs.push({ ...DOC_DEFS.deductions[2], status: hasDonations ? 'done' : 'pending', summary: hasDonations ? `${payload.deductions.donations80G.length} donation(s)` : null });

  // Bank docs — always needed
  const hasBank = !!(payload?.bankDetails?.bankName && payload?.bankDetails?.accountNumber);
  docs.push({ ...DOC_DEFS.bank[0], status: hasBank ? 'done' : 'pending', summary: hasBank ? `${payload.bankDetails.bankName} ****${(payload.bankDetails.accountNumber || '').slice(-4)}` : null });

  return docs;
}

/**
 * Get documents relevant to a specific section.
 */
function getDocsForSection(sectionId, activeSources, payload, panVerified) {
  const all = generateChecklist(activeSources, payload, panVerified);
  return all.filter(d => d.section === sectionId);
}

// Section completion check — returns true if section has meaningful data
/* eslint-disable camelcase */
function isSectionComplete(id, payload, comp) {
  const p = payload || {};
  switch (id) {
    case 'personalInfo': return getCompletionInfo(p.personalInfo || {}).complete;
    case 'salary': return (p.income?.salary?.employers || []).length > 0;
    case 'house_property': return p.income?.houseProperty?.type && !['none', 'NONE'].includes(p.income.houseProperty.type);
    case 'other': return n(p.income?.otherSources?.savingsInterest) + n(p.income?.otherSources?.fdInterest) + n(p.income?.otherSources?.dividendIncome) + n(p.income?.otherSources?.otherIncome) > 0;
    case 'capital_gains': return (p.income?.capitalGains?.transactions || []).length > 0;
    case 'business': return (p.income?.presumptive?.entries || []).length > 0 || (p.income?.business?.businesses || []).length > 0;
    case 'foreign': return (p.income?.foreignIncome?.incomes || []).length > 0;
    case 'deductions': return n(p.deductions?.ppf) + n(p.deductions?.elss) + n(p.deductions?.lic) + n(p.deductions?.nps) + n(p.deductions?.healthSelf) > 0;
    case 'bank': return !!(p.bankDetails?.bankName && p.bankDetails?.accountNumber);
    default: return false;
  }
}
/* eslint-enable camelcase */

// Check if a section has *some* data (but may not be complete) — for partial indicator
/* eslint-disable camelcase */
function hasSomeData(sectionId, payload) {
  const p = payload || {};
  switch (sectionId) {
    case 'personalInfo': {
      const info = getCompletionInfo(p.personalInfo || {});
      return info.filled > 0;
    }
    case 'salary': return (p.income?.salary?.employers || []).length > 0;
    case 'house_property': return !!(p.income?.houseProperty?.type && p.income.houseProperty.type !== 'none' && p.income.houseProperty.type !== 'NONE');
    case 'other': {
      const os = p.income?.otherSources || {};
      return !!(n(os.savingsInterest) || n(os.fdInterest) || n(os.dividendIncome) || n(os.otherIncome) || n(os.familyPension) || n(p.income?.agriculturalIncome));
    }
    case 'capital_gains': return (p.income?.capitalGains?.transactions || []).length > 0;
    case 'business': return (p.income?.presumptive?.entries || []).length > 0 || (p.income?.business?.businesses || []).length > 0;
    case 'foreign': return (p.income?.foreignIncome?.incomes || []).length > 0;
    case 'deductions': {
      const d = p.deductions || {};
      return !!(n(d.ppf) || n(d.elss) || n(d.lic) || n(d.nps) || n(d.healthSelf) || n(d.healthParent) || n(d.nps80CCD1B) || n(d.educationLoan));
    }
    case 'bank': return !!(p.bankDetails?.bankName || p.bankDetails?.accountNumber);
    default: return false;
  }
}
/* eslint-enable camelcase */

// Derive 3-state completion: 'none' | 'partial' | 'complete'
function getCompletionStatus(sectionId, payload, comp) {
  if (isSectionComplete(sectionId, payload, comp)) return 'complete';
  if (hasSomeData(sectionId, payload)) return 'partial';
  return 'none';
}

export default function ITR1Flow() {
  const { filingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  const { isOnline } = useNetworkStatus();
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  // Guard: if filingId is missing or literally "undefined", redirect to start
  if (!filingId || filingId === 'undefined') {
    return <Navigate to="/filing/start" replace />;
  }

  const { data: filing, isLoading, isError, error } = useQuery({
    queryKey: ['filing', filingId],
    queryFn: async () => (await api.get(`/filings/${filingId}`)).data.data,
    enabled: !!filingId && filingId !== 'undefined',
  });

  const [active, setActive] = useState(['salary']);
  const [selected, setSelected] = useState(null);
  const [comp, setComp] = useState(null);
  const [bankData, setBankData] = useState({ bankName: '', accountNumber: '', ifsc: '', accountType: 'SAVINGS' });
  const [bankErrors, setBankErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRegime, setSelectedRegime] = useState('new');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importReviewData, setImportReviewData] = useState(null);
  const [importPreselect, setImportPreselect] = useState(null);
  const [showPaymentGate, setShowPaymentGate] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [showImportHistory, setShowImportHistory] = useState(false);
  const [showAutoFill, setShowAutoFill] = useState(false);
  const [showRegimeConfirm, setShowRegimeConfirm] = useState(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isComputing, setIsComputing] = useState(false);

  // Focus management refs
  const cardRefs = useRef({});
  const previousSelected = useRef(null);

  // Global dirty tracking
  const [globalDirty, setGlobalDirty] = useState(false);
  useUnsavedWarning(globalDirty);

  // Init from filing — only on first load, not on every refetch
  const filingInitializedRef = useRef(false);
  useEffect(() => {
    if (!filing) return;
    if (filingInitializedRef.current) return; // Skip re-init on refetch
    filingInitializedRef.current = true;
    const p = filing.jsonPayload || {};

    const s = new Set();
    const savedSources = p._selectedSources;
    if (Array.isArray(savedSources) && savedSources.length > 0) {
      savedSources.forEach(src => s.add(src));
    } else {
      if (p.income?.salary?.employers?.length) s.add('salary');
      if (p.income?.houseProperty?.type && !['NONE', 'none'].includes(p.income.houseProperty.type)) s.add('house_property');
      if (p.income?.capitalGains?.transactions?.length) s.add('capital_gains');
      if (p.income?.business?.businesses?.length || p.income?.presumptive?.entries?.length) s.add('business');
      if (n(p.income?.otherSources?.savingsInterest) + n(p.income?.otherSources?.fdInterest) + n(p.income?.otherSources?.dividendIncome) + n(p.income?.otherSources?.familyPension) + n(p.income?.otherSources?.otherIncome) + n(p.income?.agriculturalIncome) > 0) s.add('other');
      if (p.income?.foreignIncome?.incomes?.length) s.add('foreign');
    }
    if (s.size === 0) {
      const itr = filing.itrType || 'ITR-1';
      if (itr === 'ITR-3') s.add('business');
      else if (itr === 'ITR-4') s.add('business');
      else s.add('salary');
    }
    setActive([...s]);
    const bd = p.bankDetails || {};
    if (bd.bankName || bd.accountNumber) setBankData({ bankName: bd.bankName || '', accountNumber: bd.accountNumber || '', ifsc: bd.ifsc || '', accountType: bd.accountType || 'SAVINGS' });
    setSelectedRegime(filing.selectedRegime || p.selectedRegime || 'new');

    // Task 10.7: Apply smart defaults on new filing creation
    if (!p._defaultsApplied && !p.personalInfo?.residentialStatus) {
      const defaults = getDefaults();
      saveMut.mutate({
        personalInfo: {
          residentialStatus: defaults.residentialStatus,
          filingStatus: defaults.filingStatus,
          employerCategory: defaults.employerCategory,
        },
        _defaultsApplied: true,
      });
    }
  }, [filing]);

  const computeTimeoutRef = useRef(null);

  const saveMut = useMutation({
    mutationFn: async (updates) => {
      const currentPayload = filing?.jsonPayload || {};
      const body = { jsonPayload: deepMerge(currentPayload, updates) };
      if (updates.selectedRegime) { body.selectedRegime = updates.selectedRegime; setSelectedRegime(updates.selectedRegime); }
      // Task 10.2: Include version for optimistic locking
      if (filing?.version !== undefined) { body.version = filing.version; }

      try {
        const res = await api.put(`/filings/${filingId}`, body);
        // ITR type auto-switch: just show a toast, don't navigate (same component handles all ITR types)
        if (res.data?.itrTypeChanged && res.data?.newItrType) {
          toast.success(`Form updated to ${res.data.newItrType}`, { id: 'itr-switch' });
        }
      } catch (err) {
        // Task 10.2: On 409 VERSION_CONFLICT, refetch + re-merge + retry once
        if (err.response?.status === 409 && err.response?.data?.code === 'VERSION_CONFLICT') {
          // Re-fetch fresh filing, re-merge local changes, retry once
          const { data: freshData } = await api.get(`/filings/${filingId}`);
          const freshFiling = freshData.data;
          const remergedPayload = deepMerge(freshFiling?.jsonPayload || {}, updates);
          const retryBody = { jsonPayload: remergedPayload, version: freshFiling?.version };
          if (updates.selectedRegime) retryBody.selectedRegime = updates.selectedRegime;
          await api.put(`/filings/${filingId}`, retryBody);
        } else {
          throw err;
        }
      }
    },
    onMutate: () => { setGlobalDirty(true); },
    onSuccess: () => {
      setGlobalDirty(false);
      if (computeTimeoutRef.current) clearTimeout(computeTimeoutRef.current);
      computeTimeoutRef.current = setTimeout(() => recompute(), 800);
      qc.invalidateQueries({ queryKey: ['filing', filingId] });
      qc.invalidateQueries({ queryKey: ['filings'] });
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
      // Auto-advance: if current section is complete, move to next incomplete
      if (selected) {
        const idx = cardSections.findIndex(s => s.id === selected);
        if (idx >= 0 && idx < cardSections.length - 1) {
          // Small delay to let the query invalidation update payload
          setTimeout(() => {
            const freshPayload = qc.getQueryData(['filing', filingId])?.jsonPayload || payload;
            if (isSectionComplete(selected, freshPayload, comp)) {
              setSelected(cardSections[idx + 1].id);
            }
          }, 300);
        } else {
          setSelected(null); // Last section — collapse to show computation
        }
      }
    },
    onError: (e) => {
      // Don't clear dirty flag — data is still unsaved
      const msg = e?.response?.status === 409
        ? 'Syncing latest changes...'
        : (e?.userMessage || e?.response?.data?.error || 'Save failed');
      if (e?.response?.status === 409) {
        toast(msg, { id: 'save-sync', icon: '🔄', duration: 2000 });
        qc.invalidateQueries({ queryKey: ['filing', filingId] });
      } else {
        toast.error(msg, { id: 'save-error' });
      }
    },
  });

  const recompute = useCallback(async () => {
    try {
      setIsComputing(true);
      const itr = getITRType(active, filing?.jsonPayload);
      const r = await api.post(`/filings/${filingId}/${EP_MAP[itr] || 'itr1'}/compute`);
      setComp(r.data.data);
    } catch { /* silent */ } finally { setIsComputing(false); }
  }, [filingId, active]); // eslint-disable-line

  // Initial computation on first load only (not on every filing refetch)
  const initialComputeRef = useRef(false);
  useEffect(() => {
    if (filing && !initialComputeRef.current) {
      initialComputeRef.current = true;
      recompute();
    }
  }, [filing]); // eslint-disable-line

  // When active sources change, navigate to the correct ITR route and persist
  const activeInitializedRef = useRef(false);
  useEffect(() => {
    if (!filing) return;
    // Skip save on initial mount — only persist when user actually changes sources
    if (!activeInitializedRef.current) {
      activeInitializedRef.current = true;
      return;
    }
    // Persist selected sources
    const body = { jsonPayload: deepMerge(filing?.jsonPayload || {}, { _selectedSources: active }), version: filing?.version };
    api.put(`/filings/${filingId}`, body).then((res) => {
      // Recompute with the correct ITR type
      const newItr = res.data?.newItrType || getITRType(active, filing?.jsonPayload);
      return api.post(`/filings/${filingId}/${EP_MAP[newItr] || 'itr1'}/compute`);
    }).then((r) => {
      setComp(r.data.data);
    }).catch(() => { /* silent — non-critical */ });
  }, [active]); // eslint-disable-line

  // Auto-expand PersonalInfo when empty or incomplete on first open
  useEffect(() => {
    if (!filing) return;
    const pi = filing.jsonPayload?.personalInfo;
    if (!pi || Object.keys(pi).length === 0) {
      setSelected('personalInfo');
    } else {
      const info = getCompletionInfo(pi);
      if (!info.complete && selected === null) {
        setSelected('personalInfo');
      }
    }
  }, [filing?.id]); // eslint-disable-line

  // Escape key handler — close Zoom_View
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selected !== null) {
        setSelected(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selected]);

  // Focus management: on collapse → focus previous card
  useEffect(() => {
    if (selected !== null) {
      previousSelected.current = selected;
    } else if (previousSelected.current) {
      // Focus the card that was previously expanded
      const timer = setTimeout(() => {
        const cardEl = cardRefs.current[previousSelected.current];
        if (cardEl) {
          cardEl.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selected]);

  // Scroll expanded card into view
  useEffect(() => {
    if (!selected) return;
    const timer = setTimeout(() => {
      const el = document.querySelector('.story-card--open');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      // Task 10.8: Focus first interactive element in editor
      const editor = document.querySelector('.story-editor');
      if (editor) {
        const focusable = editor.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) focusable.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [selected]);

  // Close overflow menu when clicking outside
  useEffect(() => {
    if (!showOverflowMenu) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.story-overflow')) {
        setShowOverflowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOverflowMenu]);

  const toggleSource = (id) => {
    setActive(prev => {
      const next = prev.includes(id) ? (prev.length > 1 ? prev.filter(s => s !== id) : prev) : [...prev, id];
      if (prev.includes(id) && selected === id) {
        setSelected(null);
      }
      return next;
    });
    if (!active.includes(id)) setSelected(id);
  };

  // Task 10.7: Regime switch with safety confirmation
  const handleRegimeSwitch = useCallback((newRegime) => {
    if (newRegime === selectedRegime) return;
    const check = validateRegimeSwitch(selectedRegime, newRegime, comp);
    if (!check.safe) {
      setShowRegimeConfirm({ newRegime, taxIncrease: check.taxIncrease });
    } else {
      setSelectedRegime(newRegime);
      saveMut.mutate({ selectedRegime: newRegime });
    }
  }, [selectedRegime, comp, saveMut]);

  const confirmRegimeSwitch = useCallback(() => {
    if (!showRegimeConfirm) return;
    setSelectedRegime(showRegimeConfirm.newRegime);
    saveMut.mutate({ selectedRegime: showRegimeConfirm.newRegime });
    setShowRegimeConfirm(null);
  }, [showRegimeConfirm, saveMut]);

  // Task 10.2: Readiness checklist navigation
  const handleReadinessNavigate = useCallback((section, field) => {
    const sectionMap = {
      'Personal Info': 'personalInfo',
      'Income': 'salary',
      'Bank': 'bank',
      'Salary': 'salary',
      'Other Income': 'other',
      'House Property': 'house_property',
      'Capital Gains': 'capital_gains',
      'Business': 'business',
      'Deductions': 'deductions',
      'Taxes Paid': 'bank',
      'General': 'personalInfo',
    };
    const target = sectionMap[section] || 'personalInfo';
    setSelected(target);
  }, []);

  const handleDelete = async () => {
    try {
      await api.delete(`/filings/${filingId}`);
      toast.success('Filing deleted');
      navigate('/dashboard');
    } catch (e) { toast.error(e.response?.data?.error || 'Cannot delete'); }
    setShowDeleteConfirm(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const bd = filing?.jsonPayload?.bankDetails || {};
    const bv = validateBankAccount(bd);
    if (!bv.valid) { setBankErrors(bv.errors); setSelected('bank'); toast.error('Complete bank details'); setIsSubmitting(false); return; }
    setBankErrors({});
    try {
      await api.post(`/filings/${filingId}/submit`);
      toast.success('Filed successfully!');
      navigate(`/filing/${filingId}/submission-status`);
    } catch (e) { toast.error(e.response?.data?.error || 'Submission failed'); }
    finally { setIsSubmitting(false); }
  };

  const downloadJSON = async () => {
    try {
      const itr = getITRType(active, filing?.jsonPayload);
      const r = await api.get(`/filings/${filingId}/${EP_MAP[itr] || 'itr1'}/json`);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(r.data, null, 2)]));
      a.download = `${itr.replace('-', '')}_AY${filing?.assessmentYear}.json`; a.click();
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === 'FILING_INCOMPLETE' && data?.issues?.length) {
        const first3 = data.issues.slice(0, 3).map(i => i.message || i.field).join(', ');
        toast.error(`Filing incomplete: ${first3}${data.issues.length > 3 ? ` (+${data.issues.length - 3} more)` : ''}`, { duration: 6000 });
        setSelected('personalInfo');
      } else {
        toast.error(data?.error || 'Download failed');
      }
    }
  };

  const downloadPDF = async () => {
    try {
      const itr = getITRType(active, filing?.jsonPayload);
      const r = await api.get(`/filings/${filingId}/computation-pdf`, { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      a.download = `${itr.replace('-', '')}_AY${filing?.assessmentYear}.pdf`; a.click();
    } catch (err) {
      toast.error(err.response?.data?.error || 'PDF download failed');
    }
  };

  const payload = filing?.jsonPayload || {};
  const itrType = getITRType(active, filing?.jsonPayload);
  const income = comp?.income;

  const whispers = useMemo(
    () => generateWhispers(payload, comp, selectedRegime),
    [payload, comp, selectedRegime],
  );
  const rec = selectedRegime;
  const bestRegime = comp?.[rec === 'old' ? 'oldRegime' : 'newRegime'];
  const altRegime = comp?.[rec === 'old' ? 'newRegime' : 'oldRegime'];
  const tds = comp?.tds;
  const maskedPan = maskPan(payload?.personalInfo?.pan);

  const openImport = (docType) => {
    setImportPreselect(docType || null);
    setShowImportModal(true);
  };

  const panVerified = !!(filing?.panVerified || payload?.personalInfo?.panVerified);

  // Reusable inline document block renderer for each section card
  const renderDocInlineBlock = (sectionId) => {
    const docs = getDocsForSection(sectionId, active, payload, panVerified);
    if (docs.length === 0) return null;
    return (
      <div className="hud-doc-inline">
        <div className="hud-doc-inline-title">
          <FileText size={11} /> Documents
        </div>
        {docs.map(doc => (
          <div key={doc.id} className="hud-doc-inline-item">
            <div className={`hud-doc-inline-icon ${doc.status === 'done' ? 'done' : 'pending'}`}>
              {doc.status === 'done' ? <CheckCircle size={12} /> : <FileText size={12} />}
            </div>
            <div className="hud-doc-inline-info">
              <div className="hud-doc-inline-name">{doc.label}</div>
              {doc.status === 'done' && doc.summary ? (
                <div className="hud-doc-inline-summary">{doc.summary}</div>
              ) : doc.status === 'pending' ? (
                <div className="hud-doc-inline-desc">{doc.desc}</div>
              ) : null}
            </div>
            {doc.status === 'pending' && doc.importType && (
              <button className="hud-doc-inline-action" onClick={() => openImport(doc.importType)}>
                <Upload size={10} /> Upload
              </button>
            )}
            {doc.status === 'pending' && !doc.importType && doc.section && doc.section !== selected && (
              <button className="hud-doc-inline-action" onClick={() => setSelected(doc.section)}>
                Add
              </button>
            )}
            {doc.status === 'done' && (
              <span className="hud-doc-inline-check"><Check size={14} /></span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render the correct editor component for a given section ID
  const renderEditor = (sectionId) => {
    const commonProps = {
      payload, filing, selectedRegime,
      onSave: (updates) => saveMut.mutateAsync(updates),
      isSaving: saveMut.isPending,
      activeSources: active, computation: comp, itrType,
      whispers: getWhispersForSection(whispers, sectionId),
    };

    switch (sectionId) {
      case 'personalInfo':
        return <PersonalInfoEditor {...commonProps} user={user} userProfile={profile || null} />;
      case 'deductions':
        return <DeductionsEditor {...commonProps} onUploadProof={openImport} />;
      case 'bank':
        return (
          <>
            <TaxPaymentGuide
              computation={comp?.[selectedRegime] || comp?.new || comp}
              pan={payload?.personalInfo?.pan}
              assessmentYear={filing?.assessmentYear}
              onChallanSaved={(taxData) => saveMut.mutateAsync({ taxes: taxData })}
            />
            <BankEditor {...commonProps}
              onSubmit={handleSubmit} isSubmitting={isSubmitting}
              bankData={bankData} setBankData={setBankData}
              bankErrors={bankErrors} onDownloadJSON={downloadJSON}
            />
          </>
        );
      default: {
        const src = SOURCES.find(s => s.id === sectionId);
        if (!src) return null;
        const EditorComp = src.editor;
        return <EditorComp {...commonProps} />;
      }
    }
  };

  // Build card sections for the list
  const cardSections = buildCardSections(active);

  // Task 7.3: Filing completeness for SmartButton gating (must be before early returns)
  const completeness = useMemo(() => validateFilingCompleteness(payload, itrType), [payload, itrType]);

  // Task 10.1: Progress ring data
  const progress = useMemo(() => computeProgress(payload, itrType), [payload, itrType]);

  // Task 10.1: Navigate to next incomplete section
  const handleProgressClick = useCallback(() => {
    if (progress.nextIncomplete) {
      const sectionMap = {
        'personal_info': 'personalInfo',
        'income': 'salary',
        'bank': 'bank',
        'salary': 'salary',
        'other_income': 'other',
        'house_property': 'house_property',
        'capital_gains': 'capital_gains',
        'business': 'business',
        'deductions': 'deductions',
        'taxes_paid': 'bank',
      };
      const target = sectionMap[progress.nextIncomplete] || progress.nextIncomplete;
      setSelected(target);
    }
  }, [progress]);

  // Task 10.2: Readiness checklist data
  const readiness = useMemo(() => deriveChecklist(payload, itrType), [payload, itrType]);

  // Task 10.5: Recommendations data
  const recommendations = useMemo(
    () => generateRecommendations(payload, comp, selectedRegime),
    [payload, comp, selectedRegime],
  );

  // Task 10.7: ITR-1 applicability check
  const itr1Check = useMemo(() => {
    const grossTotal = comp?.income?.grossTotal || 0;
    return checkITR1Applicability(grossTotal);
  }, [comp]);

  // Task 10.5: First-time user detection
  const isFirstFiling = useMemo(() => {
    if (!user?.id) return false;
    // Check if this is the user's only filing (no prior records)
    return !filing?.jsonPayload?._onboarding?.welcomeDismissed && !filing?.jsonPayload?._defaultsApplied;
  }, [user, filing]);

  if (isLoading) return (
    <div className="filing-layout">
      <div className="filing-topbar" style={{ background: 'var(--bg-card)' }}>
        <div style={{ width: 60, height: 14, borderRadius: 4, background: 'var(--bg-muted)', animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
        <div style={{ width: 140, height: 14, borderRadius: 4, background: 'var(--bg-muted)', animation: 'skeleton-pulse 1.5s ease-in-out infinite', animationDelay: '0.1s' }} />
      </div>
      <nav className="filing-nav">
        {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 32, borderRadius: 6, background: 'var(--bg-muted)', margin: '4px 0', animation: 'skeleton-pulse 1.5s ease-in-out infinite', animationDelay: `${i*0.08}s` }} />)}
      </nav>
      <div className="filing-editor">
        <div className="filing-editor__header"><div style={{ width: 160, height: 18, borderRadius: 4, background: 'var(--bg-muted)', animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} /></div>
        <div className="filing-editor__body">
          {[1,2,3].map(i => <div key={i} style={{ height: 60, borderRadius: 8, background: 'var(--bg-muted)', marginBottom: 12, animation: 'skeleton-pulse 1.5s ease-in-out infinite', animationDelay: `${i*0.12}s` }} />)}
        </div>
      </div>
      <aside className="filing-sidebar">
        {[1,2,3,4,5].map(i => <div key={i} style={{ height: 20, borderRadius: 4, background: 'var(--bg-muted)', marginBottom: 8, animation: 'skeleton-pulse 1.5s ease-in-out infinite', animationDelay: `${i*0.1}s` }} />)}
        <div style={{ marginTop: 'auto', height: 40, borderRadius: 8, background: 'var(--bg-muted)', animation: 'skeleton-pulse 1.5s ease-in-out infinite', animationDelay: '0.6s' }} />
      </aside>
    </div>
  );

  if (isError || !filing) {
    const status = error?.response?.status;
    const msg = status === 404 ? 'This filing was not found or may have been deleted.'
      : status === 403 ? 'You don\'t have access to this filing.'
      : 'Something went wrong loading this filing. Please check your connection.';
    return (
      <div className="story-loading" style={{ flexDirection: 'column', gap: 12 }}>
        <AlertTriangle size={32} style={{ color: 'var(--color-error)' }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{status === 403 ? 'Access denied' : 'Filing not found'}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{msg}</div>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ marginTop: 8, padding: '8px 16px', background: 'var(--brand-primary)', color: 'var(--brand-black)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const completedCount = cardSections.filter(s => getCompletionStatus(s.id, payload, comp) === 'complete').length;
  const isSubmitted = filing?.lifecycleState && filing.lifecycleState !== 'draft';

  // Build the income sub-items for the INCOME story card
  const incomeSubItems = [
    { id: 'personalInfo', icon: User, label: 'Personal Info', color: '#6366f1', bg: '#eef2ff' },
    ...SOURCES.filter(src => active.includes(src.id)).map(src => ({
      id: src.id, icon: src.icon, label: src.label, color: src.color, bg: src.bg,
    })),
  ];

  const isRefund = bestRegime && bestRegime.netPayable <= 0;

  // Task 5.3: Framer Motion entrance animation variants
  const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
  const fadeInUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
  const MotionOrDiv = reducedMotion ? 'div' : motion.div;

  return (
    <div className="filing-layout">
      {/* ── Offline Banner ── */}
      {!isOnline && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: '#fef2f2', border: '1px solid #fca5a5', padding: '6px 16px', fontSize: 12, color: '#991b1b', textAlign: 'center' }}>
          📴 You're offline. Changes will be saved when you reconnect.
        </div>
      )}

      {/* ── Top Bar ── */}
      <div className="filing-topbar">
        <button onClick={() => navigate('/dashboard')} className="filing-topbar__back">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="filing-topbar__context">
          <span className="filing-topbar__itr">{itrType}</span>
          <span className="filing-topbar__sep">·</span>
          <span>AY {filing?.assessmentYear}</span>
          {maskedPan && <><span className="filing-topbar__sep">·</span><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{maskedPan}</span></>}
        </div>
        <div className="filing-sidebar__regime" style={{ margin: 0 }}>
          {['old', 'new'].map(r => (
            <button key={r} className={`filing-sidebar__regime-btn ${selectedRegime === r ? 'active' : ''}`} onClick={() => handleRegimeSwitch(r)}>
              {r === 'old' ? 'Old' : 'New'}
            </button>
          ))}
        </div>
        <div className="filing-topbar__spacer" />
        <div className={`filing-topbar__save ${saveMut.isPending ? 'saving' : ''}`}>
          <span className="filing-topbar__save-dot" />
          {saveMut.isPending ? 'Saving...' : 'Saved'}
        </div>
      </div>

      {/* ── Left Navigation ── */}
      <nav className="filing-nav">
        <div className="filing-nav__section">
          <div className="filing-nav__section-label">Income</div>
          {[{ id: 'personalInfo', label: 'Personal Info' }, ...SOURCES.filter(s => active.includes(s.id)).map(s => ({ id: s.id, label: s.label }))].map(item => (
            <button key={item.id} className={`filing-nav__item ${selected === item.id ? 'active' : ''}`} onClick={() => setSelected(item.id)}>
              <span className={`filing-nav__item-dot filing-nav__item-dot--${getCompletionStatus(item.id, payload, comp)}`} />
              <span>{item.label}</span>
              {getCardSummary(item.id, payload, comp, income, selectedRegime).number && (
                <span className="filing-nav__item-amount">{getCardSummary(item.id, payload, comp, income, selectedRegime).number}</span>
              )}
            </button>
          ))}
          {SOURCES.filter(s => !active.includes(s.id)).length > 0 && (
            <button className="filing-nav__add" onClick={() => setSelected('addSource')}>+ Add source</button>
          )}
        </div>

        <div className="filing-nav__section">
          <div className="filing-nav__section-label">Deductions</div>
          {[
            { id: 'ded_80c', label: '80C · Investments', key: 'ppf' },
            { id: 'ded_80d', label: '80D · Health', key: 'healthSelf' },
            { id: 'ded_80g', label: '80G · Donations', key: 'donations80G' },
            { id: 'ded_nps', label: '80CCD · NPS', key: 'nps' },
          ].filter(d => {
            const ded = payload?.deductions || {};
            return Number(ded[d.key]) > 0 || (Array.isArray(ded[d.key]) && ded[d.key].length > 0);
          }).map(d => (
            <button key={d.id} className={`filing-nav__item ${selected === 'deductions' ? 'active' : ''}`} onClick={() => setSelected('deductions')}>
              <span className="filing-nav__item-dot filing-nav__item-dot--complete" />
              <span>{d.label}</span>
            </button>
          ))}
          <button className={`filing-nav__item ${selected === 'deductions' ? 'active' : ''}`} onClick={() => setSelected('deductions')}>
            <span className={`filing-nav__item-dot filing-nav__item-dot--${getCompletionStatus('deductions', payload, comp)}`} />
            <span>{(payload?.deductions && Object.values(payload.deductions).some(v => Number(v) > 0 || (Array.isArray(v) && v.length > 0))) ? 'All Deductions' : '+ Add Deductions'}</span>
          </button>
        </div>

        <div className="filing-nav__section">
          <div className="filing-nav__section-label">Finalize</div>
          <button className={`filing-nav__item ${selected === 'bank' ? 'active' : ''}`} onClick={() => setSelected('bank')}>
            <span className={`filing-nav__item-dot filing-nav__item-dot--${getCompletionStatus('bank', payload, comp)}`} />
            <span>Bank & Verify</span>
          </button>
        </div>

        <div className="filing-nav__progress">
          <div className="filing-nav__progress-bar">
            {cardSections.map(s => (
              <div key={s.id} className="filing-nav__progress-seg" style={{ background: getCompletionStatus(s.id, payload, comp) === 'complete' ? 'var(--color-success)' : getCompletionStatus(s.id, payload, comp) === 'partial' ? 'var(--color-warning)' : 'var(--border-light)' }} />
            ))}
          </div>
          <div className="filing-nav__progress-text">{completedCount}/{cardSections.length} complete</div>
        </div>
      </nav>

      {/* ── Editor Panel (contained, scrolls internally) ── */}
      <div className="filing-editor">
        <div className="filing-editor__header">
          <span className="filing-editor__title">
            {selected === 'addSource' ? 'Add Income Source' : selected ? cardSections.find(s => s.id === selected)?.label || 'Deductions' : 'Select a section'}
          </span>
        </div>
        <div className="filing-editor__body">
          {selected && selected !== 'addSource' ? (
            <ErrorBoundary name={selected}>{renderEditor(selected)}</ErrorBoundary>
          ) : selected === 'addSource' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SOURCES.filter(s => !active.includes(s.id)).map(src => (
                <button key={src.id} className="ds-card" onClick={() => { toggleSource(src.id); setSelected(src.id); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', textAlign: 'left' }}>
                  <src.icon size={18} style={{ color: src.color }} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{src.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              <TaxComputationCard computation={comp} selectedRegime={selectedRegime} tds={comp?.tds} onRegimeChange={handleRegimeSwitch} />
              <ReadinessChecklist items={readiness} onNavigate={handleReadinessNavigate} />
            </div>
          )}
        </div>
        {selected && selected !== 'addSource' && (
          <div className="filing-editor__footer">
            <div className="filing-editor__footer-nav">
              {cardSections.findIndex(s => s.id === selected) > 0 && (
                <button className="ds-btn ds-btn--sm ds-btn--outline" onClick={() => { const idx = cardSections.findIndex(s => s.id === selected); if (idx > 0) setSelected(cardSections[idx - 1].id); }}>
                  ← Prev
                </button>
              )}
              {cardSections.findIndex(s => s.id === selected) < cardSections.length - 1 && (
                <button className="ds-btn ds-btn--sm ds-btn--outline" onClick={() => { const idx = cardSections.findIndex(s => s.id === selected); if (idx < cardSections.length - 1) setSelected(cardSections[idx + 1].id); }}>
                  Next →
                </button>
              )}
            </div>
            {bestRegime && (
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: bestRegime.netPayable > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                {bestRegime.netPayable > 0 ? `Pay ₹${Math.abs(bestRegime.netPayable).toLocaleString('en-IN')}` : `Refund ₹${Math.abs(bestRegime.netPayable).toLocaleString('en-IN')}`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Right Sidebar: Checklist + Tips + Documents ── */}
      <aside className="filing-sidebar">
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-light)', marginBottom: 6 }}>Completion</div>
        {cardSections.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', fontSize: 12 }}>
            <span className={`filing-nav__item-dot filing-nav__item-dot--${getCompletionStatus(s.id, payload, comp)}`} />
            <span style={{ color: getCompletionStatus(s.id, payload, comp) === 'complete' ? 'var(--color-success)' : 'var(--text-secondary)' }}>{s.label}</span>
          </div>
        ))}

        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-light)', marginTop: 14, marginBottom: 6 }}>💡 Tips</div>
        {comp?.savings > 0 && comp.recommended !== selectedRegime && (
          <div style={{ fontSize: 11, color: 'var(--color-success)', padding: '4px 0' }}>
            Switch to {comp.recommended} regime to save ₹{comp.savings.toLocaleString('en-IN')}
          </div>
        )}
        {!payload?.deductions?.ppf && <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '3px 0' }}>💡 Add 80C investments to reduce tax</div>}
        {!payload?.deductions?.healthSelf && <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '3px 0' }}>💡 Add health insurance (80D) for deduction</div>}

        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-light)', marginTop: 14, marginBottom: 6 }}>📄 Documents</div>
        <button className="filing-nav__add" onClick={() => openImport(null)}>+ Upload Document</button>
      </aside>

      {/* ── Bottom Computation Bar (fixed) ── */}
      <div className="filing-bottombar">
        <div className="filing-bottombar__numbers">
          <div className="filing-bottombar__item"><span className="filing-bottombar__label">Gross</span><span className="filing-bottombar__value">₹{(income?.grossTotal || 0).toLocaleString('en-IN')}</span></div>
          <div className="filing-bottombar__item"><span className="filing-bottombar__label">Deductions</span><span className="filing-bottombar__value" style={{ color: 'var(--color-success)' }}>-₹{(bestRegime?.deductions || 0).toLocaleString('en-IN')}</span></div>
          <div className="filing-bottombar__item"><span className="filing-bottombar__label">Taxable</span><span className="filing-bottombar__value">₹{(bestRegime?.taxableIncome || 0).toLocaleString('en-IN')}</span></div>
          <div className="filing-bottombar__item"><span className="filing-bottombar__label">Tax + Cess</span><span className="filing-bottombar__value">₹{(bestRegime?.totalTax || 0).toLocaleString('en-IN')}</span></div>
          <div className="filing-bottombar__item"><span className="filing-bottombar__label">TDS</span><span className="filing-bottombar__value">₹{(tds?.total || 0).toLocaleString('en-IN')}</span></div>
          <div className="filing-bottombar__item filing-bottombar__item--result">
            <span className="filing-bottombar__label">{bestRegime?.netPayable > 0 ? 'Payable' : 'Refund'}</span>
            <span className={`filing-bottombar__value ${bestRegime?.netPayable > 0 ? 'filing-bottombar__value--payable' : 'filing-bottombar__value--refund'}`}>
              ₹{Math.abs(bestRegime?.netPayable || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
        <div className="filing-bottombar__actions">
          <button className="filing-sidebar__submit" onClick={handleSubmit} disabled={!completeness.complete || isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          <button className="filing-sidebar__secondary" onClick={downloadPDF} style={{ padding: '6px 10px', fontSize: 11 }}>⬇ PDF</button>
        </div>
      </div>
      {/* ── Import Modal Overlay ── */}
      {showImportModal && !importReviewData && (
        <ImportDocumentModal
          filingId={filingId}
          preselectedType={importPreselect}
          onClose={() => { setShowImportModal(false); setImportReviewData(null); setImportPreselect(null); }}
          onImportParsed={(data) => setImportReviewData(data)}
        />
      )}
      {showImportModal && importReviewData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 720, maxHeight: '90vh' }}>
            <ImportReviewScreen
              extractedData={importReviewData.extractedData}
              conflicts={importReviewData.conflicts}
              fieldMapping={importReviewData.fieldMapping}
              documentMeta={importReviewData.documentMeta}
              documentType={importReviewData.documentType}
              fileName={importReviewData.fileName}
              fileContent={importReviewData.fileContent}
              warnings={importReviewData.warnings}
              filingId={filingId}
              onClose={() => { setShowImportModal(false); setImportReviewData(null); setImportPreselect(null); }}
              onConfirmed={() => {
                qc.invalidateQueries({ queryKey: ['filing', filingId] });
                qc.invalidateQueries({ queryKey: ['importHistory', filingId] });
                setShowImportModal(false);
                setImportReviewData(null);
              }}
            />
          </div>
        </div>
      )}

      {/* ── Payment Gate Modal ── */}
      {showPaymentGate && (
        <PaymentGate
          filingId={filingId}
          itrType={itrType}
          grossIncome={comp?.income?.grossTotal || 0}
          userName={user?.fullName}
          userEmail={user?.email}
          onSuccess={() => {
            setShowPaymentGate(false);
            if (pendingAction === 'download') downloadJSON();
            setPendingAction(null);
          }}
          onClose={() => { setShowPaymentGate(false); setPendingAction(null); }}
        />
      )}

      {/* Task 10.5: OnboardingFlow for first-time users */}
      <OnboardingFlow
        isFirstFiling={isFirstFiling}
        onStartAutoFill={() => setShowAutoFill(true)}
        onSkip={() => {
          saveMut.mutate({ _onboarding: { welcomeDismissed: true } });
        }}
      />

      {/* Task 10.5: AutoFillOrchestrator */}
      {showAutoFill && (
        <AutoFillOrchestrator
          filingId={filingId}
          payload={payload}
          onComplete={(mergedPayload, summary) => {
            setShowAutoFill(false);
            if (!mergedPayload) return; // user skipped
            qc.invalidateQueries({ queryKey: ['filing', filingId] });
            recompute();
            toast.success(`Auto-fill complete — ${summary?.fieldsPopulated || 0} fields populated`);
          }}
          onError={() => { /* error handled inside component */ }}
          onFallbackImport={() => { setShowAutoFill(false); openImport(null); }}
        />
      )}

      {/* Task 10.7: Regime switch confirmation dialog */}
      {showRegimeConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
          role="dialog" aria-modal="true" aria-label="Confirm regime switch"
        >
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: 24,
            maxWidth: 380, width: '90vw', boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Switch Regime?
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Switching to {showRegimeConfirm.newRegime === 'old' ? 'Old' : 'New'} regime will increase your tax by{' '}
              <strong style={{ color: 'var(--color-error)' }}>
                ₹{(showRegimeConfirm.taxIncrease || 0).toLocaleString('en-IN')}
              </strong>. Are you sure?
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="ds-btn ds-btn-md ds-btn-secondary" onClick={() => setShowRegimeConfirm(null)}>Cancel</button>
              <button className="ds-btn ds-btn-md ds-btn-primary" onClick={confirmRegimeSwitch}>Switch Anyway</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Helper Components (kept for potential future use) ── */

function RegimeCard({ regime, label, recommended, tds }) {
  const net = regime.totalTax - n(tds?.total);
  return (
    <div style={{ padding: 12, borderRadius: 8, border: recommended ? `2px solid ${P.brand}` : `1px solid ${P.borderLight}`, background: recommended ? P.brandLight : P.bgCard, position: 'relative' }}>
      {recommended && <span style={{ position: 'absolute', top: -8, right: 8, fontSize: 10, fontWeight: 700, color: '#fff', background: P.brand, padding: '1px 8px', borderRadius: 10 }}>BEST</span>}
      <div style={{ fontSize: 13, fontWeight: 700, color: P.textPrimary, marginBottom: 6 }}>{label}</div>
      <div className="ds-summary"><span className="ds-summary__label">Taxable</span><span className="ds-summary__value">{fmt(regime.taxableIncome)}</span></div>
      <div className="ds-summary"><span className="ds-summary__label">Deductions</span><span className="ds-summary__value ds-summary__value--green">{fmt(regime.deductions)}</span></div>
      <div className="ds-summary"><span className="ds-summary__label">Tax</span><span className="ds-summary__value ds-summary__value--bold">{fmt(regime.totalTax)}</span></div>
      {n(tds?.total) > 0 && <div className="ds-summary"><span className="ds-summary__label">After TDS</span><span className={`ds-summary__value bold ${net <= 0 ? 'green' : 'red'}`}>{net <= 0 ? 'Refund ' : ''}{fmt(Math.abs(net))}</span></div>}
    </div>
  );
}

function SRow({ label, value, bold, green, color, onClick }) {
  const valCls = `ds-summary__value${bold ? ' bold' : ''}${green ? ' green' : ''}${n(value) < 0 ? ' green' : ''}`;
  return (
    <div className="ds-summary" style={onClick ? { cursor: 'pointer' } : {}} onClick={onClick}>
      <span className="ds-summary__label">{label}</span>
      <span className={valCls} style={color ? { color } : {}}>{n(value) < 0 ? '- ' : ''}{fmt(value)}</span>
    </div>
  );
}

function deepMerge(t, s) {
  const r = { ...t };
  for (const k of Object.keys(s)) {
    if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k]) && t[k] && typeof t[k] === 'object') r[k] = deepMerge(t[k], s[k]);
    else r[k] = s[k];
  }
  return r;
}
