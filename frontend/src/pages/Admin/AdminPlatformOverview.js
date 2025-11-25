// Admin Platform Overview - Comprehensive Platform Analytics
// Dedicated page for platform overview with detailed analytics
// Shows user growth, revenue trends, system performance, and business metrics

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  BarChart3,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  Eye,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  EnterpriseCard,
  EnterpriseButton,
  EnterpriseBadge,
  EnterpriseStatCard,
} from '../../components/DesignSystem/EnterpriseComponents';

const AdminPlatformOverview = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState({});

  // Mock data - will be replaced with API calls
  const mockPlatformStats = {
    users: {
      total: 12567,
      active: 8934,
      newThisMonth: 456,
      growth: 12.5,
    },
    revenue: {
      total: 2456789,
      thisMonth: 123456,
      growth: 8.3,
      pending: 45678,
    },
    filings: {
      total: 34567,
      completed: 32123,
      pending: 2444,
      growth: 15.2,
    },
    system: {
      uptime: 99.98,
      responseTime: 245,
      cpuUsage: 68,
      memoryUsage: 72,
      diskUsage: 45,
    },
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPlatformStats(mockPlatformStats);
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading platform overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
              <p className="text-gray-600 mt-1">
                Comprehensive platform analytics and business metrics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timeRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              <EnterpriseButton
                variant="secondary"
                size="sm"
                onClick={() => setLoading(true)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </EnterpriseButton>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <EnterpriseStatCard
            title="Total Users"
            value={platformStats.users?.total?.toLocaleString() || '0'}
            change={`+${platformStats.users?.growth || 0}%`}
            changeType="positive"
            icon={Users}
          />
          <EnterpriseStatCard
            title="Total Revenue"
            value={`₹${(platformStats.revenue?.total || 0).toLocaleString()}`}
            change={`+${platformStats.revenue?.growth || 0}%`}
            changeType="positive"
            icon={DollarSign}
          />
          <EnterpriseStatCard
            title="Total Filings"
            value={platformStats.filings?.total?.toLocaleString() || '0'}
            change={`+${platformStats.filings?.growth || 0}%`}
            changeType="positive"
            icon={BarChart3}
          />
          <EnterpriseStatCard
            title="System Uptime"
            value={`${platformStats.system?.uptime || 0}%`}
            change="99.9% target"
            changeType="neutral"
            icon={Activity}
          />
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <EnterpriseCard>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth Trend</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chart visualization will be implemented</p>
                </div>
              </div>
            </div>
          </EnterpriseCard>

          <EnterpriseCard>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analytics</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Revenue chart will be implemented</p>
                </div>
              </div>
            </div>
          </EnterpriseCard>
        </div>

        {/* System Health */}
        <EnterpriseCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {platformStats.system?.responseTime || 0}ms
                </div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {platformStats.system?.cpuUsage || 0}%
                </div>
                <div className="text-sm text-gray-600">CPU Usage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {platformStats.system?.memoryUsage || 0}%
                </div>
                <div className="text-sm text-gray-600">Memory Usage</div>
              </div>
            </div>
          </div>
        </EnterpriseCard>
      </div>
    </div>
  );
};

export default AdminPlatformOverview;
