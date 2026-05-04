import { useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { validateForeignIncomeStep } from '../../../../utils/itrValidation';
import { Field, Select, Grid, Card, Button, Money, Alert } from '../../../../components/ds';

const n = (v) => Number(v) || 0;
const EMPTY = { country: '', incomeType: 'salary', amountINR: '', taxPaidAbroad: '', dtaa: false };

const INCOME_TYPE_OPTIONS = [
  { value: 'salary', label: 'salary' },
  { value: 'interest', label: 'interest' },
  { value: 'dividend', label: 'dividend' },
  { value: 'capitalGains', label: 'capitalGains' },
  { value: 'rental', label: 'rental' },
  { value: 'other', label: 'other' },
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
      <h2 className="step-title">Income Earned Outside India</h2>
      <p className="step-desc">Income earned abroad and DTAA relief</p>

      {incomes.map((inc, i) => editing === i ? null : (
        <Card key={i}>
          <div className="ff-item">
            <div>
              <div className="ff-item-name">{inc.country} — {inc.incomeType}</div>
              <div className="ff-item-detail">₹{n(inc.amountINR).toLocaleString('en-IN')}{inc.dtaa ? ' · DTAA' : ''}</div>
            </div>
            <div className="ff-item-actions">
              <Button variant="ghost" size="sm" onClick={() => { setForm({ ...inc }); setEditing(i); }}><Edit2 size={15} /></Button>
              <Button variant="danger" size="sm" onClick={() => remove(i)}><Trash2 size={15} /></Button>
            </div>
          </div>
        </Card>
      ))}

      {form && (
        <Card active>
          <Grid cols={3}>
            <Field label="Country *" value={form.country} onChange={v => setForm({ ...form, country: v })} placeholder="e.g., USA" />
            <Select label="Income Type" value={form.incomeType} onChange={v => setForm({ ...form, incomeType: v })} options={INCOME_TYPE_OPTIONS} />
            <Field label="Amount in INR (₹) *" type="number" value={form.amountINR} onChange={v => setForm({ ...form, amountINR: v })} placeholder="0" />
          </Grid>
          <Grid cols={3}>
            <Field label="Tax Paid Abroad (₹)" type="number" value={form.taxPaidAbroad} onChange={v => setForm({ ...form, taxPaidAbroad: v })} placeholder="0" />
          </Grid>
          <label className="ff-check"><input type="checkbox" checked={form.dtaa} onChange={e => setForm({ ...form, dtaa: e.target.checked })} /> Claim DTAA relief</label>
          <div className="ds-hint" style={{ marginTop: 4 }}>If you earned abroad and paid tax there, you may claim DTAA relief to avoid double taxation</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button variant="primary" onClick={save} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
            <Button variant="secondary" onClick={() => { setForm(null); setEditing(null); }}>Cancel</Button>
          </div>
        </Card>
      )}

      {!form && (
        <Button variant="secondary" onClick={() => { setForm({ ...EMPTY }); setEditing(incomes.length); setErrors({}); }} style={{ marginTop: 8 }}>
          <Plus size={15} /> Add Foreign Income
        </Button>
      )}

      {Object.keys(errors).length > 0 && (
        <Alert variant="error" style={{ marginTop: 8 }}>
          <AlertCircle size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> {Object.values(errors).join(' · ')}
        </Alert>
      )}

      {incomes.length > 0 && (
        <Card muted>
          <Money label="Total Foreign Income" value={`₹${total.toLocaleString('en-IN')}`} bold />
          {dtaaCredit > 0 && <Money label="DTAA Credit" value={`₹${dtaaCredit.toLocaleString('en-IN')}`} color="green" />}
        </Card>
      )}
    </div>
  );
}
