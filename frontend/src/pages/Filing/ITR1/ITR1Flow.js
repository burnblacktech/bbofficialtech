/**
 * Unified ITR Filing — Game HUD Layout
 * - Active sources: colored, prominent, with totals
 * - Inactive sources: greyed out, dimmed
 * - ITR type toggle in panel
 * - Delete filing option
 * - Proper ITR routing based on selected sources
 */

import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase, Home, TrendingUp, Building2, DollarSign, Globe,
  Plus, X, Loader2, Download, Send, CheckCircle, ChevronRight,
  ChevronDown, ArrowLeft, CreditCard, Trash2, Upload, AlertTriangle,
  User,
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import useUnsavedWarning from '../../../hooks/useUnsavedWarning';
import { validateBankAccount } from '../../../utils/itrValidation';
import toast from 'react-hot-toast';
import P from '../../../styles/palette';
import './itr-hud.css';

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

const n = (v) => Number(v) || 0;
const fmt = (v) => `\u20B9${Math.abs(n(v)).toLocaleString('en-IN')}`;

const SOURCES = [
  { id: 'salary', icon: Briefcase, label: 'Salary', color: '#059669', bg: '#f0fdf4', editor: SalaryEditor },
  { id: 'house_property', icon: Home, label: 'House Property', color: '#7c3aed', bg: '#f5f3ff', editor: HousePropertyEditor },
  { id: 'other', icon: DollarSign, label: 'Other Income', color: '#6b7280', bg: '#f9fafb', editor: OtherIncomeEditor },
  { id: 'capital_gains', icon: TrendingUp, label: 'Capital Gains', color: '#2563eb', bg: '#eff6ff', editor: CapitalGainsEditor },
  { id: 'business', icon: Building2, label: 'Business', color: '#d97706', bg: '#fffbeb', editor: BusinessEditor },
  { id: 'foreign', icon: Globe, label: 'Foreign Income', color: '#0891b2', bg: '#f0f9ff', editor: ForeignIncomeEditor },
];

// ITR type based on active sources
function getITRType(active, urlPath) {
  if (urlPath?.includes('/itr4')) return 'ITR-4';
  if (urlPath?.includes('/itr3')) return 'ITR-3';
  if (urlPath?.includes('/itr2')) return 'ITR-2';
  if (active.includes('business')) return 'ITR-3';
  if (active.includes('capital_gains') || active.includes('foreign')) return 'ITR-2';
  return 'ITR-1';
}

