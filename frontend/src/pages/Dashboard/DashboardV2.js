import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Page, Spinner, Stack } from '../../design-system';
import { getDashboardSummary } from '../../services/financeService';
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

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary', fy],
    queryFn: () => getDashboardSummary(fy),
  });

  if (isLoading) {
    return <Page><div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size="lg" /></div></Page>;
  }

  return (
    <div className="dash-v2">
      {/* Header */}
      <div className="dash-v2__header">
        <div>
          <h1 className="dash-v2__greeting">FY {fy} at a Glance</h1>
          <p className="dash-v2__subtitle">Track your income, deductions, and tax obligations.</p>
        </div>
        <select className="dash-v2__fy-select" value={fy} onChange={(e) => setFy(e.target.value)}>
          {FY_OPTIONS.map((y) => <option key={y} value={y}>FY {y}</option>)}
        </select>
      </div>

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
