/**
 * Unified ITR Filing — Game HUD Layout
 * Left panel: collapsible income sources + tax summary + actions
 * Center: active section editor OR default summary view
 * ITR type auto-adapts based on selected sources
 */

import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase, Home, TrendingUp, Building2, DollarSign, Globe,
  Plus, X, Loader2, Download, Send, CheckCircle, ChevronRight,
  ChevronDown, ArrowLeft, CreditCard,
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { validateBankAccount } from '../../../utils/itrValidation';
import toast from 'react-hot-toast';
import './itr-hud.css';

import SalaryEditor from './editors/SalaryEditor';
import HousePropertyEditor from './editors/HousePropertyEditor';
import OtherIncomeEditor from './editors/OtherIncomeEditor';
import CapitalGainsEditor from './editors/CapitalGainsEditor';
import BusinessEditor from './editors/BusinessEditor';
import ForeignIncomeEditor from './editors/ForeignIncomeEditor';
import DeductionsEditor from './editors/DeductionsEditor';
import BankEditor from './editors/BankEditor';

const n = (v) => Number(v) || 0;
const fmt = (v) => `\u20B9${Math.abs(n(v)).toLocaleString('en-IN')}`;

const SOURCES = [
  { id: 'salary', icon: Briefcase, label: 'Salary', color: '#059669', editor: SalaryEditor },
  { id: 'house_property', icon: Home, label: 'House Property', color: '#7c3aed', editor: HousePropertyEditor },
  { id: 'other', icon: DollarSign, label: 'Other Income', color: '#6b7280', editor: OtherIncomeEditor },
  { id: 'capital_gains', icon: TrendingUp, label: 'Capital Gains', color: '#2563eb', editor: CapitalGainsEditor },
  { id: 'business', icon: Building2, label: 'Business', color: '#d97706', editor: BusinessEditor },
  { id: 'foreign', icon: Globe, label: 'Foreign Income', color: '#0891b2', editor: ForeignIncomeEditor },
];

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
  const [selected, setSelected] = useState(null); // null = show summary
  const [comp, setComp] = useState(null);
  const [bankData, setBankData] = useState({ bankName: '', accountNumber: '', ifsc: '', accountType: 'SAVINGS' });
  const [bankErrors, setBankErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collapsed, setCollapsed] = useState({ income: false, savings: false, summary: false });

  // Init from filing
  useEffect(() => {
    if (!filing) return;
    const p = filing.jsonPayload || {};
    const s = new Set();
    if (p.income?.salary?.employers?.length) s.add('salary');
    if (p.income?.houseProperty?.type && p.income.houseProperty.type !== 'NONE' && p.income.houseProperty.type !== 'none') s.add('house_property');
    if (p.income?.capitalGains?.transactions?.length) s.add('capital_gains');
    if (p.income?.business?.businesses?.length || p.income?.presumptive?.entries?.length) s.add('business');
    if (n(p.income?.otherSources?.savingsInterest) + n(p.income?.otherSources?.fdInterest) > 0) s.add('other');
    if (p.income?.foreignIncome?.incomes?.length) s.add('foreign');
    if (s.size === 0) s.add('salary');
    setActive([...s]);
  }, [filing]);

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
    } catch { /* compute silently fails on empty data */ }
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
    setIsSubmitting(true);
    const p = filing?.jsonPayload || {};
    const bv = validateBankAccount(p.bankDetails || p.bankAccount || {});
    if (!bv.valid) { setSelected('bank'); toast.error('Complete bank details'); setIsSubmitting(false); return; }
    try {
      await api.post(`/filings/${filingId}/submit`);
      toast.success('Filed successfully!');
      navigate(`/filing/${filingId}/submission-status`);
    } catch (e) { toast.error(e.response?.data?.error || 'Submission failed'); }
    finally { setIsSubmitting(false); }
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
  const bestRegime = comp?.[rec === 'old' ? 'oldRegime' : 'newRegime'];
  const altRegime = comp?.[rec === 'old' ? 'newRegime' : 'oldRegime'];
  const tds = comp?.tds;

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

  const getEditor = () => {
    if (selected === 'deductions') return DeductionsEditor;
    if (selected === 'bank') return BankEditor;
    if (!selected) return null; // show summary
    const src = SOURCES.find(s => s.id === selected);
    return src?.editor || null;
  };

  const Editor = getEditor();
  const toggle = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="hud">
      {/* ── Left Panel ── */}
      <aside className="hud-panel">
        {/* Back nav */}
        <button className="hud-back" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={14} /> Dashboard
        </button>

        {/* Filing Info */}
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

        {/* Income Sources — collapsible */}
        <div className="hud-section-header" onClick={() => toggle('income')}>
          <span className="hud-section-label">Income</span>
          {collapsed.income ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        </div>
        {!collapsed.income && SOURCES.map(src => {
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
                {isActive && total != null && <span className={`hud-source-total ${n(total) < 0 ? 'negative' : ''}`}>{fmt(total)}</span>}
                {isActive ? (
                  <button className="hud-source-toggle" onClick={e => { e.stopPropagation(); toggleSource(src.id); }} title="Remove"><X size={12} /></button>
                ) : (
                  <Plus size={14} style={{ color: '#9ca3af' }} />
                )}
              </div>
            </div>
          );
        })}

        {/* Tax Savings — collapsible */}
        <div className="hud-section-header" onClick={() => toggle('savings')} style={{ marginTop: 8 }}>
          <span className="hud-section-label">Tax Savings</span>
          {collapsed.savings ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        </div>
        {!collapsed.savings && (
          <>
            <div className={`hud-source active ${selected === 'deductions' ? 'selected' : ''}`} onClick={() => setSelected('deductions')}>
              <div className="hud-source-left"><CheckCircle size={16} style={{ color: '#16a34a' }} /><span className="hud-source-label">Deductions</span></div>
              <ChevronRight size={14} style={{ color: '#9ca3af' }} />
            </div>
            <div className={`hud-source active ${selected === 'bank' ? 'selected' : ''}`} onClick={() => setSelected('bank')}>
              <div className="hud-source-left"><CreditCard size={16} style={{ color: '#6b7280' }} /><span className="hud-source-label">Bank & Submit</span></div>
              <ChevronRight size={14} style={{ color: '#9ca3af' }} />
            </div>
          </>
        )}

        {/* Tax Summary — collapsible */}
        <div className="hud-section-header" onClick={() => toggle('summary')} style={{ marginTop: 8 }}>
          <span className="hud-section-label">Tax Summary</span>
          {collapsed.summary ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        </div>
        {!collapsed.summary && (
          <div className="hud-tax-summary" onClick={() => setSelected(null)} style={{ cursor: 'pointer' }}>
            {income && <div className="hud-tax-row"><span>Gross Income</span><span className="hud-tax-val">{fmt(income.grossTotal)}</span></div>}
            {bestRegime && <div className="hud-tax-row"><span>Deductions</span><span className="hud-tax-val green">- {fmt(bestRegime.deductions)}</span></div>}
            {bestRegime && <div className="hud-tax-row"><span>Taxable</span><span className="hud-tax-val">{fmt(bestRegime.taxableIncome)}</span></div>}
            <div className="hud-tax-divider" />
            {bestRegime && <div className="hud-tax-row"><span>Tax ({rec})</span><span className="hud-tax-val">{fmt(bestRegime.totalTax)}</span></div>}
            {tds && n(tds.total) > 0 && <div className="hud-tax-row"><span>TDS Credit</span><span className="hud-tax-val green">{fmt(tds.total)}</span></div>}
            {bestRegime && tds && (
              <div className={`hud-tax-result ${bestRegime.netPayable <= 0 ? 'refund' : 'payable'}`}>
                <span>{bestRegime.netPayable <= 0 ? 'Refund' : 'Payable'}</span>
                <span>{fmt(Math.abs(bestRegime.netPayable))}</span>
              </div>
            )}
            {comp?.savings > 0 && <div className="hud-tax-hint">{rec === 'old' ? 'Old' : 'New'} regime saves {fmt(comp.savings)}</div>}
            <div className="hud-tax-expand">Click for full breakdown</div>
          </div>
        )}

        {/* Actions */}
        <div className="hud-actions">
          <button className="hud-btn-outline" onClick={downloadJSON}><Download size={14} /> JSON</button>
          <button className="hud-btn-primary" onClick={() => setSelected('bank')}><Send size={14} /> Review & Submit</button>
        </div>
      </aside>

      {/* ── Center: Editor or Summary ── */}
      <main className="hud-editor">
        {Editor ? (
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
        ) : (
          <SummaryView comp={comp} itrType={itrType} filing={filing} rec={rec} bestRegime={bestRegime} altRegime={altRegime} tds={tds} onEdit={setSelected} />
        )}
      </main>
    </div>
  );
}

