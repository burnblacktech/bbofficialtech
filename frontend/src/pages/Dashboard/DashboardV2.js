import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Page, Spinner, Stack } from '../../design-system';
import { getDashboardSummary } from '../../services/financeService';
import api from '../../services/api';
import FinancialOverview from './components/FinancialOverview';
import IncomeBreakdown from './components/IncomeBreakdown';
import MonthlyTrend from './components/MonthlyTrend';
import TaxInsights from './components/TaxInsights';
import DeductionOptimizer from './components/DeductionOptimizer';
import QuickActions from './components/QuickActions';
import './dashboard-v2.css';

const FY_OPTIONS = ['2024-25', '2023-24', '2022-23'];

export default function DashboardV2() {
  const [fy, setFy] = useState('2024-25');

  const { data: raw, isLoading, isError } = useQuery({
    queryKey: ['dashboard-summary', fy],
    queryFn: () => getDashboardSummary(fy),
    retry: 1,
    retryDelay: 1000,
  });

  // Fetch real regime comparison from the latest draft filing (if one exists)
  const latestDraft = raw?.filings?.find(f => f.lifecycleState === 'draft');
  const { data: filingComp } = useQuery({
    queryKey: ['filing-compute', latestDraft?.id],
    queryFn: async () => {
      const itrType = latestDraft?.itrType || 'ITR-1';
      const ep = { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3', 'ITR-4': 'itr4' }[itrType] || 'itr1';
      const res = await api.post(`/filings/${latestDraft.id}/${ep}/compute`);
      return res.data.data;
    },
    enabled: !!latestDraft?.id,
    staleTime: 60000,
  });

  // Map backend shape to component expectations
  const data = useMemo(() => {
    if (!raw) return null;

    const totalIncome = raw.financialSummary?.totalIncome || 0;
    const totalDeductions = raw.financialSummary?.totalDeductions || 0;
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);

    // Build tax analysis from real filing computation, or fall back to backend estimate
    let taxAnalysis = null;
    if (filingComp?.oldRegime && filingComp?.newRegime) {
      taxAnalysis = {
        oldRegime: {
          taxable: filingComp.oldRegime.taxableIncome || filingComp.oldRegime.totalIncome || filingComp.oldRegime.grossTotalIncome || 0,
          total: filingComp.oldRegime.totalTax || filingComp.oldRegime.finalTaxLiability || 0,
        },
        newRegime: {
          taxable: filingComp.newRegime.taxableIncome || filingComp.newRegime.totalIncome || filingComp.newRegime.grossTotalIncome || 0,
          total: filingComp.newRegime.totalTax || filingComp.newRegime.finalTaxLiability || 0,
        },
        insights: [],
      };
    } else if (totalIncome > 0) {
      // No filing yet — show simple estimate (same for both since no deduction detail)
      const est = raw.financialSummary?.estimatedTax || 0;
      taxAnalysis = {
        oldRegime: { taxable: taxableIncome, total: est },
        newRegime: { taxable: totalIncome, total: est },
        insights: [{ type: 'info', title: 'Estimate only', description: 'Start a filing for accurate regime comparison with real tax slabs.' }],
      };
    }

    return {
      overview: { grossIncome: totalIncome, deductions: totalDeductions, taxableIncome, taxLiability: filingComp?.oldRegime?.totalTax || filingComp?.oldRegime?.finalTaxLiability || raw.financialSummary?.estimatedTax || 0 },
      monthlyTrend: raw.monthlyOverview || [],
      deductionOptimizer: (raw.investmentProgress || []).map(d => ({
        section: d.section, label: d.section, claimed: d.totalInvested || 0, limit: d.limit || 150000,
      })),
      incomeSources: (raw.monthlyOverview || []).some(m => m.income > 0) ? [
        { name: 'Salary', value: totalIncome },
      ] : [],
      taxAnalysis,
      filings: raw.filings || [],
    };
  }, [raw, filingComp]);

  if (isLoading) {
    return (
      <div className="dash-v2">
        <div className="dash-v2__header">
          <div>
            <h1 className="dash-v2__greeting">FY {fy} at a Glance</h1>
            <p className="dash-v2__subtitle">Loading your financial data...</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size="lg" /></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="dash-v2">
        <div className="dash-v2__header">
          <div>
            <h1 className="dash-v2__greeting">FY {fy} at a Glance</h1>
            <p className="dash-v2__subtitle">Something went wrong loading your data.</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: 14, color: 'var(--bb-fg-muted)', marginBottom: 12 }}>This could be a temporary issue. You can still file your ITR.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="ds-btn ds-btn-md ds-btn-primary" onClick={() => window.location.href = '/filing/start'}>File ITR</button>
            <button className="ds-btn ds-btn-md ds-btn-secondary" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = !data?.overview?.grossIncome && !data?.filings?.length;

  return (
    <div className="dash-v2">
      {/* Header */}
      <div className="dash-v2__header">
        <div>
          <h1 className="dash-v2__greeting">FY {fy} at a Glance</h1>
          <p className="dash-v2__subtitle">{isEmpty ? 'Get started by logging your income or filing your ITR.' : 'Track your income, deductions, and tax obligations.'}</p>
        </div>
        <select className="dash-v2__fy-select" value={fy} onChange={(e) => setFy(e.target.value)}>
          {FY_OPTIONS.map((y) => <option key={y} value={y}>FY {y}</option>)}
        </select>
      </div>

      {isEmpty && (
        <div style={{ background: 'var(--bb-bg-elevated)', border: '1px solid var(--bb-border)', borderRadius: 'var(--bb-radius-lg)', padding: 'var(--bb-space-6)', textAlign: 'center', marginBottom: 'var(--bb-space-5)' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 'var(--bb-fs-md)', fontWeight: 600, marginBottom: 4 }}>Welcome! Let's get your taxes sorted.</div>
          <p style={{ fontSize: 'var(--bb-fs-sm)', color: 'var(--bb-fg-muted)', marginBottom: 16, maxWidth: 400, margin: '0 auto 16px' }}>Start by filing your ITR or logging your income for the year. We'll track everything and compute your tax automatically.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="ds-btn ds-btn-md ds-btn-primary" onClick={() => window.location.href = '/filing/start'}>File ITR Now</button>
            <button className="ds-btn ds-btn-md ds-btn-secondary" onClick={() => window.location.href = '/finance/income'}>Log Income</button>
          </div>
        </div>
      )}

      <Stack gap="lg">
        {/* Financial Overview */}
        <FinancialOverview data={data?.overview} />

        {/* Charts */}
        <div className="dash-v2__grid-2">
          <IncomeBreakdown data={data?.incomeSources} />
          <MonthlyTrend data={data?.monthlyTrend} />
        </div>

        {/* Tax Insights */}
        <TaxInsights data={data?.taxAnalysis} />

        {/* Deductions + Quick Actions */}
        <div className="dash-v2__grid-2">
          <DeductionOptimizer data={data?.deductionOptimizer} />
          <QuickActions />
        </div>
      </Stack>
    </div>
  );
}
