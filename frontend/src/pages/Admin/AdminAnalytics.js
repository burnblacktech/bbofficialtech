// =====================================================
// ADMIN ANALYTICS - MOBILE-FIRST ANALYTICS DASHBOARD
// Enterprise-grade analytics with real-time data visualization
// Using DesignSystem components for consistency with AdminDashboard
// =====================================================

import { useState, useMemo } from 'react';
import { useAdminAnalytics, useAdminCAAnalytics } from '../../features/admin/analytics/hooks/use-analytics';
import { Typography } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  IndianRupee,
  Calendar,
  Download,
  RefreshCw,
  Activity,
  Target,
  Zap,
  Clock,
  Building2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import useAdminDashboardRealtime from '../../hooks/useAdminDashboardRealtime';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import * as XLSX from 'xlsx';
import { OrientationPage } from '../../components/templates';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const COLORS = ['#D4AF37', '#8B7355', '#6B5B73', '#4A5568', '#2D3748'];

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [metricType, setMetricType] = useState('overview');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [showCustomDate, setShowCustomDate] = useState(false);

  // Real-time dashboard updates
  const { connectionStatus, isConnected, lastUpdate, refreshDashboard: refreshRealtime } = useAdminDashboardRealtime();

  // Fetch analytics data
  const { data: analyticsData, isLoading, error, refetch } = useAdminAnalytics(
    timeRange,
    metricType,
    customDateFrom || undefined,
    customDateTo || undefined,
  );

  const { data: caAnalytics } = useAdminCAAnalytics(
    timeRange,
    customDateFrom || undefined,
    customDateTo || undefined,
  );

  const overview = analyticsData?.overview || {};
  const trends = analyticsData?.trends || [];
  const topMetrics = analyticsData?.topMetrics || [];
  const userMetrics = analyticsData?.userMetrics || {};
  const filingMetrics = analyticsData?.filingMetrics || {};
  const revenueMetrics = analyticsData?.revenueMetrics || {};
  const charts = analyticsData?.charts || {};

  const handleRefresh = () => {
    refetch();
    refreshRealtime();
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return null;
    const secondsAgo = Math.floor((Date.now() - lastUpdate) / 1000);
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    return `${Math.floor(minutesAgo / 60)}h ago`;
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const data = [];

    if (metricType === 'overview') {
      data.push(['Metric', 'Value']);
      topMetrics.forEach(metric => {
        data.push([metric.name, metric.value]);
      });
    } else if (metricType === 'users') {
      data.push(['Metric', 'Value']);
      data.push(['Total Users', userMetrics.totalUsers || 0]);
      data.push(['Daily Active Users', userMetrics.dailyActive || 0]);
      data.push(['Weekly Active Users', userMetrics.weeklyActive || 0]);
      data.push(['Monthly Active Users', userMetrics.monthlyActive || 0]);
      data.push(['Retention Rate', `${userMetrics.retentionRate || 0}%`]);
    } else if (metricType === 'filings') {
      data.push(['Metric', 'Value']);
      data.push(['Total Filings', filingMetrics.totalFilings || 0]);
      data.push(['Completed', filingMetrics.completed || 0]);
      data.push(['In Progress', filingMetrics.inProgress || 0]);
      data.push(['Success Rate', `${filingMetrics.successRate || 0}%`]);
    } else if (metricType === 'revenue') {
      data.push(['Metric', 'Value']);
      data.push(['Total Revenue', formatCurrency(revenueMetrics.total || 0)]);
      data.push(['ARPU', formatCurrency(revenueMetrics.arpu || 0)]);
      data.push(['LTV', formatCurrency(revenueMetrics.ltv || 0)]);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analytics');
    XLSX.writeFile(wb, `analytics-${metricType}-${timeRange}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Prepare chart data
  const trendChartData = useMemo(() => {
    if (!trends || trends.length === 0) return [];

    const userTrend = trends.find(t => t.name === 'Users');
    const filingTrend = trends.find(t => t.name === 'Filings');
    const revenueTrend = trends.find(t => t.name === 'Revenue');

    const dates = new Set();
    [userTrend, filingTrend, revenueTrend].forEach(trend => {
      if (trend && trend.data) {
        trend.data.forEach(item => dates.add(item.date));
      }
    });

    return Array.from(dates).sort().map(date => ({
      date,
      users: userTrend?.data?.find(d => d.date === date)?.count || 0,
      filings: filingTrend?.data?.find(d => d.date === date)?.count || 0,
      revenue: revenueTrend?.data?.find(d => d.date === date)?.value || 0,
    }));
  }, [trends]);

  const tooltipStyle = {
    backgroundColor: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  };

  const tooltipStyleSimple = {
    backgroundColor: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
  };

  if (isLoading) {
    return (
      <PageTransition className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            <Typography.Body className="text-neutral-600">Loading analytics...</Typography.Body>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="text-center p-8 max-w-md">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-error-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-error-600" />
                </div>
                <Typography.H3 className="mb-2">Error Loading Analytics</Typography.H3>
                <Typography.Body className="text-neutral-600 mb-4">
                  Unable to load analytics data. Please try again.
                </Typography.Body>
                <Button onClick={handleRefresh} variant="primary">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header and Controls Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-xl hover:bg-neutral-100 active:scale-95 transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-neutral-700" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Typography.H1>Analytics</Typography.H1>
                {/* Connection Status Indicator */}
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <div className="flex items-center gap-1 text-success-600" title="Connected to live updates">
                      <Wifi className="w-4 h-4" />
                      <span className="text-body-small">Live</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-warning-600" title="Using polling updates">
                      <WifiOff className="w-4 h-4" />
                      <span className="text-body-small">Polling</span>
                    </div>
                  )}
                  {lastUpdate && (
                    <span className="text-body-small text-neutral-400">
                      Updated {formatLastUpdate()}
                    </span>
                  )}
                </div>
                <Typography.Body className="text-neutral-600">
                  Platform Insights & Performance Metrics
                </Typography.Body>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleExportCSV} variant="primary" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Time Range & Metric Type Selectors */}
          <div className="space-y-4 mb-8">
            {/* Time Range */}
            <div className="flex flex-wrap gap-2">
              {['7d', '30d', '90d', '1y'].map(range => (
                <button
                  key={range}
                  onClick={() => {
                    setTimeRange(range);
                    setShowCustomDate(false);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${timeRange === range && !showCustomDate
                    ? 'bg-primary-500 text-white shadow-elevation-1'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
                </button>
              ))}
              <button
                onClick={() => setShowCustomDate(!showCustomDate)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${showCustomDate
                  ? 'bg-primary-500 text-white shadow-elevation-1'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
              >
                <Calendar className="h-4 w-4" />
                Custom
              </button>
            </div>

            {showCustomDate && (
              <Card className="p-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="px-3 py-2 border border-neutral-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Typography.Small className="text-neutral-500">to</Typography.Small>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="px-3 py-2 border border-neutral-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Button
                    onClick={() => {
                      if (customDateFrom && customDateTo) {
                        setTimeRange('custom');
                        refetch();
                      }
                    }}
                    variant="primary"
                    size="sm"
                  >
                    Apply
                  </Button>
                </div>
              </Card>
            )}

            {/* Metric Type */}
            <div className="flex flex-wrap gap-2">
              {['overview', 'users', 'filings', 'revenue', 'ca'].map(type => (
                <button
                  key={type}
                  onClick={() => setMetricType(type)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${metricType === type
                    ? 'bg-secondary-500 text-white shadow-elevation-1'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                >
                  {type === 'ca' ? 'CA/B2B' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Overview Metrics */}
        {
          metricType === 'overview' && (
            <>
              {/* Key Performance Indicators */}
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StaggerItem>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Typography.Small className="text-neutral-600 mb-1">
                            Total Users
                          </Typography.Small>
                          <Typography.H3 className="text-heading-2 font-bold text-neutral-900">
                            {formatNumber(overview.totalUsers)}
                          </Typography.H3>
                          <div className="flex items-center mt-1">
                            {overview.userGrowth > 0 ? (
                              <TrendingUp className="h-3 w-3 text-success-600 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-error-600 mr-1" />
                            )}
                            <Typography.Small className={overview.userGrowth > 0 ? 'text-success-600' : 'text-error-600'}>
                              {Math.abs(overview.userGrowth || 0).toFixed(1)}%
                            </Typography.Small>
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>

                <StaggerItem>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Typography.Small className="text-neutral-600 mb-1">
                            Total Filings
                          </Typography.Small>
                          <Typography.H3 className="text-heading-2 font-bold text-neutral-900">
                            {formatNumber(overview.totalFilings)}
                          </Typography.H3>
                          <div className="flex items-center mt-1">
                            {overview.filingGrowth > 0 ? (
                              <TrendingUp className="h-3 w-3 text-success-600 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-error-600 mr-1" />
                            )}
                            <Typography.Small className={overview.filingGrowth > 0 ? 'text-success-600' : 'text-error-600'}>
                              {Math.abs(overview.filingGrowth || 0).toFixed(1)}%
                            </Typography.Small>
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-success-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>

                <StaggerItem>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Typography.Small className="text-neutral-600 mb-1">
                            Revenue
                          </Typography.Small>
                          <Typography.H3 className="text-heading-2 font-bold text-neutral-900">
                            {formatCurrency(overview.revenue)}
                          </Typography.H3>
                          <div className="flex items-center mt-1">
                            {overview.revenueGrowth > 0 ? (
                              <TrendingUp className="h-3 w-3 text-success-600 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-error-600 mr-1" />
                            )}
                            <Typography.Small className={overview.revenueGrowth > 0 ? 'text-success-600' : 'text-error-600'}>
                              {Math.abs(overview.revenueGrowth || 0).toFixed(1)}%
                            </Typography.Small>
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                          <IndianRupee className="w-6 h-6 text-secondary-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>

                <StaggerItem>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Typography.Small className="text-neutral-600 mb-1">
                            Active Users
                          </Typography.Small>
                          <Typography.H3 className="text-heading-2 font-bold text-neutral-900">
                            {formatNumber(overview.activeUsers)}
                          </Typography.H3>
                          <div className="flex items-center mt-1">
                            <Typography.Small className="text-neutral-500">
                              {overview.totalUsers > 0 ? ((overview.activeUsers / overview.totalUsers) * 100).toFixed(1) : 0}% of total
                            </Typography.Small>
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                          <Activity className="w-6 h-6 text-warning-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              </StaggerContainer>

              {/* Trends Chart */}
              {
                trendChartData.length > 0 && (
                  <StaggerItem>
                    <Card className="mb-8">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5 text-primary-600" />
                            <span>Trends</span>
                          </CardTitle>
                          <Typography.Small className="text-neutral-500">Last {timeRange}</Typography.Small>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={trendChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#737373" />
                            <YAxis tick={{ fontSize: 12 }} stroke="#737373" />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend />
                            <Area type="monotone" dataKey="users" stackId="1" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.6} name="Users" />
                            <Area type="monotone" dataKey="filings" stackId="1" stroke="#8B7355" fill="#8B7355" fillOpacity={0.6} name="Filings" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                )
              }

              {/* Top Metrics */}
              {
                topMetrics.length > 0 && (
                  <StaggerItem>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Target className="w-5 h-5 text-primary-600" />
                          <span>Top Metrics</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {topMetrics.map((metric, index) => (
                            <div key={metric.name || index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-secondary-100 rounded-xl flex items-center justify-center">
                                  <Typography.Small className="font-semibold text-secondary-600">{index + 1}</Typography.Small>
                                </div>
                                <Typography.Small className="font-medium text-neutral-700">{metric.name}</Typography.Small>
                              </div>
                              <Typography.Small className="font-semibold text-neutral-900">{metric.value}</Typography.Small>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                )
              }
            </>
          )}

        {/* User Metrics */}
        {
          metricType === 'users' && (
            <div className="space-y-6">
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StaggerItem>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Typography.Small className="text-neutral-600 mb-1">
                            New Users
                          </Typography.Small>
                          <Typography.H3 className="text-heading-2 font-bold text-neutral-900">
                            {formatNumber(userMetrics.newUsers)}
                          </Typography.H3>
                        </div>
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>

                <StaggerItem>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Typography.Small className="text-neutral-600 mb-1">
                            Retention Rate
                          </Typography.Small>
                          <Typography.H3 className="text-heading-2 font-bold text-neutral-900">
                            {(userMetrics.retentionRate || 0).toFixed(1)}%
                          </Typography.H3>
                        </div>
                        <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                          <Target className="w-6 h-6 text-success-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              </StaggerContainer>

              {/* User Activity Chart */}
              {userMetrics.acquisitionTrends && userMetrics.acquisitionTrends.length > 0 && (
                <StaggerItem>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-primary-600" />
                        <span>User Acquisition</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={userMetrics.acquisitionTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#737373" />
                          <YAxis tick={{ fontSize: 12 }} stroke="#737373" />
                          <Tooltip contentStyle={tooltipStyleSimple} />
                          <Line type="monotone" dataKey="count" stroke="#D4AF37" strokeWidth={2} dot={{ fill: '#D4AF37' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </StaggerItem>
              )}

              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-primary-600" />
                      <span>User Activity</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                        <Typography.Small className="text-neutral-600">Daily Active Users</Typography.Small>
                        <Typography.Small className="font-semibold text-neutral-900">{formatNumber(userMetrics.dailyActive)}</Typography.Small>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                        <Typography.Small className="text-neutral-600">Weekly Active Users</Typography.Small>
                        <Typography.Small className="font-semibold text-neutral-900">{formatNumber(userMetrics.weeklyActive)}</Typography.Small>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                        <Typography.Small className="text-neutral-600">Monthly Active Users</Typography.Small>
                        <Typography.Small className="font-semibold text-neutral-900">{formatNumber(userMetrics.monthlyActive)}</Typography.Small>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              {/* User Distribution Pie Chart */}
              {charts.userDistribution && charts.userDistribution.length > 0 && (
                <StaggerItem>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-primary-600" />
                        <span>User Distribution by Role</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <RechartsPieChart>
                          <Pie
                            data={charts.userDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {charts.userDistribution.map((entry) => (
                              <Cell key={`cell-${entry.name}`} fill={COLORS[charts.userDistribution.indexOf(entry) % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </StaggerItem>
              )}
            </div>
          )
        }

        {/* Filing Metrics */}
        {
          metricType === 'filings' && (
            <div className="space-y-6">
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StaggerItem>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Typography.Small className="text-neutral-600 mb-1">
                            Completed
                          </Typography.Small>
                          <Typography.H3 className="text-heading-2 font-bold text-neutral-900">
                            {formatNumber(filingMetrics.completed)}
                          </Typography.H3>
                        </div>
                        <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-success-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>

                <StaggerItem>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Typography.Small className="text-neutral-600 mb-1">
                            In Progress
                          </Typography.Small>
                          <Typography.H3 className="text-heading-2 font-bold text-neutral-900">
                            {formatNumber(filingMetrics.inProgress)}
                          </Typography.H3>
                        </div>
                        <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                          <Clock className="w-6 h-6 text-warning-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              </StaggerContainer>

              {/* Filing Trends Chart */}
              {
                filingMetrics.trends && filingMetrics.trends.length > 0 && (
                  <StaggerItem>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <BarChart3 className="w-5 h-5 text-primary-600" />
                          <span>Filing Trends</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={filingMetrics.trends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#737373" />
                            <YAxis tick={{ fontSize: 12 }} stroke="#737373" />
                            <Tooltip contentStyle={tooltipStyleSimple} />
                            <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                )
              }

              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-primary-600" />
                      <span>Filing Status</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                        <Typography.Small className="text-neutral-600">Pending</Typography.Small>
                        <Typography.Small className="font-semibold text-neutral-900">{formatNumber(filingMetrics.pending)}</Typography.Small>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                        <Typography.Small className="text-neutral-600">Success Rate</Typography.Small>
                        <Typography.Small className="font-semibold text-neutral-900">{(filingMetrics.successRate || 0).toFixed(1)}%</Typography.Small>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                        <Typography.Small className="text-neutral-600">Average Processing Time</Typography.Small>
                        <Typography.Small className="font-semibold text-neutral-900">{filingMetrics.averageCompletionTime || 0} days</Typography.Small>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              {/* Filing Status Distribution */}
              {
                charts.filingDistribution && charts.filingDistribution.length > 0 && (
                  <StaggerItem>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <BarChart3 className="w-5 h-5 text-primary-600" />
                          <span>Filing Status Distribution</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <RechartsPieChart>
                            <Pie
                              data={charts.filingDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {charts.filingDistribution.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={COLORS[charts.filingDistribution.indexOf(entry) % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                )
              }
            </div>
          )
        }

        {/* Revenue Metrics */}
        {
          metricType === 'revenue' && (
            <div className="space-y-6">
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StaggerItem>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Typography.Small className="text-neutral-600 mb-1">
                            Total Revenue
                          </Typography.Small>
                          <Typography.H3 className="text-heading-2 font-bold text-neutral-900">
                            {formatCurrency(revenueMetrics.total)}
                          </Typography.H3>
                        </div>
                        <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                          <IndianRupee className="w-6 h-6 text-secondary-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>

                <StaggerItem>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Typography.Small className="text-neutral-600 mb-1">
                            ARPU
                          </Typography.Small>
                          <Typography.H3 className="text-heading-2 font-bold text-neutral-900">
                            {formatCurrency(revenueMetrics.arpu)}
                          </Typography.H3>
                        </div>
                        <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                          <Zap className="w-6 h-6 text-success-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              </StaggerContainer>

              {/* Revenue Trends Chart */}
              {
                revenueMetrics.trends && revenueMetrics.trends.length > 0 && (
                  <StaggerItem>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <TrendingUp className="w-5 h-5 text-primary-600" />
                          <span>Revenue Trends</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <AreaChart data={revenueMetrics.trends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#737373" />
                            <YAxis tick={{ fontSize: 12 }} stroke="#737373" />
                            <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={tooltipStyleSimple} />
                            <Area type="monotone" dataKey="value" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.6} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                )
              }

              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <IndianRupee className="w-5 h-5 text-primary-600" />
                      <span>Revenue Breakdown</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                        <Typography.Small className="text-neutral-600">ITR Filing Fees</Typography.Small>
                        <Typography.Small className="font-semibold text-neutral-900">{formatCurrency(revenueMetrics.itrFees)}</Typography.Small>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                        <Typography.Small className="text-neutral-600">Consultation Fees</Typography.Small>
                        <Typography.Small className="font-semibold text-neutral-900">{formatCurrency(revenueMetrics.consultationFees)}</Typography.Small>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                        <Typography.Small className="text-neutral-600">Premium Services</Typography.Small>
                        <Typography.Small className="font-semibold text-neutral-900">{formatCurrency(revenueMetrics.premiumServices)}</Typography.Small>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                        <Typography.Small className="text-neutral-600">LTV (Lifetime Value)</Typography.Small>
                        <Typography.Small className="font-semibold text-neutral-900">{formatCurrency(revenueMetrics.ltv)}</Typography.Small>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              {/* Revenue Distribution */}
              {
                charts.revenueDistribution && charts.revenueDistribution.length > 0 && (
                  <StaggerItem>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <BarChart3 className="w-5 h-5 text-primary-600" />
                          <span>Revenue by Type</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <RechartsPieChart>
                            <Pie
                              data={charts.revenueDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {charts.revenueDistribution.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={COLORS[charts.revenueDistribution.indexOf(entry) % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                )
              }
            </div>
          )
        }

        {/* CA/B2B Metrics */}
        {
          metricType === 'ca' && caAnalytics && (
            <div className="space-y-6">
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StaggerItem>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Typography.Small className="text-neutral-600 mb-1">
                            Total CAs
                          </Typography.Small>
                          <Typography.H3 className="text-heading-2 font-bold text-neutral-900">
                            {formatNumber(caAnalytics.totalCAs)}
                          </Typography.H3>
                        </div>
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-primary-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>

                <StaggerItem>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Typography.Small className="text-neutral-600 mb-1">
                            Verified CAs
                          </Typography.Small>
                          <Typography.H3 className="text-heading-2 font-bold text-neutral-900">
                            {formatNumber(caAnalytics.verifiedCAs)}
                          </Typography.H3>
                        </div>
                        <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                          <Target className="w-6 h-6 text-success-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              </StaggerContainer>

              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-primary-600" />
                      <span>CA Metrics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                        <Typography.Small className="text-neutral-600">Active CAs</Typography.Small>
                        <Typography.Small className="font-semibold text-neutral-900">{formatNumber(caAnalytics.activeCAs)}</Typography.Small>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                        <Typography.Small className="text-neutral-600">New Registrations</Typography.Small>
                        <Typography.Small className="font-semibold text-neutral-900">{formatNumber(caAnalytics.newRegistrations)}</Typography.Small>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                        <Typography.Small className="text-neutral-600">Verification Rate</Typography.Small>
                        <Typography.Small className="font-semibold text-neutral-900">{(caAnalytics.verificationRate || 0).toFixed(1)}%</Typography.Small>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                        <Typography.Small className="text-neutral-600">B2B Revenue</Typography.Small>
                        <Typography.Small className="font-semibold text-neutral-900">{formatCurrency(caAnalytics.b2bRevenue)}</Typography.Small>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            </div>
          )
        }
      </div>
    </PageTransition>
  );
};

export default AdminAnalytics;
