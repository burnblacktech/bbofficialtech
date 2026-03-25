/**
 * ITR-4 (Sugam) Filing Flow
 * Presumptive income + Salary + House Property + Other Income
 * Steps: Presumptive → Salary → House Property → Other Income → Deductions → Tax Summary → Review
 */

import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '../../../services/api';
import { tokens } from '../../../styles/tokens';
import toast from 'react-hot-toast';
import '../filing-flow.css';

import PresumptiveIncomeStep from './steps/PresumptiveIncomeStep';
import SalaryStep from '../ITR1/steps/SalaryStep';
import HousePropertyStep from '../ITR1/steps/HousePropertyStep';
import OtherIncomeStep from '../ITR1/steps/OtherIncomeStep';
import DeductionsStep from '../ITR1/steps/DeductionsStep';
import TaxSummaryStep from '../ITR1/steps/TaxSummaryStep';
import ReviewStep from '../ITR1/steps/ReviewStep';

const STEPS = [
  { id: 'presumptive', label: 'Presumptive Income', component: PresumptiveIncomeStep },
  { id: 'salary', label: 'Salary', component: SalaryStep },
  { id: 'house-property', label: 'House Property', component: HousePropertyStep },
  { id: 'other-income', label: 'Other Income', component: OtherIncomeStep },
  { id: 'deductions', label: 'Deductions', component: DeductionsStep },
  { id: 'tax-summary', label: 'Tax Summary', component: TaxSummaryStep },
  { id: 'review', label: 'Review', component: ReviewStep },
];

const ITR4Flow = () => {
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
    mutationFn: async () => { const res = await api.post(`/filings/${filingId}/itr4/compute`); return res.data.data; },
  });

  const saveAndNext = useCallback(async (updates) => {
    await saveMutation.mutateAsync(updates);
    if (currentStep < STEPS.length - 1) { setCurrentStep(currentStep + 1); window.scrollTo(0, 0); }
  }, [currentStep, saveMutation]);

  const goBack = () => { if (currentStep > 0) { setCurrentStep(currentStep - 1); window.scrollTo(0, 0); } };

  const handleDownloadJSON = async () => {
    try {
      const res = await api.get(`/filings/${filingId}/itr4/json`);
      const url = window.URL.createObjectURL(new Blob([JSON.stringify(res.data, null, 2)]));
      const a = document.createElement('a'); a.href = url; a.download = `ITR4_AY${filing?.assessmentYear || ''}.json`; a.click();
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
            <span>ITR-4 (Sugam) · AY {filing?.assessmentYear} · Step {currentStep + 1}/{STEPS.length}</span>
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
          itrType="ITR-4"
        />
      </div>
    </div>
  );
};

const Center = ({ children }) => (<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: tokens.colors.neutral[600] }}>{children}</div>);
function deepMerge(t, s) { const r = { ...t }; for (const k of Object.keys(s)) { if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k]) && t[k] && typeof t[k] === 'object') r[k] = deepMerge(t[k], s[k]); else r[k] = s[k]; } return r; }

export default ITR4Flow;
