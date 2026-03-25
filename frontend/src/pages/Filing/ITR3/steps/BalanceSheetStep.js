/**
 * Balance Sheet Step — ITR-3
 * Assets and Liabilities must balance
 */

import { useState } from 'react';
import { ArrowRight, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import '../../filing-flow.css';

const F = ({ l, v, c }) => (
  <div className="ff-field">
    <label className="ff-label">{l}</label>
    <input className="ff-input" type="number" value={v || ''} onChange={e => c(e.target.value)} placeholder="0" />
  </div>
);

const BalanceSheetStep = ({ payload, onSave, onBack, isSaving }) => {
  const bs = payload?.income?.business?.balanceSheet || {};
  const [data, setData] = useState({
    fixedAssets: bs.fixedAssets || '', currentAssets: bs.currentAssets || '',
    investments: bs.investments || '', otherAssets: bs.otherAssets || '',
    capital: bs.capital || '', reserves: bs.reserves || '',
    securedLoans: bs.securedLoans || '', unsecuredLoans: bs.unsecuredLoans || '',
    currentLiabilities: bs.currentLiabilities || '',
  });

  const n = (v) => Number(v) || 0;
  const totalAssets = n(data.fixedAssets) + n(data.currentAssets) + n(data.investments) + n(data.otherAssets);
  const totalLiabilities = n(data.capital) + n(data.reserves) + n(data.securedLoans) + n(data.unsecuredLoans) + n(data.currentLiabilities);
  const balanced = Math.abs(totalAssets - totalLiabilities) < 1;

  const handleNext = () => {
    const bsData = {};
    for (const [k, v] of Object.entries(data)) bsData[k] = n(v);
    onSave({ income: { business: { balanceSheet: bsData } } });
  };

  return (
    <div>
      <h2 className="step-title">Balance Sheet</h2>
      <p className="step-desc">Enter your business balance sheet as on March 31</p>

      <div className="ff-grid-2">
        {/* Assets */}
        <div className="step-card">
          <p className="ff-section-title">Assets</p>
          <F l="Fixed Assets" v={data.fixedAssets} c={v => setData({ ...data, fixedAssets: v })} />
          <F l="Current Assets" v={data.currentAssets} c={v => setData({ ...data, currentAssets: v })} />
          <F l="Investments" v={data.investments} c={v => setData({ ...data, investments: v })} />
          <F l="Other Assets" v={data.otherAssets} c={v => setData({ ...data, otherAssets: v })} />
          <div className="ff-divider" />
          <div className="ff-row">
            <span className="ff-row-label" style={{ fontWeight: 600 }}>Total Assets</span>
            <span className="ff-row-value bold">₹{totalAssets.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Liabilities */}
        <div className="step-card">
          <p className="ff-section-title">Liabilities & Capital</p>
          <F l="Capital / Owner's Equity" v={data.capital} c={v => setData({ ...data, capital: v })} />
          <F l="Reserves & Surplus" v={data.reserves} c={v => setData({ ...data, reserves: v })} />
          <F l="Secured Loans" v={data.securedLoans} c={v => setData({ ...data, securedLoans: v })} />
          <F l="Unsecured Loans" v={data.unsecuredLoans} c={v => setData({ ...data, unsecuredLoans: v })} />
          <F l="Current Liabilities" v={data.currentLiabilities} c={v => setData({ ...data, currentLiabilities: v })} />
          <div className="ff-divider" />
          <div className="ff-row">
            <span className="ff-row-label" style={{ fontWeight: 600 }}>Total Liabilities</span>
            <span className="ff-row-value bold">₹{totalLiabilities.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Balance check */}
      <div className={`step-card ${balanced ? 'success' : 'error'}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {balanced ? <CheckCircle size={20} color="#16a34a" /> : <AlertCircle size={20} color="#ef4444" />}
          <span style={{ fontWeight: 600, color: balanced ? '#14532d' : '#7f1d1d' }}>
            {balanced ? 'Balance sheet is balanced ✓' : `Difference: ₹${Math.abs(totalAssets - totalLiabilities).toLocaleString('en-IN')} — Assets and Liabilities must match`}
          </span>
        </div>
      </div>

      <div className="ff-nav">
        <button onClick={onBack} className="ff-btn ff-btn-outline"><ArrowLeft size={16} /> Back</button>
        <div className="spacer" />
        <button onClick={handleNext} disabled={isSaving} className="ff-btn ff-btn-primary">{isSaving ? 'Saving...' : 'Next'} <ArrowRight size={16} /></button>
      </div>
    </div>
  );
};

export default BalanceSheetStep;
