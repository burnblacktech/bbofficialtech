import { useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { validateForeignIncomeStep } from '../../../../utils/itrValidation';
import { Button } from '../../../../components/ds';
import FilingField, { FilingGrid, FilingSection } from '../../../../components/Filing/FilingField';

const n = (v) => Number(v) || 0;
const EMPTY = { country: '', incomeType: 'salary', amountINR: '', taxPaidAbroad: '', dtaa: false };

const INCOME_TYPE_OPTIONS = [
  { value: 'salary', label: 'Salary' },
  { value: 'interest', label: 'Interest' },
  { value: 'dividend', label: 'Dividend' },
  { value: 'capitalGains', label: 'Capital Gains' },
  { value: 'rental', label: 'Rental' },
  { value: 'other', label: 'Other' },
];

export default function ForeignIncomeEditor({ payload, onSave, isSaving }) {
  const existing = payload?.income?.foreignIncome?.incomes || [];
  const [incomes, setIncomes] = useState(existing.length ? existing : []);
  const [editing, setEditing] = useState(existing.length === 0 ? 0 : null);
  const [form, setForm] = useState(existing.length === 0 ? { ...EMPTY } : null);
  const [errors, setErrors] = useState({});

  const save = () => {
    if (!form?.country || !form?.amountINR) { setErrors({ _form: 'Country and amount are required' }); return; }
    const updated = [...incomes];
    updated[editing] = { ...form, amountINR: n(form.amountINR), taxPaidAbroad: n(form.taxPaidAbroad) };
    const v = validateForeignIncomeStep(updated);
    setErrors(v.valid ? {} : v.errors);
    setIncomes(updated); setForm(null); setEditing(null);
    onSave({ income: { foreignIncome: { incomes: updated } } });
  };

  const remove = (i) => {
    const updated = incomes.filter((_, idx) => idx !== i);
    setIncomes(updated);
    onSave({ income: { foreignIncome: { incomes: updated } } });
  };

  const total = incomes.reduce((s, inc) => s + n(inc.amountINR), 0);
  const dtaaCredit = incomes.filter(i => i.dtaa).reduce((s, inc) => s + n(inc.taxPaidAbroad), 0);

  return (
    <div>
      {incomes.map((inc, i) => editing === i ? null : (
        <FilingSection key={i} title={`${inc.country} — ${inc.incomeType}`} badge={<span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{n(inc.amountINR).toLocaleString('en-IN')}{inc.dtaa ? ' · DTAA' : ''}</span>}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={() => { setForm({ ...inc }); setEditing(i); }}><Edit2 size={13} /> Edit</Button>
            <Button variant="danger" onClick={() => remove(i)}><Trash2 size={13} /></Button>
          </div>
        </FilingSection>
      ))}

      {form && (
        <FilingSection title={editing < incomes.length ? 'Edit Income' : 'Add Foreign Income'}>
          <FilingGrid cols={3}>
            <FilingField label="Country" type="text" value={form.country} onChange={v => setForm({ ...form, country: v })} required />
            <FilingField label="Income Type" type="select" value={form.incomeType} onChange={v => setForm({ ...form, incomeType: v })} options={INCOME_TYPE_OPTIONS} />
            <FilingField label="Amount (INR)" type="currency" value={form.amountINR} onChange={v => setForm({ ...form, amountINR: v })} required />
          </FilingGrid>
          <FilingGrid cols={2}>
            <FilingField label="Tax Paid Abroad" type="currency" value={form.taxPaidAbroad} onChange={v => setForm({ ...form, taxPaidAbroad: v })} />
          </FilingGrid>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, margin: '6px 0', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.dtaa} onChange={e => setForm({ ...form, dtaa: e.target.checked })} /> Claim DTAA relief (avoid double taxation)
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="primary" onClick={save} disabled={isSaving} style={{ maxWidth: 120 }}>{isSaving ? 'Saving...' : 'Save'}</Button>
            <Button variant="secondary" onClick={() => { setForm(null); setEditing(null); }} style={{ maxWidth: 100 }}>Cancel</Button>
          </div>
        </FilingSection>
      )}

      {!form && (
        <Button variant="secondary" onClick={() => { setForm({ ...EMPTY }); setEditing(incomes.length); setErrors({}); }} style={{ marginTop: 8, maxWidth: 200 }}>
          <Plus size={13} /> Add Foreign Income
        </Button>
      )}

      {Object.keys(errors).length > 0 && (
        <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', borderRadius: 6, fontSize: 12, color: 'var(--color-error)' }}>
          <AlertCircle size={12} style={{ verticalAlign: -2, marginRight: 4 }} /> {Object.values(errors).join(' · ')}
        </div>
      )}

      {incomes.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          Total: ₹{total.toLocaleString('en-IN')}{dtaaCredit > 0 ? ` · DTAA Credit: ₹${dtaaCredit.toLocaleString('en-IN')}` : ''}
        </div>
      )}
    </div>
  );
}
