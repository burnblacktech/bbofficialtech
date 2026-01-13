// =====================================================
// FILING ANALYTICS PAGE
// Enhanced analytics dashboard with year-over-year comparison and trends
// =====================================================

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, IndianRupee, FileText, Calendar, Award, BarChart3, PieChart, LineChart, RefreshCw } from 'lucide-react';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';
import { formatIndianCurrency } from '../../lib/format';
import { LineChart as RechartsLineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '../../utils';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const FilingAnalytics = () => {
  const [years, setYears] = useState(5);
  const [assessmentYear, setAssessmentYear] = useState('');

  const { data: analytics, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['filingAnalytics', { years, assessmentYear }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (years) params.append('years', years);
      if (assessmentYear) params.append('assessmentYear', assessmentYear);

      const response = await apiClient.get(`/itr/analytics?${params.toString()}`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <BarChart3 className="w-12 h-12 animate-pulse text-primary-500 mb-4" />
        <p className="text-slate-600 font-medium">Loading your financial story...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-error-50 text-error-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <TrendingDown className="w-8 h-8" />
          </div>
          <h2 className="text-heading-3 font-bold text-slate-900 mb-2">Analytics Unavailable</h2>
          <p className="text-slate-600 mb-8">
            {error?.message || "We couldn't load your analytics right now."}
          </p>
          <Button variant="primary" onClick={() => refetch()} className="w-full">
            Retry Loading
          </Button>
        </Card>
      </div>
    );
  }

  if (!analytics || !analytics.summary || analytics.summary.totalFilings === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h2 className="text-heading-3 font-bold text-slate-900 mb-2">No Filings Found</h2>
          <p className="text-slate-600 mb-8">
            Complete your first filing to unlock powerful financial insights and trends.
          </p>
          <Button variant="primary" onClick={() => window.location.href = '/itr/start'} className="w-full">
            Start First Filing
          </Button>
        </Card>
      </div>
    );
  }

  const { summary, yearOverYear, taxSavings, trends, incomeTrends, deductionTrends, refundHistory, complianceScore } = analytics;

  const COLORS = ['var(--s29-primary)', 'var(--s29-success)', 'var(--s29-warning)', 'var(--s29-error)', 'var(--s29-info)'];

  // Map chart data
  const yoyChartData = (yearOverYear || []).map(y => ({
    year: y.assessmentYear,
    income: y.totalIncome,
    deductions: y.totalDeductions,
    tax: y.totalTax,
    refund: y.refund,
  }));

  const incomeSourceData = (incomeTrends?.topSources || []).map(s => ({
    name: (s.source || 'Other').replace(/_/g, ' '),
    value: s.amount,
  }));

  const deductionCategoryData = (deductionTrends?.topCategories || []).map(c => ({
    name: (c.category || 'Other').replace(/_/g, ' '),
    value: c.amount,
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-display-sm font-bold text-slate-900 mb-2">Filing Analytics</h1>
            <p className="text-body-large text-slate-600 max-w-2xl">
              A high-fidelity view of your tax evolution, compliance health, and saving trends.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => refetch()} icon={<RefreshCw className="w-4 h-4" />}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Filings</p>
                <h3 className="text-display-xs font-bold text-slate-900">{summary.totalFilings}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Refund</p>
                <h3 className="text-display-xs font-bold text-success-600">{formatIndianCurrency(summary.totalRefundReceived)}</h3>
              </div>
              <div className="p-3 bg-success-50 text-success-600 rounded-2xl">
                <IndianRupee className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Tax Savings</p>
                <h3 className="text-display-xs font-bold text-warning-600">{formatIndianCurrency(taxSavings?.totalSavings || 0)}</h3>
              </div>
              <div className="p-3 bg-warning-50 text-warning-600 rounded-2xl">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Compliance</p>
                <h3 className="text-display-xs font-bold text-primary-600">{complianceScore}/100</h3>
              </div>
              <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <Card className="lg:col-span-2 p-8">
            <h4 className="text-heading-4 font-bold text-slate-900 mb-8">Performance History</h4>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={yoyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(value) => `₹${value / 1000}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => formatIndianCurrency(value)}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                  <Line type="monotone" dataKey="income" stroke="var(--s29-primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Income" />
                  <Line type="monotone" dataKey="tax" stroke="var(--s29-error)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Tax" />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-8">
            <h4 className="text-heading-4 font-bold text-slate-900 mb-8">Income Mix</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={incomeSourceData}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {incomeSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatIndianCurrency(value)} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-3">
              {incomeSourceData.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="text-slate-600">{s.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatIndianCurrency(s.value)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <Card className="p-8">
            <h4 className="text-heading-4 font-bold text-slate-900 mb-6">Filing Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Frequency</p>
                <p className="text-body-large font-bold text-slate-900">{trends.filingFrequency || 'N/A'}</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">On-Time</p>
                <p className="text-body-large font-bold text-success-600">{trends.onTimeFilingRate || 0}%</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Refund Trend</p>
                <div className="flex items-center gap-2 mt-1">
                  {trends.refundTrend === 'increasing' ? (
                    <TrendingUp className="w-5 h-5 text-success-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-error-600" />
                  )}
                  <span className="text-sm font-bold capitalize">{trends.refundTrend || 'Stable'}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h4 className="text-heading-4 font-bold text-slate-900 mb-6">Recent Refunds</h4>
            <div className="space-y-4">
              {(refundHistory?.history || []).slice(0, 4).map((refund, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-success-50 text-success-600 rounded-xl flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">AY {refund.assessmentYear}</p>
                      <p className="text-xs text-slate-500">{new Date(refund.statusDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-body-large font-bold text-success-600">{formatIndianCurrency(refund.amount)}</p>
                </div>
              ))}
              {(!refundHistory?.history || refundHistory.history.length === 0) && (
                <p className="text-center py-6 text-slate-500 italic">No refund history available.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FilingAnalytics;
