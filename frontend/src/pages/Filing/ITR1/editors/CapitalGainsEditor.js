import { useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, Info } from 'lucide-react';
import { validateCapitalGainsStep } from '../../../../utils/itrValidation';
import P from '../../../../styles/palette';
import '../../filing-flow.css';

const n = (v) => Number(v) || 0;
const fmt = (v) => `\u20B9${n(v).toLocaleString('en-IN')}`;
const EMPTY = { assetType: 'equity', gainType: 'LTCG', saleValue: '', purchaseValue: '', indexedCost: '', expenses: '', exemption: '', saleDate: '', purchaseDate: '', tdsOnSale: '' };

const ASSET_LABELS = {
  equity: 'Listed Equity / Shares',
  mutualFund: 'Equity Mutual Funds',
  property: 'Property / Real Estate',
  debtMF: 'Debt Mutual Funds',
  gold: 'Gold / Sovereign Gold Bonds',
  other: 'Other Assets',
};

const HOLDING_HINTS = {
  equity: { stcg: '< 12 months', ltcg: '\u2265 12 months' },
  mutualFund: { stcg: '< 12 months', ltcg: '\u2265 12 months' },
  property: { stcg: '< 24 months', ltcg: '\u2265 24 months' },
  debtMF: { stcg: '< 36 months', ltcg: '\u2265 36 months' },
  gold: { stcg: '< 36 months', ltcg: '\u2265 36 months' },
  other: { stcg: '< 36 months', ltcg: '\u2265 36 months' },
};

