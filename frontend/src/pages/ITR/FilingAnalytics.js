// =====================================================
// FILING ANALYTICS PAGE
// Enhanced analytics dashboard with year-over-year comparison and trends
// =====================================================

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, IndianRupee, FileText, Calendar, Award, BarChart3, PieChart, LineChart } from 'lucide-react';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';
import { formatIndianCurrency } from '../../lib/format';
import { LineChart as RechartsLineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';
import Button from '../../components/DesignSystem/components/Button';
import StatusBadge from '../../components/DesignSystem/StatusBadge';

const FilingAnalytics = () => {
  const [years, setYears] = useState(5);
  const [assessmentYear, setAssessmentYear] = useState('');

  const { data: analytics, isLoading, isError, error } = useQuery({
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
      <div>
        <div className="text-center py-12">
          <BarChart3 className="w-8 h-8 animate-pulse text-primary-500 mx-auto mb-4" />
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <div className="bg-white rounded-xl shadow-elevation-1 border border-error-200 p-6">
          <p className="text-error-600">Failed to load analytics: {error?.message}</p>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.summary.totalFilings === 0) {
    return (
      <div>
        <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-heading-4 font-semibold text-slate-900 mb-2">No Filing Data Available</h3>
          <p className="text-body-regular text-slate-600">
            You need to file at least one ITR to see analytics.
          </p>
        </div>
      </div>
    );
  }

  const { summary, yearOverYear, taxSavings, trends, incomeTrends, deductionTrends, refundHistory, complianceScore } = analytics;

  // Prepare chart data
  const yoyChartData = yearOverYear.map(y => ({
    year: y.assessmentYear,
    income: y.totalIncome,
    deductions: y.totalDeductions,
    tax: y.totalTax,
    refund: y.refund,
  }));

  const incomeSourceData = incomeTrends.topSources.map(s => ({
    name: s.source.replace(/_/g, ' '),
    value: s.amount,
  }));

  const deductionCategoryData = deductionTrends.topCategories.map(c => ({
    name: c.category.replace(/_/g, ' '),
    value: c.amount,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div>
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-heading-2 sm:text-heading-1 font-bold text-slate-900 mb-2">Filing Analytics</h1>
          <p className="text-body-regular sm:text-body-large text-slate-600">
            Comprehensive insights into your tax filing history and trends
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info-50 rounded-xl">
                <FileText className="w-5 h-5 text-info-600" />
              </div>
              <div>
                <p className="text-body-regular text-slate-600">Total Filings</p>
                <p className="text-heading-2 font-bold text-slate-900">{summary.totalFilings}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success-50 rounded-xl">
                <IndianRupee className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="text-body-regular text-slate-600">Total Refund</p>
                <p className="text-heading-2 font-bold text-slate-900">
                  {formatIndianCurrency(summary.totalRefundReceived)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning-50 rounded-xl">
                <Award className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <p className="text-body-regular text-slate-600">Tax Saved</p>
                <p className="text-heading-2 font-bold text-slate-900">
                  {formatIndianCurrency(taxSavings.totalSavings)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-body-regular text-slate-600">Compliance Score</p>
                <p className="text-heading-2 font-bold text-slate-900">{complianceScore}/100</p>
              </div>
            </div>
          </div>
        </div>

        {/* Year-over-Year Comparison */}
        {yoyChartData.length > 0 && (
          <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6 mb-6">
            <h2 className="text-heading-4 font-semibold text-slate-900 mb-4">Year-over-Year Comparison</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={yoyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => formatIndianCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#0088FE" name="Income" />
                <Line type="monotone" dataKey="deductions" stroke="#00C49F" name="Deductions" />
                <Line type="monotone" dataKey="tax" stroke="#FF8042" name="Tax" />
                <Line type="monotone" dataKey="refund" stroke="#FFBB28" name="Refund" />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Income Sources */}
          {incomeSourceData.length > 0 && (
            <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6">
              <h2 className="text-heading-4 font-semibold text-slate-900 mb-4">Top Income Sources</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={incomeSourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
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
          )}

          {/* Deduction Categories */}
          {deductionCategoryData.length > 0 && (
            <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6">
              <h2 className="text-heading-4 font-semibold text-slate-900 mb-4">Top Deduction Categories</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={deductionCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deductionCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatIndianCurrency(value)} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Trends */}
        <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6 mb-6">
          <h2 className="text-heading-4 font-semibold text-slate-900 mb-4">Filing Trends</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-body-regular text-slate-600 mb-1">Filing Frequency</p>
              <p className="text-body-large font-semibold text-slate-900">{trends.filingFrequency || 'N/A'}</p>
            </div>
            <div>
              <p className="text-body-regular text-slate-600 mb-1">On-Time Filing Rate</p>
              <p className="text-body-large font-semibold text-slate-900">{trends.onTimeFilingRate || 0}%</p>
            </div>
            <div>
              <p className="text-body-regular text-slate-600 mb-1">Refund Trend</p>
              <div className="flex items-center gap-2">
                {trends.refundTrend === 'increasing' && <TrendingUp className="w-5 h-5 text-success-600" />}
                {trends.refundTrend === 'decreasing' && <TrendingDown className="w-5 h-5 text-error-600" />}
                <p className="text-body-large font-semibold text-slate-900 capitalize">
                  {trends.refundTrend || 'stable'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Refund History */}
        {refundHistory.history && refundHistory.history.length > 0 && (
          <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6">
            <h2 className="text-heading-4 font-semibold text-slate-900 mb-4">Refund History</h2>
            <div className="space-y-3">
              {refundHistory.history.slice(0, 5).map((refund, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                  <div>
                    <p className="text-body-regular font-medium text-slate-900">
                      AY {refund.assessmentYear}
                    </p>
                    <p className="text-body-small text-slate-500">
                      {new Date(refund.statusDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-body-regular font-semibold text-success-600">
                      {formatIndianCurrency(refund.amount)}
                    </p>
                    <StatusBadge status={refund.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};

export default FilingAnalytics;

