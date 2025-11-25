// =====================================================
// ADMIN ANALYTICS - MOBILE-FIRST ANALYTICS DASHBOARD
// Enterprise-grade analytics with real-time data visualization
// =====================================================

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  ArrowLeft,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  Activity,
  Target,
  Zap,
  Clock,
} from 'lucide-react';

const AdminAnalytics = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('30d');
  const [metricType, setMetricType] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch analytics data
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['adminAnalytics', timeRange, metricType, refreshKey],
    queryFn: async () => {
      const response = await api.get(`/admin/analytics?timeRange=${timeRange}&type=${metricType}`);
      return response.data;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  const overview = analyticsData?.overview || {};
  const trends = analyticsData?.trends || [];
  const topMetrics = analyticsData?.topMetrics || [];
  const userMetrics = analyticsData?.userMetrics || {};
  const filingMetrics = analyticsData?.filingMetrics || {};
  const revenueMetrics = analyticsData?.revenueMetrics || {};

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-burnblack-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="loading-spinner"></div>
          <p className="text-sm text-neutral-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-burnblack-white flex items-center justify-center p-4">
        <div className="dashboard-card-burnblack text-center p-8">
          <BarChart3 className="h-12 w-12 text-error-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-burnblack-black mb-2">Error Loading Analytics</h3>
          <p className="text-neutral-600 mb-4">Unable to load analytics data.</p>
          <button onClick={handleRefresh} className="btn-burnblack">
            <RefreshCw className="h-4 w-4 inline mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-burnblack-white">
      {/* Mobile Header */}
      <header className="header-burnblack sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.history.back()}
                className="p-2 rounded-lg hover:bg-neutral-100 active:scale-95 transition-transform"
              >
                <ArrowLeft className="h-5 w-5 text-burnblack-black" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-burnblack-black">Analytics</h1>
                <p className="text-xs text-neutral-500">Platform Insights</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg hover:bg-neutral-100 active:scale-95 transition-transform"
              >
                <RefreshCw className="h-5 w-5 text-burnblack-black" />
              </button>
              <button className="p-2 rounded-lg hover:bg-neutral-100 active:scale-95 transition-transform">
                <Download className="h-5 w-5 text-burnblack-black" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 space-y-6">
        {/* Time Range & Metric Type Selectors */}
        <div className="space-y-3">
          {/* Time Range */}
          <div className="flex space-x-2">
            {['7d', '30d', '90d', '1y'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-burnblack-gold text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>

          {/* Metric Type */}
          <div className="flex space-x-2">
            {['overview', 'users', 'filings', 'revenue'].map(type => (
              <button
                key={type}
                onClick={() => setMetricType(type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  metricType === type
                    ? 'bg-burnblack-gold text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Metrics */}
        {metricType === 'overview' && (
          <>
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-2 gap-3">
              <div className="stat-card-burnblack">
                <div className="stat-icon-burnblack">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-600">Total Users</p>
                  <p className="text-lg font-bold text-burnblack-black">{formatNumber(overview.totalUsers)}</p>
                  <div className="flex items-center mt-1">
                    {overview.userGrowth > 0 ? (
                      <TrendingUp className="h-3 w-3 text-success-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-error-600 mr-1" />
                    )}
                    <span className={`text-xs ${overview.userGrowth > 0 ? 'text-success-600' : 'text-error-600'}`}>
                      {Math.abs(overview.userGrowth || 0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="stat-card-burnblack">
                <div className="stat-icon-burnblack">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-600">Total Filings</p>
                  <p className="text-lg font-bold text-burnblack-black">{formatNumber(overview.totalFilings)}</p>
                  <div className="flex items-center mt-1">
                    {overview.filingGrowth > 0 ? (
                      <TrendingUp className="h-3 w-3 text-success-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-error-600 mr-1" />
                    )}
                    <span className={`text-xs ${overview.filingGrowth > 0 ? 'text-success-600' : 'text-error-600'}`}>
                      {Math.abs(overview.filingGrowth || 0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="stat-card-burnblack">
                <div className="stat-icon-burnblack">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-600">Revenue</p>
                  <p className="text-lg font-bold text-burnblack-black">{formatCurrency(overview.revenue)}</p>
                  <div className="flex items-center mt-1">
                    {overview.revenueGrowth > 0 ? (
                      <TrendingUp className="h-3 w-3 text-success-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-error-600 mr-1" />
                    )}
                    <span className={`text-xs ${overview.revenueGrowth > 0 ? 'text-success-600' : 'text-error-600'}`}>
                      {Math.abs(overview.revenueGrowth || 0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="stat-card-burnblack">
                <div className="stat-icon-burnblack">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-600">Active Users</p>
                  <p className="text-lg font-bold text-burnblack-black">{formatNumber(overview.activeUsers)}</p>
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-neutral-500">
                      {((overview.activeUsers / overview.totalUsers) * 100).toFixed(1)}% of total
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trends Chart Placeholder */}
            <div className="dashboard-card-burnblack">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-burnblack-black">Trends</h2>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-neutral-400" />
                  <span className="text-xs text-neutral-500">Last {timeRange}</span>
                </div>
              </div>

              <div className="h-48 bg-neutral-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">Chart visualization</p>
                  <p className="text-xs text-neutral-400">Coming soon</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* User Metrics */}
        {metricType === 'users' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="stat-card-burnblack">
                <div className="stat-icon-burnblack">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-600">New Users</p>
                  <p className="text-lg font-bold text-burnblack-black">{formatNumber(userMetrics.newUsers)}</p>
                </div>
              </div>

              <div className="stat-card-burnblack">
                <div className="stat-icon-burnblack">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-600">Retention Rate</p>
                  <p className="text-lg font-bold text-burnblack-black">{userMetrics.retentionRate || 0}%</p>
                </div>
              </div>
            </div>

            <div className="dashboard-card-burnblack">
              <h2 className="text-lg font-semibold text-burnblack-black mb-4">User Activity</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Daily Active Users</span>
                  <span className="text-sm font-semibold text-burnblack-black">{formatNumber(userMetrics.dailyActive)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Weekly Active Users</span>
                  <span className="text-sm font-semibold text-burnblack-black">{formatNumber(userMetrics.weeklyActive)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Monthly Active Users</span>
                  <span className="text-sm font-semibold text-burnblack-black">{formatNumber(userMetrics.monthlyActive)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filing Metrics */}
        {metricType === 'filings' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="stat-card-burnblack">
                <div className="stat-icon-burnblack">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-600">Completed</p>
                  <p className="text-lg font-bold text-burnblack-black">{formatNumber(filingMetrics.completed)}</p>
                </div>
              </div>

              <div className="stat-card-burnblack">
                <div className="stat-icon-burnblack">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-600">In Progress</p>
                  <p className="text-lg font-bold text-burnblack-black">{formatNumber(filingMetrics.inProgress)}</p>
                </div>
              </div>
            </div>

            <div className="dashboard-card-burnblack">
              <h2 className="text-lg font-semibold text-burnblack-black mb-4">Filing Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Pending</span>
                  <span className="text-sm font-semibold text-burnblack-black">{formatNumber(filingMetrics.pending)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Success Rate</span>
                  <span className="text-sm font-semibold text-burnblack-black">{filingMetrics.successRate || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Average Processing Time</span>
                  <span className="text-sm font-semibold text-burnblack-black">{filingMetrics.avgProcessingTime || 0} days</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Metrics */}
        {metricType === 'revenue' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="stat-card-burnblack">
                <div className="stat-icon-burnblack">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-600">Total Revenue</p>
                  <p className="text-lg font-bold text-burnblack-black">{formatCurrency(revenueMetrics.total)}</p>
                </div>
              </div>

              <div className="stat-card-burnblack">
                <div className="stat-icon-burnblack">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-600">ARPU</p>
                  <p className="text-lg font-bold text-burnblack-black">{formatCurrency(revenueMetrics.arpu)}</p>
                </div>
              </div>
            </div>

            <div className="dashboard-card-burnblack">
              <h2 className="text-lg font-semibold text-burnblack-black mb-4">Revenue Breakdown</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">ITR Filing Fees</span>
                  <span className="text-sm font-semibold text-burnblack-black">{formatCurrency(revenueMetrics.itrFees)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Consultation Fees</span>
                  <span className="text-sm font-semibold text-burnblack-black">{formatCurrency(revenueMetrics.consultationFees)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Premium Services</span>
                  <span className="text-sm font-semibold text-burnblack-black">{formatCurrency(revenueMetrics.premiumServices)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Metrics */}
        <div className="dashboard-card-burnblack">
          <h2 className="text-lg font-semibold text-burnblack-black mb-4">Top Metrics</h2>
          <div className="space-y-3">
            {topMetrics.length === 0 ? (
              <div className="text-center py-4">
                <BarChart3 className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">No metrics available</p>
              </div>
            ) : (
              topMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-burnblack-gold bg-opacity-20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-burnblack-gold">{index + 1}</span>
                    </div>
                    <span className="text-sm font-medium text-burnblack-black">{metric.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-burnblack-black">{metric.value}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;
