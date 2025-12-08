// =====================================================
// ADMIN PLATFORM OVERVIEW
// Platform analytics with DesignSystem components
// =====================================================

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Typography, Button } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import {
  BarChart3,
  Users,
  TrendingUp,
  IndianRupee,
  Activity,
  RefreshCw,
} from 'lucide-react';
import adminService from '../../services/api/adminService';
import toast from 'react-hot-toast';

const AdminPlatformOverview = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState({});

  useEffect(() => {
    loadPlatformStats();
  }, [timeRange]);

  const loadPlatformStats = async () => {
    setLoading(true);
    try {
      const stats = await adminService.getPlatformStats(timeRange);
      setPlatformStats(stats);
    } catch (error) {
      console.error('Failed to load platform stats:', error);
      toast.error('Failed to load platform statistics');
    } finally {
      setLoading(false);
    }
  };

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
  ];

  if (loading) {
    return (
      <PageTransition className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            <Typography.Body className="text-neutral-600">Loading platform overview...</Typography.Body>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Typography.H1 className="mb-2">Platform Overview</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Comprehensive platform analytics and business metrics
            </Typography.Body>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {timeRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={loadPlatformStats}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography.Small className="text-neutral-500 mb-1">Total Users</Typography.Small>
                    <Typography.H3>{platformStats.users?.total?.toLocaleString() || '0'}</Typography.H3>
                    <Typography.Small className="text-success-600">
                      +{platformStats.users?.growth || 0}%
                    </Typography.Small>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography.Small className="text-neutral-500 mb-1">Total Revenue</Typography.Small>
                    <Typography.H3>₹{(platformStats.revenue?.total || 0).toLocaleString()}</Typography.H3>
                    <Typography.Small className="text-success-600">
                      +{platformStats.revenue?.growth || 0}%
                    </Typography.Small>
                  </div>
                  <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                    <IndianRupee className="h-6 w-6 text-success-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography.Small className="text-neutral-500 mb-1">Total Filings</Typography.Small>
                    <Typography.H3>{platformStats.filings?.total?.toLocaleString() || '0'}</Typography.H3>
                    <Typography.Small className="text-success-600">
                      +{platformStats.filings?.growth || 0}%
                    </Typography.Small>
                  </div>
                  <div className="w-12 h-12 bg-info-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-info-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography.Small className="text-neutral-500 mb-1">System Uptime</Typography.Small>
                    <Typography.H3>{platformStats.system?.uptime || 0}%</Typography.H3>
                    <Typography.Small className="text-neutral-500">
                      99.9% target
                    </Typography.Small>
                  </div>
                  <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                    <Activity className="h-6 w-6 text-secondary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>User Growth Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-neutral-50 rounded-lg">
                <div className="text-center">
                  <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <BarChart3 className="w-6 h-6 text-neutral-400" />
                  </div>
                  <Typography.Body className="text-neutral-500">Chart visualization will be implemented</Typography.Body>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-neutral-50 rounded-lg">
                <div className="text-center">
                  <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-6 h-6 text-neutral-400" />
                  </div>
                  <Typography.Body className="text-neutral-500">Revenue chart will be implemented</Typography.Body>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-neutral-50 rounded-lg">
                <Typography.H1 className="text-neutral-900 mb-1">
                  {platformStats.system?.responseTime || 0}ms
                </Typography.H1>
                <Typography.Small className="text-neutral-600">Avg Response Time</Typography.Small>
              </div>
              <div className="text-center p-6 bg-neutral-50 rounded-lg">
                <Typography.H1 className="text-neutral-900 mb-1">
                  {platformStats.system?.cpuUsage || 0}%
                </Typography.H1>
                <Typography.Small className="text-neutral-600">CPU Usage</Typography.Small>
              </div>
              <div className="text-center p-6 bg-neutral-50 rounded-lg">
                <Typography.H1 className="text-neutral-900 mb-1">
                  {platformStats.system?.memoryUsage || 0}%
                </Typography.H1>
                <Typography.Small className="text-neutral-600">Memory Usage</Typography.Small>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default AdminPlatformOverview;
