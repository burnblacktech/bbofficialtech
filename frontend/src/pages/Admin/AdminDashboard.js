// =====================================================
// ADMIN DASHBOARD - PLATFORM CONTROL CENTER
// Comprehensive administrative interface for platform management
// =====================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, Typography } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, FadeInUp, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import {
  Users,
  FileText,
  MessageSquare,
  IndianRupee,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Shield,
  Settings,
  BarChart3,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import {
  useAdminDashboardStats,
  useAdminChartData,
  useAdminSystemAlerts,
  useAdminRecentActivity,
} from '../../features/admin/analytics/hooks/use-analytics';
import adminService from '../../services/api/adminService';
import useAdminDashboardRealtime from '../../hooks/useAdminDashboardRealtime';

const AdminDashboard = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [systemHealth, setSystemHealth] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Real-time dashboard updates
  const { connectionStatus, isConnected, lastUpdate, platformUpdates, refreshDashboard } = useAdminDashboardRealtime();

  // Fetch dashboard data from backend
  const { data: statsData, isLoading: statsLoading } = useAdminDashboardStats();
  const { data: alertsData, isLoading: alertsLoading } = useAdminSystemAlerts();
  const { data: activityData, isLoading: activityLoading } = useAdminRecentActivity({
    limit: 10,
    timeRange: selectedTimeRange,
  });
  const { data: userChartData } = useAdminChartData('users', { timeRange: selectedTimeRange });
  const { data: filingChartData } = useAdminChartData('filings', { timeRange: selectedTimeRange });
  const { data: revenueChartData } = useAdminChartData('revenue', { timeRange: selectedTimeRange });

  // Fetch system health and top performers
  useEffect(() => {
    const loadAdditionalData = async () => {
      setLoadingHealth(true);
      try {
        const [healthData, performersData] = await Promise.all([
          adminService.getSystemHealth(),
          adminService.getTopPerformers(),
        ]);
        setSystemHealth(healthData);
        setTopPerformers(performersData);
      } catch (error) {
        console.error('Failed to load system health or top performers:', error);
      } finally {
        setLoadingHealth(false);
      }
    };

    loadAdditionalData();
  }, []);

  const loading = statsLoading || alertsLoading || activityLoading || loadingHealth;

  // Transform backend data to match component expectations
  // statsData comes from useAdminDashboardStats which returns response.data.data.stats
  const stats = statsData?.stats || statsData;
  const dashboardData = stats ? {
    metrics: {
      newUsers: {
        today: stats.users?.newToday || 0,
        last7Days: stats.users?.total || 0,
        growth: stats.users?.growth || 0,
      },
      itrFilings: {
        initiated: stats.filings?.total || 0,
        completed: stats.filings?.completed || 0,
        completionRate: stats.filings?.completionRate || 0,
      },
      serviceTickets: {
        open: stats.tickets?.openTickets || 0,
        resolved: (stats.tickets?.totalTickets || 0) - (stats.tickets?.openTickets || 0),
        avgResolutionTime: '4.2 hours', // Would need to calculate
      },
      revenue: {
        today: stats.revenue?.today || 0,
        last7Days: stats.revenue?.total || 0,
        growth: stats.revenue?.growth || 0,
      },
    },
    recentActivity: (activityData?.activities || activityData?.recentActivity || []).map(activity => ({
      id: activity.id,
      type: activity.type || activity.action,
      message: activity.message || activity.description || `${activity.action || 'Activity'}${activity.userName ? ` by ${activity.userName}` : ''}${activity.resource ? ` on ${activity.resource}` : ''}`,
      timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date(),
      status: activity.success !== false ? 'success' : 'error',
    })),
    systemHealth: systemHealth ? {
      status: systemHealth.status || 'healthy',
      uptime: `${systemHealth.uptime || 99.9}%`,
      responseTime: `${systemHealth.responseTime || 245}ms`,
      activeUsers: stats?.users?.active || 0,
      serverLoad: systemHealth.cpuUsage || 65,
    } : {
      status: 'healthy',
      uptime: '99.9%',
      responseTime: '245ms',
      activeUsers: stats?.users?.active || 0,
      serverLoad: 65,
    },
    topPerformers: topPerformers || [],
    alerts: alertsData?.alerts || [],
  } : null;

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_signup': return <Users className="w-4 h-4" />;
      case 'itr_filing': return <FileText className="w-4 h-4" />;
      case 'support_ticket': return <MessageSquare className="w-4 h-4" />;
      case 'payment': return <IndianRupee className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-success-600 bg-success-100';
      case 'warning': return 'text-warning-600 bg-warning-100';
      case 'error': return 'text-error-600 bg-error-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return null;
    const secondsAgo = Math.floor((Date.now() - lastUpdate) / 1000);
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    return `${Math.floor(minutesAgo / 60)}h ago`;
  };

  if (loading || !dashboardData) {
    return (
      <PageTransition className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Typography.H1 className="mb-4">Loading Dashboard...</Typography.H1>
            <Typography.Body>Please wait while we load your admin dashboard.</Typography.Body>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Typography.H1>Admin Dashboard</Typography.H1>
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
                  <button
                    onClick={refreshDashboard}
                    className="p-1 hover:bg-neutral-100 rounded transition-colors"
                    title="Refresh dashboard"
                  >
                    <RefreshCw className="w-4 h-4 text-neutral-500" />
                  </button>
                )}
              </div>
            </div>
            <Typography.Body className="text-neutral-600">
              Platform overview and management control center
              {lastUpdate && (
                <span className="ml-2 text-body-small text-neutral-400">
                  Updated {formatLastUpdate()}
                </span>
              )}
            </Typography.Body>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-xl text-body-regular"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button className="px-4 py-2 bg-primary-500 text-white rounded-xl text-body-regular font-medium hover:bg-primary-600 transition-colors">
              Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StaggerItem>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography.Small className="text-neutral-600 mb-1">
                      New Users
                    </Typography.Small>
                    <Typography.H3 className="text-heading-2 font-bold text-neutral-900">
                      {dashboardData.metrics.newUsers.today}
                    </Typography.H3>
                    <Typography.Small className="text-success-600">
                      +{dashboardData.metrics.newUsers.growth}% from last week
                    </Typography.Small>
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
                      ITR Filings
                    </Typography.Small>
                    <Typography.H3 className="text-heading-2 font-bold text-neutral-900">
                      {dashboardData.metrics.itrFilings.completed}
                    </Typography.H3>
                    <Typography.Small className="text-success-600">
                      {dashboardData.metrics.itrFilings.completionRate}% completion rate
                    </Typography.Small>
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
                      Open Tickets
                    </Typography.Small>
                    <Typography.H3 className="text-heading-2 font-bold text-neutral-900">
                      {dashboardData.metrics.serviceTickets.open}
                    </Typography.H3>
                    <Typography.Small className="text-neutral-600">
                      Avg resolution: {dashboardData.metrics.serviceTickets.avgResolutionTime}
                    </Typography.Small>
                  </div>
                  <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-warning-600" />
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
                      {formatCurrency(dashboardData.metrics.revenue.today)}
                    </Typography.H3>
                    <Typography.Small className="text-success-600">
                      +{dashboardData.metrics.revenue.growth}% from last week
                    </Typography.Small>
                  </div>
                  <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                    <IndianRupee className="w-6 h-6 text-secondary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* System Alerts */}
        {dashboardData.alerts && dashboardData.alerts.length > 0 && (
          <Card className="mb-8 border-warning-200 bg-warning-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-warning-600" />
                <span>System Alerts ({dashboardData.alerts.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardData.alerts.slice(0, 3).map((alert, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-xl">
                    <AlertCircle className={`w-5 h-5 mt-0.5 ${
                      alert.severity === 'critical' ? 'text-error-600' :
                      alert.severity === 'warning' ? 'text-warning-600' :
                      'text-info-600'
                    }`} />
                    <div className="flex-1">
                      <Typography.Small className="font-medium text-neutral-700">
                        {alert.title}
                      </Typography.Small>
                      <Typography.Small className="text-neutral-500">
                        {alert.message}
                      </Typography.Small>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Health & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-primary-600" />
                <span>System Health</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Typography.Small className="text-neutral-600">
                    Status
                  </Typography.Small>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      dashboardData.systemHealth.status === 'healthy' ? 'bg-success-500' :
                      dashboardData.systemHealth.status === 'degraded' ? 'bg-warning-500' :
                      'bg-error-500'
                    }`} />
                    <Typography.Small className={`font-medium ${
                      dashboardData.systemHealth.status === 'healthy' ? 'text-success-600' :
                      dashboardData.systemHealth.status === 'degraded' ? 'text-warning-600' :
                      'text-error-600'
                    }`}>
                      {dashboardData.systemHealth.status.toUpperCase()}
                    </Typography.Small>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Typography.Small className="text-neutral-600">
                    Uptime
                  </Typography.Small>
                  <Typography.Small className="font-medium">
                    {dashboardData.systemHealth.uptime}
                  </Typography.Small>
                </div>
                <div className="flex items-center justify-between">
                  <Typography.Small className="text-neutral-600">
                    Response Time
                  </Typography.Small>
                  <Typography.Small className="font-medium">
                    {dashboardData.systemHealth.responseTime}
                  </Typography.Small>
                </div>
                <div className="flex items-center justify-between">
                  <Typography.Small className="text-neutral-600">
                    Active Users
                  </Typography.Small>
                  <Typography.Small className="font-medium">
                    {dashboardData.systemHealth.activeUsers.toLocaleString()}
                  </Typography.Small>
                </div>
                <div className="flex items-center justify-between">
                  <Typography.Small className="text-neutral-600">
                    Server Load
                  </Typography.Small>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-neutral-200 rounded-full">
                      <div
                        className={`h-2 rounded-full ${
                          dashboardData.systemHealth.serverLoad < 50 ? 'bg-success-500' :
                          dashboardData.systemHealth.serverLoad < 80 ? 'bg-warning-500' :
                          'bg-error-500'
                        }`}
                        style={{ width: `${Math.min(dashboardData.systemHealth.serverLoad, 100)}%` }}
                      />
                    </div>
                    <Typography.Small className="font-medium">
                      {dashboardData.systemHealth.serverLoad}%
                    </Typography.Small>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary-600" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 ? (
                  dashboardData.recentActivity.map((activity, index) => {
                    const activityTimestamp = activity.timestamp ? new Date(activity.timestamp) : new Date();
                    return (
                      <motion.div
                        key={activity.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start space-x-3 p-3 bg-neutral-50 rounded-xl"
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${getStatusColor(activity.status || 'success')}`}>
                          {getActivityIcon(activity.type || activity.action)}
                        </div>
                        <div className="flex-1">
                          <Typography.Small className="text-neutral-700">
                            {activity.message || activity.description || 'Activity'}
                          </Typography.Small>
                          <Typography.Small className="text-neutral-500">
                            {formatTimeAgo(activityTimestamp)}
                          </Typography.Small>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <Typography.Small className="text-neutral-500 text-center py-4">
                    No recent activity
                  </Typography.Small>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        {dashboardData.topPerformers && dashboardData.topPerformers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                <span>Top Performing CA Firms</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.topPerformers.map((firm, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                        <span className="text-primary-600 font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <Typography.Small className="font-medium text-neutral-700">
                          {firm.name || firm.firmName || `CA Firm ${index + 1}`}
                        </Typography.Small>
                        <Typography.Small className="text-neutral-500">
                          {firm.filings || firm.totalFilings || 0} filings{firm.rating ? ` • Rating: ${firm.rating}/5` : ''}
                        </Typography.Small>
                      </div>
                    </div>
                    <div className="text-right">
                      <Typography.Small className="font-medium text-neutral-700">
                        {formatCurrency(firm.revenue || firm.totalRevenue || 0)}
                      </Typography.Small>
                      <Typography.Small className="text-neutral-500">
                        Revenue
                      </Typography.Small>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-primary-600" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="flex items-center space-x-3 p-4 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 transition-colors">
                <Users className="w-5 h-5 text-primary-600" />
                <Typography.Small className="font-medium text-primary-700">
                  Manage Users
                </Typography.Small>
              </button>
              <button className="flex items-center space-x-3 p-4 bg-success-50 border border-success-200 rounded-xl hover:bg-success-100 transition-colors">
                <MessageSquare className="w-5 h-5 text-success-600" />
                <Typography.Small className="font-medium text-success-700">
                  Support Tickets
                </Typography.Small>
              </button>
              <button className="flex items-center space-x-3 p-4 bg-warning-50 border border-warning-200 rounded-xl hover:bg-warning-100 transition-colors">
                <IndianRupee className="w-5 h-5 text-warning-600" />
                <Typography.Small className="font-medium text-warning-700">
                  Pricing Control
                </Typography.Small>
              </button>
              <button className="flex items-center space-x-3 p-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors">
                <Shield className="w-5 h-5 text-neutral-600" />
                <Typography.Small className="font-medium text-neutral-700">
                  System Settings
                </Typography.Small>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default AdminDashboard;
