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
import { validateBankAccount } from '../../../utils/itrValidation';
import { generateWhispers, getWhispersForSection } from '../../../utils/taxBrain';
import toast from 'react-hot-toast';
import P from '../../../styles/palette';
import './itr-story.css';

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
      return {
        number: pi.fullName || null,
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
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  // Guard: if filingId is missing or literally "undefined", redirect to start
  if (!filingId || filingId === 'undefined') {
    return <Navigate to="/filing/start" replace />;
  }

  const { data: filing, isLoading, isError } = useQuery({
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

      try {
        const itr = getITRType(active, filing?.jsonPayload);
        const r = await api.post(`/filings/${filingId}/${EP_MAP[itr] || 'itr1'}/compute`);
        setComp(r.data.data);
      } catch (compErr) {
        // Computation failure is non-blocking but logged
        console.warn('Tax computation failed:', compErr.response?.data?.error || compErr.message);
      }
    },
    onMutate: () => { setGlobalDirty(true); },
    onSuccess: () => { setGlobalDirty(false); qc.invalidateQueries({ queryKey: ['filing', filingId] }); },
    onError: (e) => {
      setGlobalDirty(false);
      if (e.response?.status === 409) {
        toast.error('Save conflict — please refresh');
      } else {
        toast.error(e.response?.data?.error || 'Save failed');
      }
    },
  });

  const recompute = useCallback(async () => {
    try {
      const itr = getITRType(active, filing?.jsonPayload);
      const r = await api.post(`/filings/${filingId}/${EP_MAP[itr] || 'itr1'}/compute`);
      setComp(r.data.data);
    } catch { /* silent */ }
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
      const r = await api.get(`/filings/${filingId}/${EP_MAP[itr] || 'itr1'}/pdf`, { responseType: 'blob' });
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

  if (isLoading) return <div className="story-loading"><Loader2 size={28} className="animate-spin" /></div>;

  if (isError || !filing) return (
    <div className="story-loading" style={{ flexDirection: 'column', gap: 12 }}>
      <AlertTriangle size={32} style={{ color: 'var(--color-error)' }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Filing not found</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>This filing may have been deleted or the link is invalid.</div>
      <button
        onClick={() => navigate('/dashboard')}
        style={{ marginTop: 8, padding: '8px 16px', background: 'var(--brand-primary)', color: 'var(--brand-black)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
      >
        Go to Dashboard
      </button>
    </div>
  );

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
    <div className="story-dashboard">
      {/* ── Top Bar ── */}
      <div className="story-top-bar">
        <button onClick={() => navigate('/dashboard')} className="story-top-bar__back">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="story-top-bar__context">
          <span className="story-top-bar__itr">{itrType} ({ITR_NAMES[itrType]})</span>
          <span className="story-top-bar__separator">·</span>
          <span className="story-top-bar__ay">AY {filing?.assessmentYear}</span>
        </div>
        <div className="story-top-bar__user">
          <span className="story-top-bar__name">{payload?.personalInfo?.fullName}</span>
          <span className="story-top-bar__pan">{maskedPan}</span>
        </div>
        <div className={`story-top-bar__save ${saveMut.isPending ? 'saving' : ''}`}>
          <span className="story-top-bar__save-dot" />
          {saveMut.isPending ? 'Saving...' : 'All changes saved'}
        </div>
      </div>

      {/* ── Split-Screen: Story Flow + Editor ── */}
      <div className="story-panels">

        {/* LEFT: The Financial Story Flow */}
        <nav className="story-flow">
          <MotionOrDiv
            {...(!reducedMotion ? { variants: staggerContainer, initial: 'hidden', animate: 'visible' } : {})}
          >

          {/* ── Card 1: INCOME ── */}
          <MotionOrDiv {...(!reducedMotion ? { variants: fadeInUp } : {})}>
          <div
            className={`story-flow__card ${['personalInfo', ...active].includes(selected) ? 'active' : ''}`}
            ref={(el) => { cardRefs.current.incomeCard = el; }}
          >
            <div className="story-flow__card-header">
              <div className="story-flow__card-icon" style={{ background: '#f0fdf4' }}>
                <DollarSign size={14} style={{ color: '#059669' }} />
              </div>
              <span className="story-flow__card-title">Income</span>
              <span className="story-flow__card-amount">
                {income?.grossTotal ? <CountingNumber value={income.grossTotal} /> : '—'}
              </span>
            </div>
            {!income?.grossTotal && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Add income sources below</div>
            )}
            <div style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 4 }}>
              {itrType} ({ITR_NAMES[itrType]}) · auto-detected from sources
            </div>
            <div className="story-flow__card-items">
              {incomeSubItems.map(item => {
                const summary = getCardSummary(item.id, payload, comp, income, selectedRegime);
                const status = getCompletionStatus(item.id, payload, comp);
                const isSource = item.id !== 'personalInfo';
                const canRemove = isSource && active.length > 1;
                return (
                  <div key={item.id} className={`story-flow__card-item ${selected === item.id ? 'active' : ''}`}>
                    <button
                      className="story-flow__card-item-btn"
                      onClick={() => setSelected(item.id)}
                      ref={(el) => { cardRefs.current[item.id] = el; }}
                    >
                      <div className="story-flow__card-item-icon" style={{ background: item.bg }}>
                        <item.icon size={10} style={{ color: item.color }} />
                      </div>
                      <span className="story-flow__card-item-label">{item.label}</span>
                      {summary.number && (
                        <span className="story-flow__card-item-amount">{summary.number}</span>
                      )}
                      <span className={`story-flow__card-item-status story-flow__card-item-status--${status}`}>
                        {status === 'complete' && <Check size={7} />}
                      </span>
                      {status !== 'complete' && (
                        <span className="story-flow__card-item-status-text">
                          {status === 'partial' ? 'In progress' : 'Not started'}
                        </span>
                      )}
                    </button>
                    {canRemove && (
                      <button
                        className="story-flow__card-item-remove"
                        onClick={(e) => { e.stopPropagation(); toggleSource(item.id); }}
                        title={`Remove ${item.label}`}
                        aria-label={`Remove ${item.label}`}
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                );
              })}
              {/* Inactive sources — toggle to add */}
              {SOURCES.filter(src => !active.includes(src.id)).length > 0 && (
                <div style={{ fontSize: 9, color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, padding: '6px 0 2px', borderTop: '1px dashed var(--border-light)', marginTop: 4 }}>
                  + Add income source
                </div>
              )}
              {SOURCES.filter(src => !active.includes(src.id)).map(src => (
                <button
                  key={src.id}
                  className="story-flow__card-item story-flow__card-item--add"
                  onClick={() => toggleSource(src.id)}
                >
                  <div className="story-flow__card-item-icon" style={{ background: 'var(--bg-muted)' }}>
                    <Plus size={10} style={{ color: 'var(--text-light)' }} />
                  </div>
                  <span className="story-flow__card-item-label" style={{ color: 'var(--text-light)' }}>{src.label}</span>
                </button>
              ))}
            </div>
          </div>
          </MotionOrDiv>

          {/* Connector */}
          <MotionOrDiv {...(!reducedMotion ? { variants: fadeInUp } : {})}>
          <div className="story-flow__connector">▼</div>
          </MotionOrDiv>

          {/* ── Card 2: DEDUCTIONS ── */}
          <MotionOrDiv {...(!reducedMotion ? { variants: fadeInUp } : {})}>
          <div
            className={`story-flow__card ${selected === 'deductions' ? 'active' : ''}`}
            onClick={() => setSelected('deductions')}
            ref={(el) => { cardRefs.current.deductions = el; }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected('deductions'); }}
          >
            <div className="story-flow__card-header">
              <div className="story-flow__card-icon" style={{ background: '#f0fdf4' }}>
                <CheckCircle size={14} style={{ color: '#059669' }} />
              </div>
              <span className="story-flow__card-title">Deductions</span>
              <span className="story-flow__card-amount" style={{ color: 'var(--color-success)' }}>
                {bestRegime?.deductions ? <CountingNumber value={bestRegime.deductions} prefix="-₹" /> : '—'}
              </span>
            </div>
            {!bestRegime?.deductions && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Click to claim deductions</div>
            )}
          </div>
          </MotionOrDiv>

          {/* Connector */}
          <MotionOrDiv {...(!reducedMotion ? { variants: fadeInUp } : {})}>
          <div className="story-flow__connector">▼</div>
          </MotionOrDiv>

          {/* ── Card 3: TAX COMPUTATION ── */}
          <MotionOrDiv {...(!reducedMotion ? { variants: fadeInUp } : {})}>
          <div
            className="story-flow__card"
            ref={(el) => { cardRefs.current.taxCard = el; }}
          >
            <div className="story-flow__card-header">
              <div className="story-flow__card-icon" style={{ background: '#eef2ff' }}>
                <TrendingUp size={14} style={{ color: '#6366f1' }} />
              </div>
              <span className="story-flow__card-title">Tax</span>
              <span className="story-flow__card-amount">
                {bestRegime?.totalTax ? <CountingNumber value={bestRegime.totalTax} /> : '—'}
              </span>
            </div>
            <div className="story-flow__regime">
              {['old', 'new'].map(r => (
                <button
                  key={r}
                  className={`story-regime-btn ${selectedRegime === r ? 'active' : ''}`}
                  onClick={() => handleRegimeSwitch(r)}
                >
                  {r === 'old' ? 'Old' : 'New'}
                </button>
              ))}
            </div>
            {comp?.savings > 0 && comp.recommended !== selectedRegime && (
              <div className="story-flow__savings">
                Switch to {comp.recommended === 'old' ? 'Old' : 'New'} to save {fmtShort(comp.savings)}
              </div>
            )}
          </div>
          </MotionOrDiv>

          {/* Connector */}
          <MotionOrDiv {...(!reducedMotion ? { variants: fadeInUp } : {})}>
          <div className="story-flow__connector">▼</div>
          </MotionOrDiv>

          {/* ── Card 4: RESULT ── */}
          <MotionOrDiv {...(!reducedMotion ? { variants: fadeInUp } : {})}>
          <div
            className={`story-flow__card result ${!isRefund && bestRegime ? 'payable' : ''} ${selected === 'bank' ? 'active' : ''}`}
            ref={(el) => { cardRefs.current.resultCard = el; }}
          >
            <div className="story-flow__card-header">
              <span className="story-flow__card-title">
                {bestRegime ? (isRefund ? 'Refund Due' : 'Tax Payable') : 'Result'}
              </span>
            </div>
            {bestRegime ? (
              <>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {isRefund ? 'Refund Due' : 'Tax Payable'}
                </div>
                <div className={`story-flow__result-hero ${isRefund ? 'refund' : 'payable'}`}>
                  <CountingNumber value={Math.abs(bestRegime.netPayable)} className="story-flow__result-hero" />
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Add income to see result
              </div>
            )}
            <div className="story-flow__result-actions">
              <SmartButton label="Submit" icon={Send} onClick={handleSubmit} completeness={completeness} variant="submit" isLoading={isSubmitting} />
              <button className="story-flow__result-icon-btn" onClick={downloadJSON} title="Download JSON" aria-label="Download JSON" disabled={!completeness.complete} style={{ opacity: completeness.complete ? 1 : 0.5 }}>
                <FileText size={13} />
              </button>
              <button className="story-flow__result-icon-btn" onClick={downloadPDF} title="Download PDF" aria-label="Download PDF">
                <Download size={13} />
              </button>
            </div>
            {/* Bank & Submit sub-item */}
            <div className="story-flow__card-items">
              <button
                className={`story-flow__card-item ${selected === 'bank' ? 'active' : ''}`}
                onClick={() => setSelected('bank')}
                ref={(el) => { cardRefs.current.bank = el; }}
              >
                <div className="story-flow__card-item-icon" style={{ background: 'var(--bg-muted)' }}>
                  <Landmark size={10} style={{ color: '#6b7280' }} />
                </div>
                <span className="story-flow__card-item-label">Bank & Submit</span>
                <span className={`story-flow__card-item-status story-flow__card-item-status--${getCompletionStatus('bank', payload, comp)}`}>
                  {getCompletionStatus('bank', payload, comp) === 'complete' && <Check size={7} />}
                </span>
              </button>
            </div>
          </div>
          </MotionOrDiv>

          </MotionOrDiv>{/* end stagger container */}

          {/* Task 10.2: Readiness Checklist — below RESULT card */}
          <ReadinessChecklist
            items={readiness.items}
            summaryText={readiness.summaryText}
            allBlockersResolved={readiness.allBlockersResolved}
            onNavigate={handleReadinessNavigate}
          />

          {/* Task 10.5: Recommendations Panel — collapsible section */}
          {recommendations.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <button
                onClick={() => setShowRecommendations(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontFamily: 'inherit',
                  fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                }}
                aria-expanded={showRecommendations}
                aria-label="Toggle tax-saving recommendations"
              >
                <span>💡 {recommendations.length} tax-saving tip{recommendations.length > 1 ? 's' : ''}</span>
                <span style={{ fontSize: 10 }}>{showRecommendations ? '▲' : '▼'}</span>
              </button>
              {showRecommendations && (
                <RecommendationsPanel
                  recommendations={recommendations}
                  onNavigate={(section) => setSelected(section)}
                />
              )}
            </div>
          )}

          {/* Task 10.7: ITR-1 applicability warning */}
          {!itr1Check.applicable && itrType === 'ITR-1' && (
            <div style={{
              padding: '8px 12px', marginTop: 8, borderRadius: 'var(--radius-md)',
              background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)',
              fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <AlertTriangle size={14} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
              <span>{itr1Check.message}</span>
            </div>
          )}

          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <div className="story-flow__delete-confirm">
              <span>Delete this filing?</span>
              <div className="story-flow__delete-confirm-actions">
                <button className="story-flow__delete-btn story-flow__delete-btn--cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button className="story-flow__delete-btn story-flow__delete-btn--confirm" onClick={handleDelete}>Delete</button>
              </div>
            </div>
          )}

          {/* Import History Panel */}
          {showImportHistory && (
            <div style={{ marginTop: 8 }}>
              <ImportHistoryPanel filingId={filingId} />
            </div>
          )}

          {/* ── Flow Footer: Import + Progress ── */}
          <div className="story-flow__footer">
            <div className="story-overflow">
              <button className="story-flow__footer-btn" onClick={() => openImport(null)} aria-label="Import documents">
                <Upload size={12} /> Import
              </button>
              <button
                className="story-flow__footer-btn"
                onClick={() => setShowOverflowMenu(p => !p)}
                style={{ marginLeft: 4 }}
                title="More"
                aria-label="More options"
              >
                <MoreHorizontal size={12} />
              </button>
              {showOverflowMenu && (
                <div className="story-overflow__menu">
                  <button className="story-overflow__item" onClick={() => { setShowImportHistory(prev => !prev); setShowOverflowMenu(false); }}>
                    <Clock size={14} /> Import History
                  </button>
                  <button className="story-overflow__item danger" onClick={() => { setShowDeleteConfirm(true); setShowOverflowMenu(false); }}>
                    <Trash2 size={14} /> Delete Filing
                  </button>
                </div>
              )}
            </div>
            {/* Task 10.1: ProgressRing replaces text counter */}
            <ProgressRing
              percentage={progress.percentage}
              color={progress.color}
              sections={progress.sections}
              onClickNext={handleProgressClick}
            />
          </div>

        </nav>

        {/* RIGHT: Editor Panel — only scrollable area */}
        <main className="story-editor">
          {isSubmitted && (
            <div style={{ padding: '10px 14px', marginBottom: 16, background: 'var(--color-info-bg)', border: '1px solid var(--color-info-border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
              <CheckCircle size={14} style={{ color: 'var(--color-info)', flexShrink: 0 }} />
              This filing has been submitted and is read-only. You can view details and download JSON/PDF.
            </div>
          )}
          {selected ? (
            <div style={isSubmitted ? { pointerEvents: 'none', opacity: 0.7 } : {}}>
              <ErrorBoundary name={selected}>{renderEditor(selected)}</ErrorBoundary>
              {renderDocInlineBlock(selected)}
            </div>
          ) : (
            <div className="story-editor__empty">
              {isSubmitted ? 'Select a section to view details' : 'Select a section from the story to start editing'}
            </div>
          )}
        </main>

        {/* RIGHT: Insights Panel — tax cockpit */}
        <aside className="story-insights">
          {/* Tax Computation */}
          <div className="insight-card">
            <div className="insight-card__title">Tax Summary</div>
            <div className="insight-regime">
              {['old', 'new'].map((r) => (
                <button key={r} className={`insight-regime__btn ${selectedRegime === r ? 'insight-regime__btn--active' : ''}`} onClick={() => handleRegimeSwitch(r)}>
                  {r === 'old' ? 'Old' : 'New'}
                </button>
              ))}
            </div>
            {bestRegime ? (
              <>
                <div className="insight-card__row"><span className="insight-card__label">Gross Income</span><span className="insight-card__value">{fmt(bestRegime.grossTotalIncome)}</span></div>
                <div className="insight-card__row"><span className="insight-card__label">Deductions</span><span className="insight-card__value">{fmt(bestRegime.deductions)}</span></div>
                <div className="insight-card__row"><span className="insight-card__label">Taxable</span><span className="insight-card__value" style={{ fontWeight: 700 }}>{fmt(bestRegime.taxableIncome)}</span></div>
                <hr className="insight-card__divider" />
                <div className="insight-card__row"><span className="insight-card__label">Tax</span><span className="insight-card__value">{fmt(bestRegime.totalTax)}</span></div>
                <div className="insight-card__row"><span className="insight-card__label">TDS</span><span className="insight-card__value">{fmt(bestRegime.tdsCredit)}</span></div>
                <hr className="insight-card__divider" />
                <div className={`insight-card__result ${isRefund ? 'insight-card__result--refund' : 'insight-card__result--payable'}`}>
                  {isRefund ? 'Refund' : 'Payable'}: {fmt(Math.abs(bestRegime.netPayable))}
                </div>
                {comp?.savings > 0 && (
                  <div style={{ fontSize: 11, textAlign: 'center', color: 'var(--color-success)', fontWeight: 600, marginTop: 2 }}>
                    Save {fmt(comp.savings)} with {comp.recommended === 'old' ? 'Old' : 'New'} Regime
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>Fill data to see computation</div>
            )}
          </div>

          {/* Readiness */}
          <div className="insight-card">
            <div className="insight-card__title">Filing Readiness</div>
            <div className="insight-readiness">
              {cardSections.map((s) => {
                const done = isSectionComplete(s.id, payload, comp);
                return (
                  <div key={s.id} className="insight-readiness__item" onClick={() => setSelected(s.id)} style={{ cursor: 'pointer' }}>
                    <span className={`insight-readiness__dot insight-readiness__dot--${done ? 'done' : 'pending'}`} />
                    <span style={selected === s.id ? { fontWeight: 600, color: 'var(--text-primary)' } : undefined}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tax Whispers */}
          {whispers.length > 0 && (
            <div className="insight-card">
              <div className="insight-card__title">Tax Tips</div>
              {whispers.slice(0, 3).map((w, i) => (
                <div key={i} className="insight-whisper" style={{ marginBottom: i < 2 ? 4 : 0 }}>{w.message || w}</div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="insight-actions">
            <button className="insight-actions__btn" onClick={downloadJSON}>Download JSON</button>
            <button className="insight-actions__btn" onClick={downloadPDF}>Download PDF</button>
            {!isSubmitted && <button className="insight-actions__btn insight-actions__btn--primary" onClick={handleSubmit}>Submit Filing</button>}
          </div>
        </aside>

      </div>{/* end story-panels */}

      {/* ── Mobile Bottom Bar — visible on mobile ── */}
      {bestRegime && (
        <div className="story-mobile-bar">
          <div>
            <div className={`story-mobile-bar__amount ${isRefund ? 'refund' : 'payable'}`}>
              {fmt(Math.abs(bestRegime.netPayable))}
            </div>
            <div className="story-mobile-bar__label">
              {isRefund ? 'Refund Due' : 'Tax Payable'}
            </div>
          </div>
          <div className="story-mobile-bar__regime">
            {['old', 'new'].map(r => (
              <button key={r} className={`story-regime-btn ${selectedRegime === r ? 'active' : ''}`}
                onClick={() => handleRegimeSwitch(r)}>
                {r === 'old' ? 'Old' : 'New'}
              </button>
            ))}
          </div>
          <button className="story-mobile-bar__submit" onClick={handleSubmit}>
            <Send size={13} /> Submit
          </button>
        </div>
      )}

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
              <button className="ff-btn ff-btn-outline" onClick={() => setShowRegimeConfirm(null)}>Cancel</button>
              <button className="ff-btn ff-btn-primary" onClick={confirmRegimeSwitch}>Switch Anyway</button>
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
      <div className="ff-row"><span className="ff-row-label">Taxable</span><span className="ff-row-value">{fmt(regime.taxableIncome)}</span></div>
      <div className="ff-row"><span className="ff-row-label">Deductions</span><span className="ff-row-value green">{fmt(regime.deductions)}</span></div>
      <div className="ff-row"><span className="ff-row-label">Tax</span><span className="ff-row-value bold">{fmt(regime.totalTax)}</span></div>
      {n(tds?.total) > 0 && <div className="ff-row"><span className="ff-row-label">After TDS</span><span className={`ff-row-value bold ${net <= 0 ? 'green' : 'red'}`}>{net <= 0 ? 'Refund ' : ''}{fmt(Math.abs(net))}</span></div>}
    </div>
  );
}

function SRow({ label, value, bold, green, color, onClick }) {
  const valCls = `ff-row-value${bold ? ' bold' : ''}${green ? ' green' : ''}${n(value) < 0 ? ' green' : ''}`;
  return (
    <div className="ff-row" style={onClick ? { cursor: 'pointer' } : {}} onClick={onClick}>
      <span className="ff-row-label">{label}</span>
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