const ITR_NAMES = { 'ITR-1': 'Sahaj', 'ITR-2': 'Capital Gains', 'ITR-3': 'Business', 'ITR-4': 'Sugam' };
const ITR_COLORS = { 'ITR-1': '#059669', 'ITR-2': '#2563eb', 'ITR-3': '#d97706', 'ITR-4': '#7c3aed' };
const EP_MAP = { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3', 'ITR-4': 'itr4' };

// Map source IDs to relevant import document types
// eslint-disable-next-line camelcase
const SOURCE_IMPORTS = {
  salary: [{ type: 'form16', label: 'Form 16', color: '#059669' }],
  other: [{ type: 'form16a', label: 'Form 16A', color: '#0891b2' }, { type: '26as', label: '26AS', color: '#2563eb' }, { type: 'ais', label: 'AIS', color: '#7c3aed' }],
  'capital_gains': [{ type: 'form16b', label: 'Form 16B', color: '#d97706' }, { type: 'ais', label: 'AIS', color: '#7c3aed' }],
  'house_property': [{ type: 'form16c', label: 'Form 16C', color: '#6b7280' }, { type: '26as', label: '26AS', color: '#2563eb' }],
  deductions: [{ type: 'form16', label: 'Form 16', color: '#059669' }],
};

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

// Get the next incomplete section in filing order
/* eslint-disable camelcase */
function getNextSection(currentId, activeSources, payload, comp) {
  const order = ['personalInfo', ...activeSources, 'deductions', 'bank'];
  const idx = order.indexOf(currentId);
  if (idx === -1 || idx >= order.length - 1) return null;
  const next = order[idx + 1];
  const labels = { personalInfo: 'Personal Info', salary: 'Salary', house_property: 'House Property', other: 'Other Income', capital_gains: 'Capital Gains', business: 'Business', foreign: 'Foreign Income', deductions: 'Deductions', bank: 'Bank & Submit' };
  return { id: next, label: labels[next] || next };
}
/* eslint-enable camelcase */

export default function ITR1Flow() {
  const { filingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const { user, profile } = useAuth();

  const { data: filing, isLoading } = useQuery({
    queryKey: ['filing', filingId],
    queryFn: async () => (await api.get(`/filings/${filingId}`)).data.data,
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
  const [importPreselect, setImportPreselect] = useState(null); // pre-select doc type when opening from context

  // Global dirty tracking — editors auto-save on unmount, but we still need
  // beforeunload for tab close and route blocker for in-app navigation
  const [globalDirty, setGlobalDirty] = useState(false);
  useUnsavedWarning(globalDirty);

  // Init from filing
  useEffect(() => {
    if (!filing) return;
    const p = filing.jsonPayload || {};
    const s = new Set();
    if (p.income?.salary?.employers?.length) s.add('salary');
    if (p.income?.houseProperty?.type && !['NONE', 'none'].includes(p.income.houseProperty.type)) s.add('house_property');
    if (p.income?.capitalGains?.transactions?.length) s.add('capital_gains');
    if (p.income?.business?.businesses?.length || p.income?.presumptive?.entries?.length) s.add('business');
    if (n(p.income?.otherSources?.savingsInterest) + n(p.income?.otherSources?.fdInterest) + n(p.income?.otherSources?.dividendIncome) + n(p.income?.otherSources?.familyPension) + n(p.income?.otherSources?.otherIncome) + n(p.income?.agriculturalIncome) > 0) s.add('other');
    if (p.income?.foreignIncome?.incomes?.length) s.add('foreign');
    if (s.size === 0) s.add('salary');
    setActive([...s]);
    const bd = p.bankDetails || {};
    if (bd.bankName || bd.accountNumber) setBankData({ bankName: bd.bankName || '', accountNumber: bd.accountNumber || '', ifsc: bd.ifsc || '', accountType: bd.accountType || 'SAVINGS' });
    setSelectedRegime(filing.selectedRegime || p.selectedRegime || 'new');
  }, [filing]);

  const saveMut = useMutation({
    mutationFn: async (updates) => {
      const body = { jsonPayload: deepMerge(filing?.jsonPayload || {}, updates) };
      if (updates.selectedRegime) { body.selectedRegime = updates.selectedRegime; setSelectedRegime(updates.selectedRegime); }
      await api.put(`/filings/${filingId}`, body);
      // Recompute immediately after save (sequential, not parallel)
      try {
        const itr = getITRType(active, location.pathname);
        const r = await api.post(`/filings/${filingId}/${EP_MAP[itr] || 'itr1'}/compute`);
        setComp(r.data.data);
      } catch { /* computation failure is non-blocking */ }
    },
    onMutate: () => { setGlobalDirty(true); },
    onSuccess: () => { setGlobalDirty(false); qc.invalidateQueries({ queryKey: ['filing', filingId] }); },
    onError: (e) => { setGlobalDirty(false); toast.error(e.response?.data?.error || 'Save failed'); },
  });

  const recompute = useCallback(async () => {
    try {
      const itr = getITRType(active, location.pathname);
      const r = await api.post(`/filings/${filingId}/${EP_MAP[itr] || 'itr1'}/compute`);
      setComp(r.data.data);
    } catch { /* silent */ }
  }, [filingId, active]); // eslint-disable-line

  useEffect(() => { if (filing) recompute(); }, [filing]); // eslint-disable-line

  // When active sources change, navigate to the correct ITR route
  useEffect(() => {
    if (!filing) return;
    const itr = getITRType(active, location.pathname);
    const ep = EP_MAP[itr] || 'itr1';
    const currentEp = location.pathname.split('/').pop();
    if (currentEp !== ep) {
      navigate(`/filing/${filingId}/${ep}`, { replace: true });
    }
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

  // Scroll to the selected accordion card when selection changes
  useEffect(() => {
    if (!selected) return;
    const timer = setTimeout(() => {
      const el = document.querySelector('.hud-accordion-card.open');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [selected]);

  const toggleSource = (id) => {
    setActive(prev => {
      const next = prev.includes(id) ? (prev.length > 1 ? prev.filter(s => s !== id) : prev) : [...prev, id];
      // Clear selected if we just removed the currently selected source
      if (prev.includes(id) && selected === id) {
        setSelected(null);
      }
      return next;
    });
    if (!active.includes(id)) setSelected(id);
  };

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
      const itr = getITRType(active, location.pathname);
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

  if (isLoading) return <div className="hud-loading"><Loader2 size={28} className="animate-spin" /></div>;

  const payload = filing?.jsonPayload || {};
  const itrType = getITRType(active, location.pathname);
  const income = comp?.income;
  const rec = selectedRegime;
  const bestRegime = comp?.[rec === 'old' ? 'oldRegime' : 'newRegime'];
  const altRegime = comp?.[rec === 'old' ? 'newRegime' : 'oldRegime'];
  const tds = comp?.tds;

  const getTotalForSource = (id) => {
    if (!income) return null;
    /* eslint-disable camelcase */
    const map = { salary: income.salary?.netTaxable, house_property: income.houseProperty?.netIncome, other: income.otherSources?.total, capital_gains: income.capitalGains?.totalTaxable, business: income.business?.netProfit || income.presumptive?.totalIncome, foreign: income.foreignIncome?.totalIncome };
    /* eslint-enable camelcase */
    return map[id] ?? null;
  };

  const itrColor = ITR_COLORS[itrType] || P.brand;

  const openImport = (docType) => {
    setImportPreselect(docType || null);
    setShowImportModal(true);
  };

  return (
    <div className="hud">
      {/* ── Left Panel ── */}
      <aside className="hud-panel">
        <button className="hud-back" onClick={() => navigate('/dashboard')}><ArrowLeft size={14} /> Dashboard</button>

        {/* Filing Info */}
        <div className="hud-filing-info">
          <div className="hud-filing-name">{user?.fullName || 'Taxpayer'}</div>
          <div className="hud-filing-detail">PAN: {filing?.taxpayerPan || '---'} · AY {filing?.assessmentYear || '---'}</div>
        </div>

        {/* ITR Badge — colored by type */}
        <div className="hud-itr-badge" style={{ background: `${itrColor}12`, borderColor: `${itrColor}30` }}>
          <span className="hud-itr-type" style={{ color: itrColor }}>{itrType}</span>
          <span className="hud-itr-name" style={{ color: itrColor }}>{ITR_NAMES[itrType]}</span>
          {filing?.filingType === 'revised' && (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '1px 6px', borderRadius: 8, marginLeft: 4 }}>REVISED</span>
          )}
        </div>
        {filing?.filingType === 'revised' && filing?.originalAckNumber && (
          <div style={{ fontSize: 11, color: P.textMuted, padding: '0 12px 4px', marginTop: -4 }}>
            Original Ack: {filing.originalAckNumber}
          </div>
        )}

        {/* ── The Big Number — Refund/Payable Result ── */}
        {bestRegime && tds ? (
          <div style={{
            background: bestRegime.netPayable <= 0 ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${bestRegime.netPayable <= 0 ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: 10, padding: '12px 14px', marginBottom: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: bestRegime.netPayable <= 0 ? P.success : P.error }}>
                  {fmt(Math.abs(bestRegime.netPayable))}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: bestRegime.netPayable <= 0 ? P.success : P.error, marginTop: 1 }}>
                  {bestRegime.netPayable <= 0 ? 'Refund Due' : 'Tax Payable'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: P.textLight }}>Tax {fmt(bestRegime.totalTax)}</div>
                {n(tds.total) > 0 && <div style={{ fontSize: 10, color: P.success }}>TDS -{fmt(tds.total)}</div>}
              </div>
            </div>
            {/* Regime toggle inside the result card */}
            <div className="hud-regime-toggle" style={{ marginTop: 10, marginBottom: 0 }}>
              {['old', 'new'].map(r => (
                <button key={r} className={`hud-regime-btn ${selectedRegime === r ? 'active' : ''}`}
                  onClick={() => { setSelectedRegime(r); saveMut.mutate({ selectedRegime: r }); }}>
                  {r === 'old' ? 'Old Regime' : 'New Regime'}
                </button>
              ))}
            </div>
            {comp?.savings > 0 && comp.recommended !== selectedRegime && (
              <div style={{ fontSize: 10, color: P.warning, marginTop: 6, textAlign: 'center' }}>
                Tip: {comp.recommended === 'old' ? 'Old' : 'New'} regime saves {fmt(comp.savings)}
              </div>
            )}
            {income && (itrType === 'ITR-1' || itrType === 'ITR-4') && income.grossTotal > 5000000 && (
              <div style={{ marginTop: 8, padding: '5px 8px', background: '#fff', borderRadius: 6, border: '1px solid #fecaca', display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                <AlertTriangle size={12} style={{ color: P.error, flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 10, lineHeight: 1.3, color: P.errorDark }}>
                  Income {fmt(income.grossTotal)} exceeds ₹50L limit for {itrType}
                  {itrType === 'ITR-1' && (
                    <button style={{ display: 'block', marginTop: 2, fontSize: 10, fontWeight: 600, color: P.brand, background: 'none', border: 'none', cursor: 'pointer', padding: 0, minHeight: 'auto' }}
                      onClick={(e) => { e.stopPropagation(); toggleSource('capital_gains'); }}>
                      Switch to ITR-2 →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* No computation yet — show placeholder */
          <div style={{ background: P.bgMuted, borderRadius: 10, padding: '14px', marginBottom: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: P.textMuted }}>Add income to see your tax</div>
            <div className="hud-regime-toggle" style={{ marginTop: 8, marginBottom: 0 }}>
              {['old', 'new'].map(r => (
                <button key={r} className={`hud-regime-btn ${selectedRegime === r ? 'active' : ''}`}
                  onClick={() => { setSelectedRegime(r); saveMut.mutate({ selectedRegime: r }); }}>
                  {r === 'old' ? 'Old Regime' : 'New Regime'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Income Sources (no section header — self-evident) ── */}
        {SOURCES.map(src => {
          const isActive = active.includes(src.id);
          const isSel = selected === src.id;
          const Icon = src.icon;
          const total = getTotalForSource(src.id);
          return (
            <div key={src.id}
              className={`hud-source ${isActive ? 'active' : 'inactive'} ${isSel ? 'selected' : ''}`}
              style={isActive ? { background: isSel ? src.bg : undefined } : {}}
              onClick={() => isActive ? setSelected(src.id) : toggleSource(src.id)}>
              <div className="hud-source-left">
                <div className="hud-source-icon" style={{ background: isActive ? src.bg : P.bgMuted }}>
                  <Icon size={14} style={{ color: isActive ? src.color : P.textLight }} />
                </div>
                <span className="hud-source-label" style={{ color: isActive ? P.textPrimary : P.textLight, fontWeight: isActive ? 600 : 400 }}>{src.label}</span>
              </div>
              <div className="hud-source-right">
                {isActive && total != null && <span className={`hud-source-total ${n(total) < 0 ? 'negative' : ''}`}>{fmt(total)}</span>}
                {isActive ? (
                  <button className="hud-source-toggle" onClick={e => { e.stopPropagation(); toggleSource(src.id); }} title="Remove"><X size={11} /></button>
                ) : (
                  <Plus size={13} style={{ color: P.textLight }} />
                )}
              </div>
            </div>
          );
        })}

        {/* Agricultural income — shown as exempt sub-line when present */}
        {n(comp?.agriculturalIncome) > 0 && active.includes('other') && (
          <div style={{ padding: '2px 10px 4px 46px', fontSize: 11, color: P.success, display: 'flex', justifyContent: 'space-between' }}>
            <span>Agri (exempt)</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(comp.agriculturalIncome)}</span>
          </div>
        )}

        {/* ── Tax Savings ── */}
        <div style={{ borderTop: `1px solid ${P.borderLight}`, margin: '6px 0 4px', padding: 0 }} />
        <div className={`hud-source active ${selected === 'deductions' ? 'selected' : ''}`} onClick={() => setSelected('deductions')}>
          <div className="hud-source-left">
            <div className="hud-source-icon" style={{ background: '#f0fdf4' }}><CheckCircle size={14} style={{ color: P.success }} /></div>
            <span className="hud-source-label" style={{ color: P.textPrimary, fontWeight: 600 }}>Deductions</span>
          </div>
          {bestRegime && n(bestRegime.deductions) > 0 && <span className="hud-source-total" style={{ color: P.success }}>{fmt(bestRegime.deductions)}</span>}
        </div>
        <div className={`hud-source active ${selected === 'bank' ? 'selected' : ''}`} onClick={() => setSelected('bank')}>
          <div className="hud-source-left">
            <div className="hud-source-icon" style={{ background: P.bgMuted }}><CreditCard size={14} style={{ color: P.textMuted }} /></div>
            <span className="hud-source-label" style={{ color: P.textPrimary, fontWeight: 600 }}>Bank & Submit</span>
          </div>
          <ChevronRight size={13} style={{ color: P.textLight }} />
        </div>

        {/* ── Compact Tax Computation (always visible, reference data) ── */}
        {bestRegime && (
          <div style={{ margin: '8px 0', padding: '10px 12px', background: P.bgMuted, borderRadius: 8, fontSize: 11, color: P.textMuted }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>Gross Income</span><span style={{ fontWeight: 600, color: P.textPrimary, fontVariantNumeric: 'tabular-nums' }}>{fmt(income?.grossTotal)}</span></div>
            {n(comp?.agriculturalIncome) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>Agri Income (exempt)</span><span style={{ fontWeight: 600, color: P.success, fontVariantNumeric: 'tabular-nums' }}>{fmt(comp.agriculturalIncome)}</span></div>
            )}
            {n(bestRegime.deductions) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>Deductions</span><span style={{ fontWeight: 600, color: P.success, fontVariantNumeric: 'tabular-nums' }}>-{fmt(bestRegime.deductions)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>Taxable</span><span style={{ fontWeight: 600, color: P.textPrimary, fontVariantNumeric: 'tabular-nums' }}>{fmt(bestRegime.taxableIncome)}</span></div>
            <div style={{ borderTop: `1px solid ${P.borderLight}`, margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>Tax on income</span><span style={{ fontWeight: 600, color: P.textPrimary, fontVariantNumeric: 'tabular-nums' }}>{fmt(bestRegime.taxOnIncome)}</span></div>
            {n(bestRegime.rebate) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>Rebate 87A</span><span style={{ fontWeight: 600, color: P.success, fontVariantNumeric: 'tabular-nums' }}>-{fmt(bestRegime.rebate)}</span></div>}
            {n(bestRegime.surcharge) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>Surcharge</span><span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(bestRegime.surcharge)}</span></div>}
            {n(bestRegime.cess) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>Cess (4%)</span><span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(bestRegime.cess)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>Total tax ({rec})</span><span style={{ fontWeight: 600, color: P.textPrimary, fontVariantNumeric: 'tabular-nums' }}>{fmt(bestRegime.totalTax)}</span></div>
            {tds && n(tds.total) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>TDS/Advance</span><span style={{ fontWeight: 600, color: P.success, fontVariantNumeric: 'tabular-nums' }}>-{fmt(tds.total)}</span></div>}
            {n(comp?.agriculturalIncome) > 5000 && bestRegime.agriIntegrationApplied && (
              <div style={{ fontSize: 10, color: P.warning, marginTop: 4, lineHeight: 1.3 }}>
                Agri income ({fmt(comp.agriculturalIncome)}) pushes other income into higher slabs via partial integration
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <button style={{ fontSize: 10, color: P.brand, background: 'none', border: 'none', cursor: 'pointer', padding: 0, minHeight: 'auto' }} onClick={() => setSelected(null)}>
                View full breakdown →
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="hud-actions">
          <button className="hud-btn-outline" onClick={() => openImport(null)}><Upload size={14} /> Import</button>
          <button className="hud-btn-outline" onClick={downloadJSON}><Download size={14} /> JSON</button>
          <button className="hud-btn-primary" onClick={() => setSelected('bank')}><Send size={14} /> Submit</button>
        </div>

        {/* Import History */}
        <ImportHistoryPanel filingId={filingId} />

        {/* Delete */}
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: P.textLight, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginTop: 4 }}>
            <Trash2 size={12} /> Delete filing
          </button>
        ) : (
          <div style={{ marginTop: 6, padding: 10, background: P.errorBg, borderRadius: 8, border: '1px solid #fecaca' }}>
            <div style={{ fontSize: 12, color: P.errorDark, marginBottom: 6 }}>Delete this filing?</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleDelete} style={{ flex: 1, padding: '5px 0', background: P.error, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Delete</button>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '5px 0', background: P.bgMuted, color: P.textSecondary, border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}
      </aside>

      {/* ── Center — Accordion of all active sections ── */}
      <main className="hud-editor">
        {/* Personal Info accordion card — always first */}
        {(() => {
          const piOpen = selected === 'personalInfo';
          const piData = payload?.personalInfo || {};
          const piCompletion = getCompletionInfo(piData);
          const piColor = '#6366f1';
          const piBg = '#eef2ff';
          return (
            <div className={`hud-accordion-card ${piOpen ? 'open' : ''}`} style={piOpen ? { borderColor: piColor, boxShadow: `0 0 0 2px ${piColor}12` } : {}}>
              <button className="hud-accordion-header" onClick={() => setSelected(piOpen ? null : 'personalInfo')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: piBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={13} style={{ color: piColor }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: P.textPrimary }}>Personal Info</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: piCompletion.complete ? P.success : P.warning }}>
                    {piCompletion.filled}/{piCompletion.total}
                  </span>
                  {piCompletion.complete
                    ? <CheckCircle size={14} style={{ color: P.success }} />
                    : <AlertTriangle size={14} style={{ color: P.warning }} />}
                  {piOpen ? <ChevronDown size={14} style={{ color: P.textLight }} /> : <ChevronRight size={14} style={{ color: P.textLight }} />}
                </div>
              </button>
              {piOpen && (
                <div className="hud-accordion-body">
                  <PersonalInfoEditor payload={payload} filing={filing}
                    onSave={(updates) => saveMut.mutateAsync(updates)} isSaving={saveMut.isPending}
                    computation={comp} itrType={itrType} user={user} userProfile={profile || null} />
                  {(() => { const nx = getNextSection('personalInfo', active, payload, comp); return nx ? (
                    <button className="ff-btn ff-btn-outline" onClick={() => setSelected(nx.id)} style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
                      Continue to {nx.label} →
                    </button>
                  ) : null; })()}
                </div>
              )}
            </div>
          );
        })()}

        {/* All active income sources as collapsible cards */}
        {SOURCES.filter(src => active.includes(src.id)).map(src => {
          const isOpen = selected === src.id;
          const Icon = src.icon;
          const total = getTotalForSource(src.id);
          const EditorComp = src.editor;
          const imports = SOURCE_IMPORTS[src.id] || [];
          const srcComplete = isSectionComplete(src.id, payload, comp);
          return (
            <div key={src.id} className={`hud-accordion-card ${isOpen ? 'open' : ''}`} style={isOpen ? { borderColor: src.color, boxShadow: `0 0 0 2px ${src.color}12` } : {}}>
              <button className="hud-accordion-header" onClick={() => setSelected(isOpen ? null : src.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: src.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={13} style={{ color: src.color }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: P.textPrimary }}>{src.label}</span>
                  {srcComplete && <CheckCircle size={12} style={{ color: P.success }} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {imports.length > 0 && (
                    <span style={{ display: 'flex', gap: 4 }}>
                      {imports.map(imp => (
                        <span key={imp.type} onClick={(e) => { e.stopPropagation(); openImport(imp.type); }}
                          style={{ fontSize: 10, fontWeight: 600, color: imp.color, background: `${imp.color}10`, border: `1px solid ${imp.color}30`, borderRadius: 10, padding: '2px 7px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Upload size={9} /> {imp.label}
                        </span>
                      ))}
                    </span>
                  )}
                  {total != null && <span style={{ fontSize: 12, fontWeight: 600, color: n(total) < 0 ? P.success : P.textSecondary, fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}</span>}
                  {isOpen ? <ChevronDown size={14} style={{ color: P.textLight }} /> : <ChevronRight size={14} style={{ color: P.textLight }} />}
                </div>
              </button>
              {isOpen && (
                <div className="hud-accordion-body">
                  <EditorComp payload={payload} filing={filing} selectedRegime={selectedRegime}
                    onSave={(updates) => saveMut.mutateAsync(updates)} isSaving={saveMut.isPending}
                    activeSources={active} computation={comp} itrType={itrType} />
                  {(() => { const nx = getNextSection(src.id, active, payload, comp); return nx ? (
                    <button className="ff-btn ff-btn-outline" onClick={() => setSelected(nx.id)} style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
                      Continue to {nx.label} →
                    </button>
                  ) : null; })()}
                </div>
              )}
            </div>
          );
        })}

        {/* Deductions card */}
        <div className={`hud-accordion-card ${selected === 'deductions' ? 'open' : ''}`} style={selected === 'deductions' ? { borderColor: P.success, boxShadow: '0 0 0 2px rgba(22,163,74,0.08)' } : {}}>
          <button className="hud-accordion-header" onClick={() => setSelected(selected === 'deductions' ? null : 'deductions')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={13} style={{ color: P.success }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: P.textPrimary }}>Deductions</span>
              {isSectionComplete('deductions', payload, comp) && <CheckCircle size={12} style={{ color: P.success }} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span onClick={(e) => { e.stopPropagation(); openImport('form16'); }}
                style={{ fontSize: 10, fontWeight: 600, color: '#059669', background: '#059669'+'10', border: '1px solid #059669'+'30', borderRadius: 10, padding: '2px 7px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Upload size={9} /> Form 16
              </span>
              {bestRegime && n(bestRegime.deductions) > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: P.success, fontVariantNumeric: 'tabular-nums' }}>{fmt(bestRegime.deductions)}</span>}
              {selected === 'deductions' ? <ChevronDown size={14} style={{ color: P.textLight }} /> : <ChevronRight size={14} style={{ color: P.textLight }} />}
            </div>
          </button>
          {selected === 'deductions' && (
            <div className="hud-accordion-body">
              <DeductionsEditor payload={payload} filing={filing} selectedRegime={selectedRegime}
                onSave={(updates) => saveMut.mutateAsync(updates)} isSaving={saveMut.isPending}
                activeSources={active} computation={comp} itrType={itrType} />
              <button className="ff-btn ff-btn-outline" onClick={() => setSelected('bank')} style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
                Continue to Bank & Submit →
              </button>
            </div>
          )}
        </div>

        {/* Bank & Submit card */}
        <div className={`hud-accordion-card ${selected === 'bank' ? 'open' : ''}`} style={selected === 'bank' ? { borderColor: P.brand, boxShadow: '0 0 0 2px rgba(37,99,235,0.08)' } : {}}>
          <button className="hud-accordion-header" onClick={() => setSelected(selected === 'bank' ? null : 'bank')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: P.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={13} style={{ color: P.textMuted }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: P.textPrimary }}>Bank & Submit</span>
              {isSectionComplete('bank', payload, comp) && <CheckCircle size={12} style={{ color: P.success }} />}
            </div>
            {selected === 'bank' ? <ChevronDown size={14} style={{ color: P.textLight }} /> : <ChevronRight size={14} style={{ color: P.textLight }} />}
          </button>
          {selected === 'bank' && (
            <div className="hud-accordion-body">
              <BankEditor payload={payload} filing={filing} selectedRegime={selectedRegime}
                onSave={(updates) => saveMut.mutateAsync(updates)} isSaving={saveMut.isPending}
                activeSources={active} computation={comp} onSubmit={handleSubmit}
                isSubmitting={isSubmitting} bankData={bankData} setBankData={setBankData}
                bankErrors={bankErrors} onDownloadJSON={downloadJSON} itrType={itrType} />
            </div>
          )}
        </div>

        {/* Summary view when nothing is selected */}
        {!selected && (
          <SummaryView comp={comp} itrType={itrType} filing={filing} rec={rec} bestRegime={bestRegime} altRegime={altRegime} tds={tds} onEdit={setSelected} />
        )}
      </main>

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
      {/* ── Mobile Sticky Tax Bar ── */}
      {bestRegime && tds && (
        <div className="hud-mobile-tax-bar">
          <div>
            <div className="tax-label">{bestRegime.netPayable <= 0 ? 'Refund Due' : 'Tax Payable'}</div>
            <div className={`tax-amount ${bestRegime.netPayable <= 0 ? 'refund' : 'payable'}`}>
              {fmt(Math.abs(bestRegime.netPayable))}
            </div>
          </div>
          <button className="hud-btn-primary" style={{ padding: '8px 16px', fontSize: 12 }} onClick={() => setSelected('bank')}>
            <Send size={13} /> Submit
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Summary View — Computation Story ── */
function SummaryView({ comp, itrType, filing, rec, bestRegime, altRegime, tds, onEdit }) {
  const income = comp?.income;
  if (!comp) return (
    <div>
      <h2 className="step-title">Filing Summary</h2>
      <p className="step-desc">Add income sources from the left panel to see your tax computation.</p>
      <div className="step-card info" style={{ textAlign: 'center', padding: 32 }}>
        <Briefcase size={32} color={P.brand} style={{ margin: '0 auto 8px' }} />
        <div style={{ fontSize: 14, color: P.textMuted }}>Click an income source on the left to start</div>
      </div>
    </div>
  );

  const agri = n(comp?.agriculturalIncome);

  return (
    <div>
      <h2 className="step-title">Tax Computation — {itrType}</h2>
      <p className="step-desc">AY {filing?.assessmentYear} · PAN {filing?.taxpayerPan} · {rec === 'old' ? 'Old' : 'New'} Regime</p>

      {/* ── Step 1: Your Income ── */}
      <div className="step-card">
        <div className="ff-section-title">1. Your Income</div>
        {income?.salary?.netTaxable > 0 && (
          <div className="ff-row" style={{ cursor: 'pointer' }} onClick={() => onEdit('salary')}>
            <span className="ff-row-label">Salary (after std deduction ₹75,000)</span>
            <span className="ff-row-value">{fmt(income.salary.netTaxable)}</span>
          </div>
        )}
        {income?.salary?.netTaxable > 0 && income.salary.exemptAllowances > 0 && (
          <div style={{ fontSize: 11, color: P.textLight, padding: '0 0 2px 12px' }}>
            Gross {fmt(income.salary.grossSalary)} − Exempt {fmt(income.salary.exemptAllowances)} − Std ded ₹75,000 − PT {fmt(income.salary.professionalTax)}
          </div>
        )}
        {income?.houseProperty?.netIncome != null && income.houseProperty.netIncome !== 0 && (
          <SRow label={`House Property (${income.houseProperty.type === 'SELF_OCCUPIED' ? 'self-occupied' : 'let-out'})`} value={income.houseProperty.netIncome} onClick={() => onEdit('house_property')} />
        )}
        {income?.otherSources?.total > 0 && <SRow label="Other Sources" value={income.otherSources.total} onClick={() => onEdit('other')} />}
        {income?.capitalGains?.totalTaxable > 0 && <SRow label="Capital Gains" value={income.capitalGains.totalTaxable} onClick={() => onEdit('capital_gains')} />}
        {(income?.business?.netProfit > 0 || income?.presumptive?.totalIncome > 0) && <SRow label="Business / Profession" value={income.business?.netProfit || income.presumptive?.totalIncome} onClick={() => onEdit('business')} />}
        <div className="ff-divider" />
        <SRow label="Gross Total Income" value={income?.grossTotal} bold />
        {agri > 0 && (
          <div className="ff-row" style={{ marginTop: 2 }}>
            <span className="ff-row-label" style={{ color: P.success }}>Agricultural Income (exempt)</span>
            <span className="ff-row-value" style={{ color: P.success }}>{fmt(agri)}</span>
          </div>
        )}
      </div>

      {/* ── Step 2: Deductions ── */}
      {bestRegime && n(bestRegime.deductions) > 0 && (
        <div className="step-card" style={{ cursor: 'pointer' }} onClick={() => onEdit('deductions')}>
          <div className="ff-section-title">2. Deductions (Chapter VI-A)</div>
          {bestRegime.deductionBreakdown && Object.entries(bestRegime.deductionBreakdown).filter(([, v]) => n(v) > 0).map(([k, v]) => {
            const labels = { section80C: '80C (PPF, ELSS, LIC...)', section80CCD1B: '80CCD(1B) NPS', section80CCD2: '80CCD(2) Employer NPS', section80D: '80D Health Insurance', section80E: '80E Education Loan', section80G: '80G Donations', section80TTA: '80TTA Savings Interest', section80TTB: '80TTB Senior Savings', section80GG: '80GG Rent', section80U: '80U Disability' };
            return <SRow key={k} label={labels[k] || k} value={v} green />;
          })}
          <div className="ff-divider" />
          <SRow label="Total Deductions" value={bestRegime.deductions} bold green />
        </div>
      )}

      {/* ── Step 3: Taxable Income ── */}
      <div className="step-card">
        <div className="ff-section-title">3. Taxable Income</div>
        <SRow label="Gross Total Income" value={income?.grossTotal} />
        {n(bestRegime?.deductions) > 0 && <SRow label="Less: Deductions" value={-bestRegime.deductions} green />}
        <div className="ff-divider" />
        <SRow label="Total Taxable Income" value={bestRegime?.taxableIncome} bold />
      </div>

      {/* ── Step 4: Tax Calculation ── */}
      {bestRegime?.slabBreakdown?.length > 0 && (
        <div className="step-card">
          <div className="ff-section-title">4. Tax Calculation ({rec === 'old' ? 'Old' : 'New'} Regime)</div>
          {bestRegime.slabBreakdown.filter(s => s.tax > 0).map((s, i) => (
            <div key={i} className="ff-row">
              <span className="ff-row-label">{fmt(s.min)} – {s.max === Infinity ? 'Above' : fmt(s.max)} @ {s.rate}%</span>
              <span className="ff-row-value">{fmt(s.tax)}</span>
            </div>
          ))}
          {agri > 5000 && bestRegime.agriIntegrationApplied && (
            <div style={{ fontSize: 11, color: P.warning, padding: '4px 0', lineHeight: 1.3 }}>
              Tax computed using partial integration method — agri income ({fmt(agri)}) pushes other income into higher slabs
            </div>
          )}
          <div className="ff-divider" />
          <SRow label="Tax on Income" value={bestRegime.taxOnIncome} />
          {n(bestRegime.rebate) > 0 && <SRow label="Less: Rebate u/s 87A" value={-bestRegime.rebate} green />}
          {n(bestRegime.surcharge) > 0 && <SRow label="Surcharge" value={bestRegime.surcharge} />}
          <SRow label="Health & Education Cess (4%)" value={bestRegime.cess} />
          <div className="ff-divider" />
          <SRow label="Total Tax Liability" value={bestRegime.totalTax} bold />
        </div>
      )}

      {/* ── Step 5: Tax Paid ── */}
      {tds && n(tds.total) > 0 && (
        <div className="step-card">
          <div className="ff-section-title">5. Tax Already Paid</div>
          {n(tds.fromSalary) > 0 && <SRow label="TDS on Salary" value={tds.fromSalary} green />}
          {n(tds.fromNonSalary) > 0 && <SRow label="TDS on Other Income" value={tds.fromNonSalary} green />}
          {n(tds.fromCapitalGains) > 0 && <SRow label="TDS on Capital Gains" value={tds.fromCapitalGains} green />}
          {n(tds.advanceTax) > 0 && <SRow label="Advance Tax" value={tds.advanceTax} green />}
          {n(tds.selfAssessment) > 0 && <SRow label="Self-Assessment Tax" value={tds.selfAssessment} green />}
          <div className="ff-divider" />
          <SRow label="Total Tax Paid" value={tds.total} bold green />
        </div>
      )}

      {/* ── Step 6: Result ── */}
      <div className="step-card" style={{ background: bestRegime?.netPayable <= 0 ? '#f0fdf4' : '#fef2f2', borderColor: bestRegime?.netPayable <= 0 ? '#bbf7d0' : '#fecaca' }}>
        <div className="ff-section-title">6. {bestRegime?.netPayable <= 0 ? 'Refund Due' : 'Balance Tax Payable'}</div>
        <SRow label="Total Tax Liability" value={bestRegime?.totalTax} />
        {tds && n(tds.total) > 0 && <SRow label="Less: Tax Paid" value={-tds.total} green />}
        <div className="ff-divider" />
        <SRow label={bestRegime?.netPayable <= 0 ? 'Refund Due to You' : 'Tax You Need to Pay'} value={Math.abs(bestRegime?.netPayable || 0)} bold color={bestRegime?.netPayable <= 0 ? P.success : P.error} />
      </div>

      {/* ── Regime Comparison ── */}
      {bestRegime && altRegime && (
        <div className="step-card">
          <div className="ff-section-title">Regime Comparison</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <RegimeCard regime={bestRegime} label={rec === 'old' ? 'Old Regime' : 'New Regime'} recommended tds={tds} />
            <RegimeCard regime={altRegime} label={rec === 'old' ? 'New Regime' : 'Old Regime'} tds={tds} />
          </div>
          {comp?.savings > 0 && <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: P.success, fontWeight: 600 }}>{rec === 'old' ? 'Old' : 'New'} regime saves {fmt(comp.savings)}</div>}
        </div>
      )}

      {/* ── CA Insights ── */}
      {bestRegime && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {/* Refund explanation */}
          {bestRegime.netPayable < 0 && n(tds?.fromSalary) > 0 && (
            <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, color: '#166534', lineHeight: 1.5 }}>
              💡 Your employer deducted {fmt(tds.fromSalary)} as TDS, which is more than your actual tax liability. The excess {fmt(Math.abs(bestRegime.netPayable))} will be refunded after filing.
            </div>
          )}
          {/* Zero tax explanation */}
          {bestRegime.totalTax === 0 && n(income?.grossTotal) > 0 && (
            <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, color: '#166534', lineHeight: 1.5 }}>
              💡 Your taxable income is within the rebate limit — no tax to pay. {n(bestRegime.rebate) > 0 ? `Rebate of ${fmt(bestRegime.rebate)} under Section 87A covers your entire tax.` : ''}
            </div>
          )}
          {/* Regime suggestion */}
          {comp?.savings > 0 && comp.recommended !== rec && (
            <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
              💡 Switching to {comp.recommended === 'old' ? 'Old' : 'New'} Regime would save you {fmt(comp.savings)}. {comp.recommended === 'old' ? 'Your deductions make the old regime more beneficial.' : 'The lower slab rates outweigh your deductions.'}
            </div>
          )}
          {/* New regime trade-off */}
          {rec === 'new' && n(altRegime?.deductions) > 0 && (
            <div style={{ padding: '10px 14px', background: P.infoBg, border: `1px solid ${P.infoBorder}`, borderRadius: 8, fontSize: 12, color: '#1e40af', lineHeight: 1.5 }}>
              💡 Under New Regime, you are not claiming {fmt(altRegime.deductions)} in deductions (80C, 80D, etc.). The lower slab rates compensate{comp?.recommended === 'new' ? ' — and save you more.' : ', but Old Regime may save more.'}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="ff-btn ff-btn-outline" onClick={() => onEdit('deductions')}>Edit Deductions</button>
        <button className="ff-btn ff-btn-primary" onClick={() => onEdit('bank')}>Review & Submit</button>
      </div>
    </div>
  );
}

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
