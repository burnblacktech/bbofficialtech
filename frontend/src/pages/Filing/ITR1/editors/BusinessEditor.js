import { useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Button, Alert } from '../../../../components/ds';
import FilingField, { FilingGrid, FilingSection } from '../../../../components/Filing/FilingField';

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
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[['presumptive', 'Presumptive (Simple)'], ['regular', 'Regular Books']].map(([k, label]) => (
          <button key={k} onClick={() => setMode(k)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: mode === k ? 700 : 500, border: `1px solid ${mode === k ? 'var(--brand-primary)' : 'var(--border-light)'}`, borderRadius: 6, background: mode === k ? 'var(--brand-primary-light)' : 'var(--bg-card)', color: mode === k ? 'var(--brand-primary-dark)' : 'var(--text-secondary)', cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {items.map((item, i) => editing === i ? null : (
        <FilingSection key={i} title={mode === 'presumptive' ? item.section : item.name} badge={<span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{n(mode === 'presumptive' ? item.declaredIncome : item.grossProfit).toLocaleString('en-IN')}</span>}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={() => { setForm({ ...item }); setEditing(i); }}><Edit2 size={13} /> Edit</Button>
            <Button variant="danger" onClick={() => remove(mode === 'presumptive' ? pList : rList, mode === 'presumptive' ? setPList : setRList, mode === 'presumptive' ? 'presumptive' : 'business', i)}><Trash2 size={13} /></Button>
          </div>
        </FilingSection>
      ))}

      {form && mode === 'presumptive' && (
        <FilingSection title="Presumptive Entry">
          <FilingGrid cols={2}>
            <FilingField label="Section" type="select" value={form.section} onChange={v => setForm({ ...form, section: v })} options={SECTION_OPTIONS} />
            <FilingField label="Gross Receipts" type="currency" value={form.grossReceipts} onChange={v => setForm({ ...form, grossReceipts: v })} required />
          </FilingGrid>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, margin: '6px 0', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isDigital} onChange={e => setForm({ ...form, isDigital: e.target.checked })} /> Digital receipts ({'>'}95%)
          </label>
          <FilingGrid cols={2}>
            <FilingField label="Declared Income" type="currency" value={form.declaredIncome} onChange={v => setForm({ ...form, declaredIncome: v })} hint={`Min ${minRate(form)}%: ₹${Math.round(n(form.grossReceipts) * minRate(form) / 100).toLocaleString('en-IN')}`} />
          </FilingGrid>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="primary" onClick={saveP} disabled={isSaving} style={{ maxWidth: 120 }}>{isSaving ? 'Saving...' : 'Save'}</Button>
            <Button variant="secondary" onClick={() => { setForm(null); setEditing(null); }} style={{ maxWidth: 100 }}>Cancel</Button>
          </div>
        </FilingSection>
      )}

      {form && mode === 'regular' && (
        <FilingSection title="Business Details">
          <FilingGrid cols={3}>
            <FilingField label="Business Name" type="wide" value={form.name} onChange={v => setForm({ ...form, name: v })} required />
            <FilingField label="Turnover" type="currency" value={form.turnover} onChange={v => setForm({ ...form, turnover: v })} />
            <FilingField label="Gross Profit" type="currency" value={form.grossProfit} onChange={v => setForm({ ...form, grossProfit: v })} />
          </FilingGrid>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-light)', margin: '10px 0 6px' }}>Expenses</div>
          <FilingGrid cols={3}>
            <FilingField label="Rent" type="currency" value={form.expenses?.rent} onChange={v => setForm({ ...form, expenses: { ...form.expenses, rent: v } })} />
            <FilingField label="Salary" type="currency" value={form.expenses?.salary} onChange={v => setForm({ ...form, expenses: { ...form.expenses, salary: v } })} />
            <FilingField label="Interest" type="currency" value={form.expenses?.interest} onChange={v => setForm({ ...form, expenses: { ...form.expenses, interest: v } })} />
            <FilingField label="Other" type="currency" value={form.expenses?.other} onChange={v => setForm({ ...form, expenses: { ...form.expenses, other: v } })} />
            <FilingField label="Depreciation" type="currency" value={form.depreciation} onChange={v => setForm({ ...form, depreciation: v })} />
          </FilingGrid>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="primary" onClick={saveR} disabled={isSaving} style={{ maxWidth: 120 }}>{isSaving ? 'Saving...' : 'Save'}</Button>
            <Button variant="secondary" onClick={() => { setForm(null); setEditing(null); }} style={{ maxWidth: 100 }}>Cancel</Button>
          </div>
        </FilingSection>
      )}

      {!form && (
        <Button variant="secondary" onClick={() => { setForm(mode === 'presumptive' ? { ...P_EMPTY } : { ...R_EMPTY }); setEditing(items.length); setErrors({}); }} style={{ marginTop: 8, maxWidth: 180 }}>
          <Plus size={13} /> Add {mode === 'presumptive' ? 'Entry' : 'Business'}
        </Button>
      )}

      {Object.keys(errors).length > 0 && (
        <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', borderRadius: 6, fontSize: 12, color: 'var(--color-error)' }}>
          <AlertCircle size={12} style={{ verticalAlign: -2, marginRight: 4 }} /> {Object.values(errors).join(' · ')}
        </div>
      )}
    </div>
  );
}
