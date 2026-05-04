import { useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Field, Select, Grid, Card, Section, Button, Money, Alert } from '../../../../components/ds';

const n = (v) => Number(v) || 0;
const P_EMPTY = { section: '44AD', grossReceipts: '', isDigital: true, declaredIncome: '' };
const R_EMPTY = { name: '', turnover: '', grossProfit: '', expenses: { rent: '', salary: '', interest: '', other: '' }, depreciation: '' };

const SECTION_OPTIONS = [
  { value: '44AD', label: '44AD — Business' },
  { value: '44ADA', label: '44ADA — Profession' },
  { value: '44AE', label: '44AE — Goods Carriage' },
];

export default function BusinessEditor({ payload, onSave, isSaving }) {
  const [mode, setMode] = useState(payload?.income?.presumptive ? 'presumptive' : payload?.income?.business ? 'regular' : 'presumptive');
  const pEntries = payload?.income?.presumptive?.entries || [];
  const rEntries = payload?.income?.business?.businesses || [];
  const [pList, setPList] = useState(pEntries);
  const [rList, setRList] = useState(rEntries);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});

  const minRate = (f) => f?.section === '44ADA' ? 50 : f?.isDigital ? 6 : 8;

  const saveP = () => {
    if (!form?.grossReceipts) { setErrors({ _form: 'Gross receipts required' }); return; }
    const minIncome = Math.round(n(form.grossReceipts) * minRate(form) / 100);
    if (n(form.declaredIncome) < minIncome) {
      setErrors({ income: `Declared income must be at least ${minRate(form)}% of receipts (₹${minIncome.toLocaleString('en-IN')})` });
    } else { setErrors({}); }
    const updated = [...pList]; updated[editing] = { ...form, grossReceipts: n(form.grossReceipts), declaredIncome: Math.max(n(form.declaredIncome), minIncome) };
    setPList(updated); setForm(null); setEditing(null);
    onSave({ income: { presumptive: { entries: updated } } });
  };

  const saveR = () => {
    if (!form?.name) { setErrors({ _form: 'Business name required' }); return; }
    setErrors({});
    const updated = [...rList]; updated[editing] = { ...form, turnover: n(form.turnover), grossProfit: n(form.grossProfit), depreciation: n(form.depreciation), expenses: { rent: n(form.expenses?.rent), salary: n(form.expenses?.salary), interest: n(form.expenses?.interest), other: n(form.expenses?.other) } };
    setRList(updated); setForm(null); setEditing(null);
    onSave({ income: { business: { businesses: updated } } });
  };

  const remove = (list, setList, key, i) => {
    const updated = list.filter((_, idx) => idx !== i);
    setList(updated);
    onSave({ income: { [key]: key === 'presumptive' ? { entries: updated } : { businesses: updated } } });
  };

  const items = mode === 'presumptive' ? pList : rList;
  const netExp = (b) => n(b.expenses?.rent) + n(b.expenses?.salary) + n(b.expenses?.interest) + n(b.expenses?.other);

  return (
    <div>
      <h2 className="step-title">Business or Freelance Income</h2>
      <p className="step-desc">Presumptive or regular business income</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['presumptive', 'Simple Estimate (Presumptive)'], ['regular', 'Full Accounts (Regular Books)']].map(([k, label]) => (
          <div key={k} className={`ds-option${mode === k ? ' selected' : ''}`} onClick={() => setMode(k)}>
            <div className="ds-option__label">{label}</div>
          </div>
        ))}
      </div>

      {items.map((item, i) => editing === i ? null : (
        <Card key={i}>
          <div className="ds-item">
            <div>
              <div className="ds-item__name">{mode === 'presumptive' ? `${item.section} — ₹${n(item.grossReceipts).toLocaleString('en-IN')}` : item.name}</div>
              <div className="ds-item__detail">{mode === 'presumptive' ? `Declared: ₹${n(item.declaredIncome).toLocaleString('en-IN')}` : `Turnover: ₹${n(item.turnover).toLocaleString('en-IN')}`}</div>
            </div>
            <div className="ds-item__actions">
              <Button variant="ghost" size="sm" onClick={() => { setForm({ ...item }); setEditing(i); }}><Edit2 size={15} /></Button>
              <Button variant="danger" size="sm" onClick={() => remove(mode === 'presumptive' ? pList : rList, mode === 'presumptive' ? setPList : setRList, mode === 'presumptive' ? 'presumptive' : 'business', i)}><Trash2 size={15} /></Button>
            </div>
          </div>
        </Card>
      ))}

      {form && mode === 'presumptive' && (
        <Card active>
          <Select label="Section" value={form.section} onChange={v => setForm({ ...form, section: v })} options={SECTION_OPTIONS} />
          <Field label="Gross Receipts (₹)" type="number" value={form.grossReceipts} onChange={v => setForm({ ...form, grossReceipts: v })} placeholder="0" />
          <label className="ds-check"><input type="checkbox" checked={form.isDigital} onChange={e => setForm({ ...form, isDigital: e.target.checked })} /> Digital receipts ({'>'} 95%)</label>
          <Field label="Declared Income (₹)" type="number" value={form.declaredIncome} onChange={v => setForm({ ...form, declaredIncome: v })} hint={`Min ${minRate(form)}% of receipts = ₹${Math.round(n(form.grossReceipts) * minRate(form) / 100).toLocaleString('en-IN')}`} placeholder="0" />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button variant="primary" onClick={saveP} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
            <Button variant="secondary" onClick={() => { setForm(null); setEditing(null); }}>Cancel</Button>
          </div>
        </Card>
      )}

      {form && mode === 'regular' && (
        <Card active>
          <Grid cols={3}>
            <Field label="Business Name *" value={form.name} onChange={v => setForm({ ...form, name: v })} />
            <Field label="Turnover (₹)" type="number" value={form.turnover} onChange={v => setForm({ ...form, turnover: v })} placeholder="0" />
          </Grid>
          <Field label="Gross Profit (₹)" type="number" value={form.grossProfit} onChange={v => setForm({ ...form, grossProfit: v })} placeholder="0" />
          <Section title="Expenses" />
          <Grid cols={3}>
            <Field label="Rent" type="number" value={form.expenses?.rent} onChange={v => setForm({ ...form, expenses: { ...form.expenses, rent: v } })} placeholder="0" />
            <Field label="Salary" type="number" value={form.expenses?.salary} onChange={v => setForm({ ...form, expenses: { ...form.expenses, salary: v } })} placeholder="0" />
            <Field label="Interest" type="number" value={form.expenses?.interest} onChange={v => setForm({ ...form, expenses: { ...form.expenses, interest: v } })} placeholder="0" />
            <Field label="Other" type="number" value={form.expenses?.other} onChange={v => setForm({ ...form, expenses: { ...form.expenses, other: v } })} placeholder="0" />
          </Grid>
          <Field label="Depreciation (₹)" type="number" value={form.depreciation} onChange={v => setForm({ ...form, depreciation: v })} placeholder="0" />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button variant="primary" onClick={saveR} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
            <Button variant="secondary" onClick={() => { setForm(null); setEditing(null); }}>Cancel</Button>
          </div>
        </Card>
      )}

      {!form && (
        <Button variant="secondary" onClick={() => { setForm(mode === 'presumptive' ? { ...P_EMPTY } : { ...R_EMPTY }); setEditing(items.length); setErrors({}); }} style={{ marginTop: 8 }}>
          <Plus size={15} /> Add {mode === 'presumptive' ? 'Entry' : 'Business'}
        </Button>
      )}

      {Object.keys(errors).length > 0 && (
        <Alert variant="error" style={{ marginTop: 8 }}>
          <AlertCircle size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> {Object.values(errors).join(' · ')}
        </Alert>
      )}

      {items.length > 0 && (
        <Card muted>
          <Money label="Total Income" value={`₹${(mode === 'presumptive' ? pList.reduce((s, e) => s + n(e.declaredIncome), 0) : rList.reduce((s, b) => s + n(b.grossProfit) - netExp(b) - n(b.depreciation), 0)).toLocaleString('en-IN')}`} bold />
        </Card>
      )}
    </div>
  );
}
