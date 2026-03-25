/**
 * ITR-3 Filing Flow
 * Business/Profession with regular books
 * Steps: Business P&L → Balance Sheet → Salary → House Properties → Capital Gains → Other Income → Foreign Income → Deductions → Tax Summary → Review
 */

import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '../../../services/api';
import { tokens } from '../../../styles/tokens';
import toast from 'react-hot-toast';
import '../filing-flow.css';

import BusinessIncomeStep from './steps/BusinessIncomeStep';
import BalanceSheetStep from './steps/BalanceSheetStep';
import SalaryStep from '../ITR1/steps/SalaryStep';
import HousePropertiesStep from '../ITR2/steps/HousePropertiesStep';
import CapitalGainsStep from '../ITR2/steps/CapitalGainsStep';
import OtherIncomeStep from '../ITR1/steps/OtherIncomeStep';
import ForeignIncomeStep from '../ITR2/steps/ForeignIncomeStep';
import DeductionsStep from '../ITR1/steps/DeductionsStep';
import ITR2TaxSummaryStep from '../ITR2/steps/ITR2TaxSummaryStep';
import ITR2ReviewStep from '../ITR2/steps/ITR2ReviewStep';

const STEPS = [
  { id: 'business', label: 'Business P&L', component: BusinessIncomeStep },
  { id: 'balance-sheet', label: 'Balance Sheet', component: BalanceSheetStep },
  { id: 'salary', label: 'Salary', component: SalaryStep },
  { id: 'house-property', label: 'House Properties', component: HousePropertiesStep },
  { id: 'capital-gains', label: 'Capital Gains', component: CapitalGainsStep },
  { id: 'other-income', label: 'Other Income', component: OtherIncomeStep },
  { id: 'foreign-income', label: 'Foreign Income', component: ForeignIncomeStep },
  { id: 'deductions', label: 'Deductions', component: DeductionsStep },
  { id: 'tax-summary', label: 'Tax Summary', component: ITR2TaxSummaryStep },
  { id: 'review', label: 'Review', component: ITR2ReviewStep },
];

const ITR3Flow = () => {
  const { filingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);

  const { data: filing, isLoading, error } = useQuery({
    queryKey: ['filing', filingId],
    queryFn: async () => { const res = await api.get(`/filings/${filingId}`); return res.data.data; },
  });

  const saveMutation = useMutation({
    mutationFn: async (updates) => {
      const merged = deepMerge(filing?.jsonPayload || {}, updates);
      await api.put(`/filings/${filingId}`, { jsonPayload: merged });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['filing', filingId] }),
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save'),
  });

  const computeMutation = useMutation({
    mutationFn: async () => { const res = await api.post(`/filings/${filingId}/itr3/compute`); return res.data.data; },
  });

  const saveAndNext = useCallback(async (updates) => {
    await saveMutation.mutateAsync(updates);
    if (currentStep < STEPS.length - 1) { setCurrentStep(currentStep + 1); window.scrollTo(0, 0); }
  }, [currentStep, saveMutation]);

  const goBack = () => { if (currentStep > 0) { setCurrentStep(currentStep - 1); window.scrollTo(0, 0); } };

  const handleDownloadJSON = async () => {
    try {
      const res = await api.get(`/filings/${filingId}/itr3/json`);
      const url = window.URL.createObjectURL(new Blob([JSON.stringify(res.data, null, 2)]));
      const a = document.createElement('a'); a.href = url; a.download = `ITR3_AY${filing?.assessmentYear || ''}.json`; a.click();
      toast.success('JSON downloaded');
    } catch { toast.error('Failed to download'); }
  };

  if (isLoading) return <Center><Loader2 size={32} className="animate-spin" /> Loading...</Center>;
  if (error) return <Center>Failed to load filing.</Center>;

  const payload = filing?.jsonPayload || {};
  const StepComponent = STEPS[currentStep].component;

  return (
    <div className="ff-page">
      <div className="ff-progress">
        <div className="ff-progress-inner">
          <div className="ff-meta">
            <span>ITR-3 · AY {filing?.assessmentYear} · Step {currentStep + 1}/{STEPS.length}</span>
            <span>{Math.round(((currentStep + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div className="ff-progress-bar">
            {STEPS.map((s, i) => (
              <div key={s.id} className={`ff-progress-seg ${i <= currentStep ? 'active' : ''}`}
                onClick={() => i <= currentStep && setCurrentStep(i)} title={s.label} />
            ))}
          </div>
        </div>
      </div>
      <div className="ff-content">
        <StepComponent
          payload={payload} filing={filing} onSave={saveAndNext} onBack={goBack}
          onCompute={() => computeMutation.mutateAsync()} computation={computeMutation.data}
          isComputing={computeMutation.isPending} isSaving={saveMutation.isPending}
          onDownloadJSON={handleDownloadJSON} isFirstStep={currentStep === 0} isLastStep={currentStep === STEPS.length - 1}
          itrType="ITR-3"
        />
      </div>
    </div>
  );
};

const Center = ({ children }) => (<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: tokens.colors.neutral[600] }}>{children}</div>);
function deepMerge(t, s) { const r = { ...t }; for (const k of Object.keys(s)) { if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k]) && t[k] && typeof t[k] === 'object') r[k] = deepMerge(t[k], s[k]); else r[k] = s[k]; } return r; }

export default ITR3Flow;