export default function CapitalGainsEditor({ payload, onSave, isSaving }) {
  const existing = payload?.income?.capitalGains?.transactions || [];
  const existingTds = n(payload?.taxes?.tds?.fromCapitalGains);
  const [txns, setTxns] = useState(existing.length ? existing : []);
  const [editing, setEditing] = useState(existing.length === 0 ? 0 : null);
  const [form, setForm] = useState(existing.length === 0 ? { ...EMPTY } : null);
  const [errors, setErrors] = useState({});
  const [tdsCG, setTdsCG] = useState(existingTds || '');

  const save = () => {
    if (!form?.saleValue) { setErrors({ _form: 'Sale value is required' }); return; }
    if (!form?.purchaseValue && !form?.indexedCost) { setErrors({ _form: 'Purchase value or indexed cost required' }); return; }
    const updated = [...txns];
    updated[editing] = {
      ...form,
      saleValue: n(form.saleValue), purchaseValue: n(form.purchaseValue),
      indexedCost: n(form.indexedCost), expenses: n(form.expenses),
      exemption: n(form.exemption), tdsOnSale: n(form.tdsOnSale),
    };
    const v = validateCapitalGainsStep(updated);
    setErrors(v.valid ? {} : v.errors);
    setTxns(updated); setForm(null); setEditing(null);
    onSave({ income: { capitalGains: { transactions: updated } }, taxes: { tds: { fromCapitalGains: n(tdsCG) } } });
  };

  const remove = (i) => {
    const updated = txns.filter((_, idx) => idx !== i);
    setTxns(updated);
    onSave({ income: { capitalGains: { transactions: updated } } });
  };

  const saveTds = () => {
    onSave({ taxes: { tds: { fromCapitalGains: n(tdsCG) } } });
  };

  // Calculate gains per transaction (can be negative = loss)
  const gain = (t) => n(t.saleValue) - (n(t.indexedCost) || n(t.purchaseValue)) - n(t.expenses);
  const netGain = (t) => gain(t) - n(t.exemption);

  // Aggregate by type — allow losses to offset within same category
  const stcgEquity = txns.filter(t => t.gainType === 'STCG' && ['equity', 'mutualFund'].includes(t.assetType)).reduce((s, t) => s + netGain(t), 0);
  const stcgOther = txns.filter(t => t.gainType === 'STCG' && !['equity', 'mutualFund'].includes(t.assetType)).reduce((s, t) => s + netGain(t), 0);
  const ltcgEquity = txns.filter(t => t.gainType === 'LTCG' && ['equity', 'mutualFund'].includes(t.assetType)).reduce((s, t) => s + netGain(t), 0);
  const ltcgOther = txns.filter(t => t.gainType === 'LTCG' && !['equity', 'mutualFund'].includes(t.assetType)).reduce((s, t) => s + netGain(t), 0);
  const totalCG = stcgEquity + stcgOther + ltcgEquity + ltcgOther;

  const holdingHint = form ? HOLDING_HINTS[form.assetType] || HOLDING_HINTS.other : null;

  return (
    <div>
      <h2 className="step-title">Capital Gains</h2>
      <p className="step-desc">Gains or losses from sale of shares, mutual funds, property, gold</p>

      {/* Existing transactions */}
      {txns.map((t, i) => editing === i ? null : (
        <div key={i} className="step-card">
          <div className="ff-item">
            <div>
              <div className="ff-item-name">{ASSET_LABELS[t.assetType] || t.assetType} — {t.gainType}</div>
              <div className="ff-item-detail">
                Sale: {fmt(t.saleValue)} · Cost: {fmt(t.indexedCost || t.purchaseValue)} · {netGain(t) >= 0 ? 'Gain' : 'Loss'}: <span style={{ color: netGain(t) >= 0 ? P.textPrimary : P.error, fontWeight: 600 }}>{fmt(Math.abs(netGain(t)))}</span>
              </div>
            </div>
            <div className="ff-item-actions">
              <button className="ff-btn-ghost" onClick={() => { setForm({ ...t }); setEditing(i); }}><Edit2 size={15} /></button>
              <button className="ff-btn-danger" onClick={() => remove(i)}><Trash2 size={15} /></button>
            </div>
          </div>
        </div>
      ))}

      {/* Edit form */}
      {form && (
        <div className="step-card editing">
          <div className="ff-grid-2">
            <div className="ff-field">
              <label className="ff-label">Asset Type</label>
              <select className="ff-select" value={form.assetType} onChange={e => setForm({ ...form, assetType: e.target.value })}>
                {Object.entries(ASSET_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="ff-field">
              <label className="ff-label">Gain Type</label>
              <select className="ff-select" value={form.gainType} onChange={e => setForm({ ...form, gainType: e.target.value })}>
                <option value="STCG">Short Term (STCG)</option>
                <option value="LTCG">Long Term (LTCG)</option>
              </select>
              {holdingHint && <div className="ff-hint">STCG: held {holdingHint.stcg} · LTCG: held {holdingHint.ltcg}</div>}
            </div>
          </div>
          <div className="ff-grid-2">
            <F l="Sale Date" v={form.saleDate} c={v => setForm({ ...form, saleDate: v })} t="date" />
            <F l="Purchase Date" v={form.purchaseDate} c={v => setForm({ ...form, purchaseDate: v })} t="date" />
          </div>
          <div className="ff-grid-2">
            <F l="Sale Value *" v={form.saleValue} c={v => setForm({ ...form, saleValue: v })} />
            <F l="Purchase Value *" v={form.purchaseValue} c={v => setForm({ ...form, purchaseValue: v })} />
          </div>
          <div className="ff-grid-3">
            <F l="Indexed Cost" v={form.indexedCost} c={v => setForm({ ...form, indexedCost: v })} h="Inflation-adjusted cost · For LTCG on property/debt" />
            <F l="Expenses" v={form.expenses} c={v => setForm({ ...form, expenses: v })} h="Brokerage, stamp duty, legal fees" />
            <F l="Exemption (54/54EC/54F)" v={form.exemption} c={v => setForm({ ...form, exemption: v })} />
          </div>
          <F l="TDS Deducted on This Sale" v={form.tdsOnSale} c={v => setForm({ ...form, tdsOnSale: v })} h="10% TDS on LTCG > ₹1L · From broker statement" />

          {/* Live gain preview */}
          {n(form.saleValue) > 0 && (
            <div style={{ padding: '8px 12px', background: netGain(form) >= 0 ? P.successBg : P.errorBg, borderRadius: 8, marginTop: 8, fontSize: 13 }}>
              {netGain(form) >= 0 ? 'Gain' : 'Loss'}: <span style={{ fontWeight: 700 }}>{fmt(Math.abs(netGain(form)))}</span>
              {n(form.exemption) > 0 && <span style={{ color: P.textMuted }}> (after {fmt(form.exemption)} exemption)</span>}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="ff-btn ff-btn-primary" onClick={save} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Transaction'}</button>
            <button className="ff-btn ff-btn-outline" onClick={() => { setForm(null); setEditing(null); setErrors({}); }}>Cancel</button>
          </div>
        </div>
      )}

      {!form && <button className="ff-btn ff-btn-add" onClick={() => { setForm({ ...EMPTY }); setEditing(txns.length); setErrors({}); }}><Plus size={15} /> Add Transaction</button>}

      {Object.keys(errors).length > 0 && (
        <div className="ff-errors">
          <div className="ff-errors-title"><AlertCircle size={14} /> Validation</div>
          <ul>{Object.values(errors).map((err, i) => <li key={i}>{err}</li>)}</ul>
        </div>
      )}

      {/* TDS on Capital Gains */}
      {txns.length > 0 && (
        <div className="step-card editing" style={{ marginTop: 8 }}>
          <div className="ff-section-title">TDS on Capital Gains</div>
          <F l="Total TDS Deducted by Broker" v={tdsCG} c={v => setTdsCG(v)} h="Total TDS on capital gains · From broker certificate or 26AS" />
          <button className="ff-btn ff-btn-outline" onClick={saveTds} style={{ marginTop: 8, fontSize: 12 }}>Save TDS</button>
        </div>
      )}

      {/* Summary */}
      {txns.length > 0 && (
        <div className="step-card summary">
          <div className="ff-section-title">Capital Gains Summary</div>
          {stcgEquity !== 0 && <div className="ff-row"><span className="ff-row-label">STCG — Equity/MF (20%)</span><span className={`ff-row-value bold ${stcgEquity < 0 ? 'red' : ''}`}>{fmt(stcgEquity)}</span></div>}
          {stcgOther !== 0 && <div className="ff-row"><span className="ff-row-label">STCG — Other (slab rate)</span><span className={`ff-row-value bold ${stcgOther < 0 ? 'red' : ''}`}>{fmt(stcgOther)}</span></div>}
          {ltcgEquity !== 0 && <div className="ff-row"><span className="ff-row-label">LTCG — Equity/MF (12.5%, {'\u20B9'}1.25L exempt)</span><span className={`ff-row-value bold ${ltcgEquity < 0 ? 'red' : ''}`}>{fmt(ltcgEquity)}</span></div>}
          {ltcgOther !== 0 && <div className="ff-row"><span className="ff-row-label">LTCG — Property/Other (20%)</span><span className={`ff-row-value bold ${ltcgOther < 0 ? 'red' : ''}`}>{fmt(ltcgOther)}</span></div>}
          <div className="ff-divider" />
          <div className="ff-row"><span className="ff-row-label">Net Capital Gains</span><span className={`ff-row-value bold ${totalCG < 0 ? 'red' : ''}`}>{fmt(totalCG)}</span></div>
          {n(tdsCG) > 0 && <div className="ff-row"><span className="ff-row-label">TDS Credit</span><span className="ff-row-value green">{fmt(tdsCG)}</span></div>}

          {/* Tax rate info */}
          <div style={{ marginTop: 8, padding: '8px 10px', background: P.infoBg, borderRadius: 6, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <Info size={14} color={P.brand} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 11, color: P.textMuted, lineHeight: 1.5 }}>
              STCG equity: 20% · LTCG equity: 12.5% (first {'\u20B9'}1.25L exempt) · LTCG property/other: 20% with indexation · STCG other: taxed at slab rates · Losses can offset gains of same type
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const F = ({ l, v, c, h, t = 'number' }) => (<div className="ff-field"><label className="ff-label">{l}</label><input className="ff-input" type={t} value={v || ''} onChange={e => c(e.target.value)} placeholder={t === 'date' ? '' : '0'} />{h && <div className="ff-hint">{h}</div>}</div>);