/* ── Default Summary View (center area when nothing selected) ── */
function SummaryView({ comp, itrType, filing, rec, bestRegime, altRegime, tds, onEdit }) {
  const income = comp?.income;
  if (!comp) {
    return (
      <div>
        <h2 className="step-title">Filing Summary</h2>
        <p className="step-desc">Add income sources from the left panel to see your tax computation here.</p>
        <div className="step-card info" style={{ textAlign: 'center', padding: 32 }}>
          <Briefcase size={32} color="#2563eb" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 14, color: '#6b7280' }}>Start by clicking a source on the left</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="step-title">Tax Computation — {itrType}</h2>
      <p className="step-desc">AY {filing?.assessmentYear} · PAN {filing?.taxpayerPan}</p>

      {/* Income Breakdown */}
      <div className="step-card">
        <div className="ff-section-title" style={{ cursor: 'pointer' }} onClick={() => onEdit('salary')}>Income Breakdown</div>
        {income?.salary?.netTaxable > 0 && <SRow label="Salary (net)" value={income.salary.netTaxable} onClick={() => onEdit('salary')} />}
        {income?.houseProperty?.netIncome !== 0 && income?.houseProperty?.netIncome != null && <SRow label="House Property" value={income.houseProperty.netIncome} onClick={() => onEdit('house_property')} />}
        {income?.otherSources?.total > 0 && <SRow label="Other Sources" value={income.otherSources.total} onClick={() => onEdit('other')} />}
        {income?.capitalGains?.totalTaxable > 0 && <SRow label="Capital Gains" value={income.capitalGains.totalTaxable} onClick={() => onEdit('capital_gains')} />}
        {(income?.business?.netProfit > 0 || income?.presumptive?.totalIncome > 0) && <SRow label="Business" value={income.business?.netProfit || income.presumptive?.totalIncome} onClick={() => onEdit('business')} />}
        <div className="ff-divider" />
        <SRow label="Gross Total Income" value={income?.grossTotal} bold />
      </div>

      {/* Regime Comparison */}
      {bestRegime && altRegime && (
        <div className="step-card">
          <div className="ff-section-title" onClick={() => onEdit('deductions')} style={{ cursor: 'pointer' }}>Regime Comparison</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <RegimeCard regime={bestRegime} label={rec === 'old' ? 'Old Regime' : 'New Regime'} recommended tds={tds} />
            <RegimeCard regime={altRegime} label={rec === 'old' ? 'New Regime' : 'Old Regime'} tds={tds} />
          </div>
          {comp?.savings > 0 && (
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
              {rec === 'old' ? 'Old' : 'New'} regime saves {fmt(comp.savings)}
            </div>
          )}
        </div>
      )}

      {/* Slab Breakdown */}
      {bestRegime?.slabBreakdown?.length > 0 && (
        <div className="step-card">
          <div className="ff-section-title">Slab Breakdown ({rec} regime)</div>
          {bestRegime.slabBreakdown.filter(s => s.tax > 0).map((s, i) => (
            <div key={i} className="ff-row">
              <span className="ff-row-label">{fmt(s.min)} – {s.max === Infinity ? 'Above' : fmt(s.max)} @ {s.rate}%</span>
              <span className="ff-row-value">{fmt(s.tax)}</span>
            </div>
          ))}
          <div className="ff-divider" />
          <SRow label="Tax on Income" value={bestRegime.taxOnIncome} />
          {bestRegime.rebate > 0 && <SRow label="Less: Rebate 87A" value={-bestRegime.rebate} green />}
          {bestRegime.surcharge > 0 && <SRow label="Surcharge" value={bestRegime.surcharge} />}
          <SRow label="Health & Edu Cess (4%)" value={bestRegime.cess} />
          <div className="ff-divider" />
          <SRow label="Total Tax" value={bestRegime.totalTax} bold />
          {tds && n(tds.total) > 0 && <SRow label="Less: TDS / Advance Tax" value={-tds.total} green />}
          <div className="ff-divider" />
          <SRow label={bestRegime.netPayable <= 0 ? 'Refund Due' : 'Tax Payable'} value={Math.abs(bestRegime.netPayable)} bold color={bestRegime.netPayable <= 0 ? '#16a34a' : '#dc2626'} />
        </div>
      )}

      {/* Quick actions */}
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
    <div style={{ padding: 12, borderRadius: 8, border: recommended ? '2px solid #2563eb' : '1px solid #e5e7eb', background: recommended ? '#eff6ff' : '#fff', position: 'relative' }}>
      {recommended && <span style={{ position: 'absolute', top: -8, right: 8, fontSize: 10, fontWeight: 700, color: '#fff', background: '#2563eb', padding: '1px 8px', borderRadius: 10 }}>BEST</span>}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{label}</div>
      <div className="ff-row"><span className="ff-row-label">Taxable</span><span className="ff-row-value">{fmt(regime.taxableIncome)}</span></div>
      <div className="ff-row"><span className="ff-row-label">Deductions</span><span className="ff-row-value green">{fmt(regime.deductions)}</span></div>
      <div className="ff-row"><span className="ff-row-label">Tax</span><span className="ff-row-value bold">{fmt(regime.totalTax)}</span></div>
      {n(tds?.total) > 0 && <div className="ff-row"><span className="ff-row-label">After TDS</span><span className={`ff-row-value bold ${net <= 0 ? 'green' : 'red'}`}>{net <= 0 ? 'Refund ' : ''}{fmt(Math.abs(net))}</span></div>}
    </div>
  );
}

function SRow({ label, value, bold, green, color, onClick }) {
  const style = { cursor: onClick ? 'pointer' : 'default' };
  const valCls = `ff-row-value${bold ? ' bold' : ''}${green ? ' green' : ''}${n(value) < 0 ? ' green' : ''}`;
  return (
    <div className="ff-row" style={style} onClick={onClick}>
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
