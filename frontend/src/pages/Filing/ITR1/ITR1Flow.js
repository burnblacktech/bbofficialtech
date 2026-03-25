/**
 * Unified ITR Filing — Game HUD Layout
 * Left panel: income sources + tax summary + actions
 * Center: active section editor
 * ITR type auto-adapts based on selected sources
 */

import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase, Home, TrendingUp, Building2, DollarSign, Globe,
  Plus, X, Loader2, Download, Send, CheckCircle, ChevronRight,
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { validateBankAccount } from '../../../utils/itrValidation';
import toast from 'react-hot-toast';
import './itr-hud.css';

// Steps — lazy inline components for each section
import SalaryEditor from './editors/SalaryEditor';
import HousePropertyEditor from './editors/HousePropertyEditor';
import OtherIncomeEditor from './editors/OtherIncomeEditor';
import CapitalGainsEditor from './editors/CapitalGainsEditor';
import BusinessEditor from './editors/BusinessEditor';
import ForeignIncomeEditor from './editors/ForeignIncomeEditor';
import DeductionsEditor from './editors/DeductionsEditor';
import BankEditor from './editors/BankEditor';

const n = (v) => Number(v) || 0;
const fmt = (v) => `₹${Math.abs(n(v)).toLocaleString('en-IN')}`;

const SOURCES = [
  { id: 'salary', icon: Briefcase, label: 'Salary', color: '#059669', editor: SalaryEditor },
  { id: 'house_property', icon: Home, label: 'House Property', color: '#7c3aed', editor: HousePropertyEditor },
  { id: 'other', icon: DollarSign, label: 'Other Income', color: '#6b7280', editor: OtherIncomeEditor },
  { id: 'capital_gains', icon: TrendingUp, label: 'Capital Gains', color: '#2563eb', editor: CapitalGainsEditor },
  { id: 'business', icon: Building2, label: 'Business', color: '#d97706', editor: BusinessEditor },
  { id: 'foreign', icon: Globe, label: 'Foreign Income', color: '#0891b2', editor: ForeignIncomeEditor },
];

const DEDUCTIONS = { id: 'deductions', icon: CheckCircle, label: 'Deductions', color: '#16a34a', editor: DeductionsEditor };
const BANK = { id: 'bank', icon: CheckCircle, label: 'Bank & Submit', color: '#111827', editor: BankEditor };

function getITRType(active) {
  if (active.includes('business')) return 'ITR-3';
  if (active.includes('capital_gains') || active.includes('foreign')) return 'ITR-2';
  return 'ITR-1';
}

const ITR_NAMES = { 'ITR-1': 'Sahaj', 'ITR-2': 'Capital Gains', 'ITR-3': 'Business', 'ITR-4': 'Sugam' };

