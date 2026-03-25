/**
 * House Properties Step — ITR-2
 * Multiple properties (unlike ITR-1 which allows only one)
 */

import { useState } from 'react';
import { Home, Plus, Edit2, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import '../../filing-flow.css';

const EMPTY_PROPERTY = { type: 'SELF_OCCUPIED', annualRentReceived: '', municipalTaxesPaid: '', interestOnHomeLoan: '' };

const F = ({ l, v, c, h, t = 'number' }) => (
  <div className="ff-field">
    <label className="ff-label">{l}</label>
    <input className="ff-input" type={t} value={v || ''} onChange={e => c(e.target.value)} placeholder="0" />
    {h && <div className="ff-hint">{h}</div>}
  </div>
);

const HousePropertiesStep = ({ payload, onSave, onBack, isSaving }) => {
  const existing = payload?.income?.houseProperty?.properties || [];
  const [properties, setProperties] = useState(existing.length ? existing : []);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [noProperty, setNoProperty] = useState(existing.length === 0);

  const n = (v) => Number(v) || 0;

  const startAdd = () => { setForm({ ...EMPTY_PROPERTY }); setEditing(properties.length); setNoProperty(false); };
  const startEdit = (i) => { setForm({ ...properties[i] }); setEditing(i); };
  const cancelEdit = () => { setForm(null); setEditing(null); };

  const saveProperty = () => {
    const updated = [...properties];
    updated[editing] = {
      ...form,
      annualRentReceived: n(form.annualRentReceived),
      municipalTaxesPaid: n(form.municipalTaxesPaid),
      interestOnHomeLoan: n(form.interestOnHomeLoan),
    };
    setProperties(updated);
    setForm(null); setEditing(null);
  };

  const removeProperty = (i) => setProperties(properties.filter((_, idx) => idx !== i));

  const computeNet = (p) => {
    if (p.type === 'SELF_OCCUPIED') return -Math.min(n(p.interestOnHomeLoan), 200000);
    const nav = Math.max(0, n(p.annualRentReceived) - n(p.municipalTaxesPaid));
    return nav - Math.round(nav * 0.30) - n(p.interestOnHomeLoan);
  };

  const totalNet = properties.reduce((s, p) => s + computeNet(p), 0);

  const handleNext = () => {
    if (noProperty) {
      onSave({ income: { houseProperty: { properties: [], type: 'NONE' } } });
    } else {
      onSave({ income: { houseProperty: { properties } } });
    }
  };

  return (
    <div>
      <h2 className="step-title">House Properties</h2>
      <p className="step-desc">ITR-2 allows multiple properties. Add all your properties.</p>

      {noProperty && properties.length === 0 && (
        <div className="step-card" style={{ textAlign: 'center', padding: '32px' }}>
          <Home size={40} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#6b7280', marginBottom: '12px' }}>No house property? That's fine.</p>
          <button onClick={startAdd} className="ff-btn ff-btn-outline"><Plus size={16} /> Add a Property</button>
        </div>
      )}

      {/* Property List */}
      {properties.map((p, i) => editing === i ? null : (
        <div key={i} className="step-card">
          <div className="ff-item">
            <div>
              <p className="ff-item-name">Property {i + 1} — {p.type === 'SELF_OCCUPIED' ? 'Self-Occupied' : 'Let Out'}</p>
              <p className="ff-item-detail">Net: ₹{computeNet(p).toLocaleString('en-IN')}</p>
            </div>
            <div className="ff-item-actions">
              <button onClick={() => startEdit(i)} className="ff-btn ff-btn-ghost"><Edit2 size={16} /></button>
              <button onClick={() => removeProperty(i)} className="ff-btn ff-btn-danger"><Trash2 size={16} /></button>
            </div>
          </div>
        </div>
      ))}

      {/* Property Form */}
      {form && (
        <div className="step-card editing">
          <p className="ff-item-name" style={{ marginBottom: '12px' }}>Property {editing + 1}</p>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            {['SELF_OCCUPIED', 'LET_OUT'].map(t => (
              <div key={t} onClick={() => setForm({ ...form, type: t })} className={`ff-option ${form.type === t ? 'selected' : ''}`}>
                <p className="ff-option-label">{t === 'SELF_OCCUPIED' ? 'Self-Occupied' : 'Let Out'}</p>
              </div>
            ))}
          </div>

          {form.type === 'LET_OUT' && (
            <>
              <F l="Annual Rent Received (₹)" v={form.annualRentReceived} c={v => setForm({ ...form, annualRentReceived: v })} />
              <F l="Municipal Taxes Paid (₹)" v={form.municipalTaxesPaid} c={v => setForm({ ...form, municipalTaxesPaid: v })} />
            </>
          )}
          <F l="Home Loan Interest (₹)" v={form.interestOnHomeLoan} c={v => setForm({ ...form, interestOnHomeLoan: v })} h={form.type === 'SELF_OCCUPIED' ? 'Max ₹2L deduction' : 'No limit for let-out'} />

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button onClick={saveProperty} className="ff-btn ff-btn-primary">Save Property</button>
            <button onClick={cancelEdit} className="ff-btn ff-btn-outline">Cancel</button>
          </div>
        </div>
      )}

      {!form && !noProperty && (
        <button onClick={startAdd} className="ff-btn ff-btn-add"><Plus size={18} /> Add Property</button>
      )}

      {properties.length > 0 && (
        <div className="step-card summary">
          <div className="ff-row">
            <span className="ff-row-label">Total House Property Income</span>
            <span className={`ff-row-value bold ${totalNet < 0 ? 'green' : ''}`}>
              {totalNet < 0 ? `- ₹${Math.abs(totalNet).toLocaleString('en-IN')} (loss)` : `₹${totalNet.toLocaleString('en-IN')}`}
            </span>
          </div>
          {totalNet < -200000 && <p className="ff-hint" style={{ color: '#d97706', marginTop: '4px' }}>⚠ Loss exceeding ₹2L will be carried forward</p>}
        </div>
      )}

      <div className="ff-nav">
        <button onClick={onBack} className="ff-btn ff-btn-outline"><ArrowLeft size={16} /> Back</button>
        <div className="spacer" />
        <button onClick={handleNext} disabled={isSaving} className="ff-btn ff-btn-primary">{isSaving ? 'Saving...' : 'Next: Capital Gains'} <ArrowRight size={16} /></button>
      </div>
    </div>
  );
};

export default HousePropertiesStep;
