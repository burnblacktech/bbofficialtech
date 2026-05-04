import { useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, Info } from 'lucide-react';
import { validateCapitalGainsStep } from '../../../../utils/itrValidation';
import { Field, Select, Grid, Card, Section, Button, Divider, Money, Alert } from '../../../../components/ds';

const n = (v) => Number(v) || 0;
const fmt = (v) => `₹${n(v).toLocaleString('en-IN')}`;
const EMPTY = { assetType: 'equity', gainType: 'LTCG', saleValue: '', purchaseValue: '', indexedCost: '', expenses: '', exemption: '', saleDate: '', purchaseDate: '', tdsOnSale: '' };

const ASSET_OPTIONS = [
  { value: 'equity', label: 'Listed Equity / Shares' },
  { value: 'mutualFund', label: 'Equity Mutual Funds' },
  { value: 'property', label: 'Property / Real Estate' },
  { value: 'debtMF', label: 'Debt Mutual Funds' },
  { value: 'gold', label: 'Gold / Sovereign Gold Bonds' },
  { value: 'other', label: 'Other Assets' },
];

const ASSET_LABELS = Object.fromEntries(ASSET_OPTIONS.map(o => [o.value, o.label]));

const HOLDING_HINTS = {
  equity: { stcg: '< 12 months', ltcg: '≥ 12 months' },
  mutualFund: { stcg: '< 12 months', ltcg: '≥ 12 months' },
  property: { stcg: '< 24 months', ltcg: '≥ 24 months' },
  debtMF: { stcg: '< 36 months', ltcg: '≥ 36 months' },
  gold: { stcg: '< 36 months', ltcg: '≥ 36 months' },
  other: { stcg: '< 36 months', ltcg: '≥ 36 months' },
};