export default function ITR1Flow() {
  const { filingId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: filing, isLoading } = useQuery({
    queryKey: ['filing', filingId],
    queryFn: async () => (await api.get(`/filings/${filingId}`)).data.data,
  });

  const [active, setActive] = useState(['salary']);
  const [selected, setSelected] = useState('salary');
  const [comp, setComp] = useState(null);
  const [bankData, setBankData] = useState({ bankName: '', accountNumber: '', ifsc: '', accountType: 'SAVINGS' });
  const [bankErrors, setBankErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Init from filing
  useEffect(() => {
    if (!filing) return;
    const p = filing.jsonPayload || {};
    const s = new Set();
    if (p.income?.salary?.employers?.length) s.add('salary');
    if (p.income?.houseProperty?.type && p.income.houseProperty.type !== 'NONE') s.add('house_property');
    if (p.income?.capitalGains?.transactions?.length) s.add('capital_gains');
    if (p.income?.business?.businesses?.length || p.income?.presumptive?.entries?.length) s.add('business');
    if (n(p.income?.otherSources?.savingsInterest) + n(p.income?.otherSources?.fdInterest) > 0) s.add('other');
    if (p.income?.foreignIncome?.incomes?.length) s.add('foreign');
    if (s.size === 0) s.add('salary');
    setActive([...s]);
  }, [filing]);

  // Save
  const saveMut = useMutation({
    mutationFn: async (updates) => {
      await api.put(`/filings/${filingId}`, { jsonPayload: deepMerge(filing?.jsonPayload || {}, updates) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['filing', filingId] }); recompute(); },
    onError: (e) => toast.error(e.response?.data?.error || 'Save failed'),
  });

  const recompute = useCallback(async () => {
    try {
      const itr = getITRType(active);
      const ep = { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3' }[itr] || 'itr1';
      const r = await api.post(`/filings/${filingId}/${ep}/compute`);
      setComp(r.data.data);
    } catch { /* compute silently fails */ }
  }, [filingId, active]);

  useEffect(() => { if (filing) recompute(); }, [filing]); // eslint-disable-line

  const toggleSource = (id) => {
    setActive(prev => {
      if (prev.includes(id)) return prev.length > 1 ? prev.filter(s => s !== id) : prev;
      return [...prev, id];
    });
    setSelected(id);
  };

  const handleSubmit = async () => {
    const p = filing?.jsonPayload || {};
    const bv = validateBankAccount(p.bankAccount || {});
    if (!bv.valid) { setSelected('bank'); toast.error('Complete bank details'); return; }
    try {
      await api.post(`/filings/${filingId}/submit`);
      toast.success('Filed!');
      navigate(`/filing/${filingId}/submission-status`);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const downloadJSON = async () => {
    try {
      const itr = getITRType(active);
      const ep = { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3' }[itr] || 'itr1';
      const r = await api.get(`/filings/${filingId}/${ep}/json`);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(r.data, null, 2)]));
      a.download = `${itr.replace('-', '')}_AY${filing?.assessmentYear}.json`; a.click();
    } catch { toast.error('Download failed'); }
  };

  if (isLoading) return <div className="hud-loading"><Loader2 size={28} className="animate-spin" /></div>;

  const payload = filing?.jsonPayload || {};
  const itrType = getITRType(active);
  const income = comp?.income;
  const rec = comp?.recommended || 'new';
  const tax = comp?.[rec === 'old' ? 'oldRegime' : 'newRegime'];
  const tds = comp?.tds;

  // Get totals for sidebar
  const getTotalForSource = (id) => {
    if (!income) return null;
    switch (id) {
      case 'salary': return income.salary?.netTaxable;
      case 'house_property': return income.houseProperty?.netIncome;
      case 'other': return income.otherSources?.total;
      case 'capital_gains': return income.capitalGains?.totalTaxable;
      case 'business': return income.business?.netProfit || income.presumptive?.totalIncome;
      case 'foreign': return income.foreignIncome?.totalIncome;
      default: return null;
    }
  };

  // Find the editor for selected section
  const getEditor = () => {
    if (selected === 'deductions') return DEDUCTIONS.editor;
    if (selected === 'bank') return BANK.editor;
    const src = SOURCES.find(s => s.id === selected);
    return src?.editor || SalaryEditor;
  };

  const Editor = getEditor();

  return (
    <div className="hud">
      {/* ── Left Panel ── */}
      <aside className="hud-panel">
        {/* Filing Info Header */}
        <div className="hud-filing-info">
          <div className="hud-filing-name">{user?.fullName || 'Taxpayer'}</div>
          <div className="hud-filing-detail">PAN: {filing?.taxpayerPan || '---'}</div>
          <div className="hud-filing-detail">AY {filing?.assessmentYear || '---'}</div>
        </div>

        {/* ITR Badge */}
        <div className="hud-itr-badge">
          <span className="hud-itr-type">{itrType}</span>
          <span className="hud-itr-name">{ITR_NAMES[itrType]}</span>
        </div>

        {/* Income Sources */}
        <div className="hud-section-label">Income</div>
        {SOURCES.map(src => {
          const isActive = active.includes(src.id);
          const isSel = selected === src.id;
          const Icon = src.icon;
          const total = getTotalForSource(src.id);
          return (
            <div key={src.id}
              className={`hud-source ${isActive ? 'active' : 'inactive'} ${isSel ? 'selected' : ''}`}
              onClick={() => isActive ? setSelected(src.id) : toggleSource(src.id)}>
              <div className="hud-source-left">
                <Icon size={16} style={{ color: isActive ? src.color : '#d1d5db' }} />
                <span className="hud-source-label">{src.label}</span>
              </div>
              <div className="hud-source-right">
                {isActive && total !== null && total !== undefined && (
                  <span className={`hud-source-total ${n(total) < 0 ? 'negative' : ''}`}>{fmt(total)}</span>
                )}
                {isActive ? (
                  <button className="hud-source-toggle" onClick={e => { e.stopPropagation(); toggleSource(src.id); }} title="Remove"><X size={12} /></button>
                ) : (
                  <Plus size={14} style={{ color: '#9ca3af' }} />
                )}
              </div>
            </div>
          );
        })}

        {/* Deductions */}
        <div className="hud-section-label" style={{ marginTop: 12 }}>Tax Savings</div>
        <div className={`hud-source active ${selected === 'deductions' ? 'selected' : ''}`} onClick={() => setSelected('deductions')}>
          <div className="hud-source-left"><CheckCircle size={16} style={{ color: '#16a34a' }} /><span className="hud-source-label">Deductions</span></div>
          <ChevronRight size={14} style={{ color: '#9ca3af' }} />
        </div>

        {/* Tax Summary */}
        <div className="hud-section-label" style={{ marginTop: 12 }}>Tax Summary</div>
        <div className="hud-tax-summary">
          {income && <div className="hud-tax-row"><span>Gross Income</span><span className="hud-tax-val">{fmt(income.grossTotal)}</span></div>}
          {tax && <div className="hud-tax-row"><span>Tax ({rec})</span><span className="hud-tax-val">{fmt(tax.totalTax)}</span></div>}
          {tds && <div className="hud-tax-row"><span>TDS Credit</span><span className="hud-tax-val green">{fmt(tds.total)}</span></div>}
          {tax && tds && (
            <div className={`hud-tax-result ${tax.totalTax <= tds.total ? 'refund' : 'payable'}`}>
              <span>{tax.totalTax <= tds.total ? 'Refund' : 'Payable'}</span>
              <span>{fmt(Math.abs(tax.totalTax - tds.total))}</span>
            </div>
          )}
          {comp?.savings > 0 && (
            <div className="hud-tax-hint">
              {comp.recommended === 'old' ? 'Old' : 'New'} regime saves {fmt(comp.savings)}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="hud-actions">
          <button className="hud-btn-outline" onClick={downloadJSON}><Download size={14} /> JSON</button>
          <button className="hud-btn-primary" onClick={() => setSelected('bank')}><Send size={14} /> Review & Submit</button>
        </div>
      </aside>

      {/* ── Center Editor ── */}
      <main className="hud-editor">
        <Editor
          payload={payload}
          filing={filing}
          onSave={(updates) => saveMut.mutateAsync(updates)}
          isSaving={saveMut.isPending}
          activeSources={active}
          computation={comp}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          bankData={bankData}
          setBankData={setBankData}
          bankErrors={bankErrors}
          onDownloadJSON={downloadJSON}
        />
      </main>
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