const GAIN_TYPE_OPTIONS = [
  { value: 'STCG', label: 'Short Term (STCG)' },
  { value: 'LTCG', label: 'Long Term (LTCG)' },
];

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

  const gain = (t) => n(t.saleValue) - (n(t.indexedCost) || n(t.purchaseValue)) - n(t.expenses);
  const netGain = (t) => gain(t) - n(t.exemption);

  const stcgEquity = txns.filter(t => t.gainType === 'STCG' && ['equity', 'mutualFund'].includes(t.assetType)).reduce((s, t) => s + netGain(t), 0);
  const stcgOther = txns.filter(t => t.gainType === 'STCG' && !['equity', 'mutualFund'].includes(t.assetType)).reduce((s, t) => s + netGain(t), 0);
  const ltcgEquity = txns.filter(t => t.gainType === 'LTCG' && ['equity', 'mutualFund'].includes(t.assetType)).reduce((s, t) => s + netGain(t), 0);
  const ltcgOther = txns.filter(t => t.gainType === 'LTCG' && !['equity', 'mutualFund'].includes(t.assetType)).reduce((s, t) => s + netGain(t), 0);
  const totalCG = stcgEquity + stcgOther + ltcgEquity + ltcgOther;

  const holdingHint = form ? HOLDING_HINTS[form.assetType] || HOLDING_HINTS.other : null;

  return (
    <div>
      <h2 className="step-title">Profit or Loss from Selling Assets</h2>
      <p className="step-desc">Record your asset sales — stocks, property, gold, crypto</p>

      {/* Existing transactions */}
      {txns.map((t, i) => editing === i ? null : (
        <Card key={i}>
          <div className="ds-item">
            <div>
              <div className="ds-item__name">{ASSET_LABELS[t.assetType] || t.assetType} — {t.gainType}</div>
              <div className="ds-item__detail">
                Sale: {fmt(t.saleValue)} · Cost: {fmt(t.indexedCost || t.purchaseValue)} · {netGain(t) >= 0 ? 'Gain' : 'Loss'}: <span style={{ color: netGain(t) >= 0 ? 'var(--c-text)' : 'var(--c-error)', fontWeight: 600 }}>{fmt(Math.abs(netGain(t)))}</span>
              </div>
            </div>
            <div className="ds-item__actions">
              <Button variant="ghost" size="sm" onClick={() => { setForm({ ...t }); setEditing(i); }}><Edit2 size={15} /></Button>
              <Button variant="danger" size="sm" onClick={() => remove(i)}><Trash2 size={15} /></Button>
            </div>
          </div>
        </Card>
      ))}

      {/* Edit form */}
      {form && (
        <Card active>
          <Grid cols={3}>
            <Select label="Asset Type" value={form.assetType} onChange={v => setForm({ ...form, assetType: v })} options={ASSET_OPTIONS} />
            <Select
              label="Gain Type"
              value={form.gainType}
              onChange={v => setForm({ ...form, gainType: v })}
              options={GAIN_TYPE_OPTIONS}
              hint={holdingHint ? `STCG: held ${holdingHint.stcg} · LTCG: held ${holdingHint.ltcg}` : undefined}
            />
          </Grid>
          <Grid cols={3}>
            <Field label="Sale Date" type="date" value={form.saleDate} onChange={v => setForm({ ...form, saleDate: v })} />
            <Field label="Purchase Date" type="date" value={form.purchaseDate} onChange={v => setForm({ ...form, purchaseDate: v })} />
          </Grid>
          <Grid cols={3}>
            <Field label="Sale Value *" type="number" value={form.saleValue} onChange={v => setForm({ ...form, saleValue: v })} placeholder="0" />
            <Field label="Purchase Value *" type="number" value={form.purchaseValue} onChange={v => setForm({ ...form, purchaseValue: v })} placeholder="0" />
          </Grid>
          <Grid cols={3}>
            <Field label="Indexed Cost" type="number" value={form.indexedCost} onChange={v => setForm({ ...form, indexedCost: v })} hint="Inflation-adjusted cost · For LTCG on property/debt" placeholder="0" />
            <Field label="Expenses" type="number" value={form.expenses} onChange={v => setForm({ ...form, expenses: v })} hint="Brokerage, stamp duty, legal fees" placeholder="0" />
            <Field label="Exemption (54/54EC/54F)" type="number" value={form.exemption} onChange={v => setForm({ ...form, exemption: v })} placeholder="0" />
          </Grid>
          <Field label="TDS Deducted on This Sale" type="number" value={form.tdsOnSale} onChange={v => setForm({ ...form, tdsOnSale: v })} hint="10% TDS on LTCG > ₹1L · From broker statement" placeholder="0" />

          {/* Live gain preview */}
          {n(form.saleValue) > 0 && (
            <Alert variant={netGain(form) >= 0 ? 'success' : 'error'} style={{ marginTop: 8 }}>
              {netGain(form) >= 0 ? 'Gain' : 'Loss'}: <span style={{ fontWeight: 700 }}>{fmt(Math.abs(netGain(form)))}</span>
              {n(form.exemption) > 0 && <span style={{ opacity: 0.7 }}> (after {fmt(form.exemption)} exemption)</span>}
            </Alert>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button variant="primary" onClick={save} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Transaction'}</Button>
            <Button variant="secondary" onClick={() => { setForm(null); setEditing(null); setErrors({}); }}>Cancel</Button>
          </div>
        </Card>
      )}

      {!form && (
        <Button variant="secondary" onClick={() => { setForm({ ...EMPTY }); setEditing(txns.length); setErrors({}); }} style={{ marginTop: 8 }}>
          <Plus size={15} /> Add Transaction
        </Button>
      )}

      {Object.keys(errors).length > 0 && (
        <Alert variant="error" style={{ marginTop: 8 }}>
          <AlertCircle size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> {Object.values(errors).join(' · ')}
        </Alert>
      )}

      {/* TDS on Capital Gains */}
      {txns.length > 0 && (
        <Card active style={{ marginTop: 8 }}>
          <Section title="TDS on Capital Gains" />
          <Field label="Total TDS Deducted by Broker" type="number" value={tdsCG} onChange={v => setTdsCG(v)} hint="Total TDS on capital gains · From broker certificate or 26AS" placeholder="0" />
          <Button variant="secondary" size="sm" onClick={saveTds} style={{ marginTop: 8 }}>Save TDS</Button>
        </Card>
      )}

      {/* Summary */}
      {txns.length > 0 && (
        <Card muted>
          <Section title="Capital Gains Summary" />
          {stcgEquity !== 0 && <Money label="STCG — Equity/MF (20%)" value={fmt(stcgEquity)} bold color={stcgEquity < 0 ? 'red' : undefined} />}
          {stcgOther !== 0 && <Money label="STCG — Other (slab rate)" value={fmt(stcgOther)} bold color={stcgOther < 0 ? 'red' : undefined} />}
          {ltcgEquity !== 0 && <Money label="LTCG — Equity/MF (12.5%, ₹1.25L exempt)" value={fmt(ltcgEquity)} bold color={ltcgEquity < 0 ? 'red' : undefined} />}
          {ltcgOther !== 0 && <Money label="LTCG — Property/Other (20%)" value={fmt(ltcgOther)} bold color={ltcgOther < 0 ? 'red' : undefined} />}
          <Divider />
          <Money label="Net Capital Gains" value={fmt(totalCG)} bold color={totalCG < 0 ? 'red' : undefined} />
          {n(tdsCG) > 0 && <Money label="TDS Credit" value={fmt(tdsCG)} color="green" />}

          <Alert variant="info" style={{ marginTop: 8 }}>
            <Info size={14} style={{ flexShrink: 0, verticalAlign: -2, marginRight: 4 }} />
            STCG equity: 20% · LTCG equity: 12.5% (first ₹1.25L exempt) · LTCG property/other: 20% with indexation · STCG other: taxed at slab rates · Losses can offset gains of same type
          </Alert>
        </Card>
      )}
    </div>
  );
}
