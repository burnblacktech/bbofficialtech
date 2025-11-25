// =====================================================
// ADMIN SYSTEM HEALTH PAGE
// Enterprise-grade system monitoring and health dashboard
// =====================================================

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  Shield,
  Zap,
  Globe,
  Users,
  FileText,
  DollarSign,
  BarChart3,
  PieChart,
  LineChart,
} from 'lucide-react';
import api from '../../services/api';

const AdminSystemHealth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  // Fetch system health data
  const { data: healthData, isLoading, refetch } = useQuery({
    queryKey: ['adminSystemHealth', selectedTimeRange],
    queryFn: async () => {
      const response = await api.get(`/api/admin/system/health?time_range=${selectedTimeRange}`);
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: autoRefresh ? 30 * 1000 : false, // Auto refresh every 30 seconds
  });

  // Fetch system metrics
  const { data: metricsData } = useQuery({
    queryKey: ['adminSystemMetrics'],
    queryFn: async () => {
      const response = await api.get('/api/admin/system/metrics');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Fetch system alerts
  const { data: alertsData } = useQuery({
    queryKey: ['adminSystemAlerts'],
    queryFn: async () => {
      const response = await api.get('/api/admin/system/alerts');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 30 * 1000, // 30 seconds
  });

  const health = healthData?.health || {};
  const metrics = metricsData?.metrics || {};
  const alerts = alertsData?.alerts || [];

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetch]);

  const getHealthStatus = (value, thresholds) => {
    if (value >= thresholds.critical) return { status: 'critical', color: 'red', icon: AlertTriangle };
    if (value >= thresholds.warning) return { status: 'warning', color: 'orange', icon: AlertTriangle };
    return { status: 'healthy', color: 'green', icon: CheckCircle };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'info':
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-semibold text-gray-900">System Health</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Auto Refresh</label>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoRefresh ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoRefresh ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>

              <button
                onClick={() => refetch()}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh Now"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <Server className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Server Status</p>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(health.server?.status || 'healthy')}`}>
                    {health.server?.status || 'healthy'}
                  </span>
                  <span className="text-sm text-gray-500">
                    Uptime: {health.server?.uptime || '99.9%'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Database</p>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(health.database?.status || 'healthy')}`}>
                    {health.database?.status || 'healthy'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {health.database?.connections || 0} connections
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <Wifi className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">API Response</p>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(health.api?.status || 'healthy')}`}>
                    {health.api?.status || 'healthy'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {health.api?.avg_response_time || 0}ms avg
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Security</p>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(health.security?.status || 'healthy')}`}>
                    {health.security?.status || 'healthy'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {alerts.filter(alert => alert.severity === 'critical').length} critical
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">CPU Usage</h3>
              <Cpu className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-semibold text-gray-900 mb-1">
              {metrics.cpu?.usage || 0}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${metrics.cpu?.usage || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Memory Usage</h3>
              <HardDrive className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-semibold text-gray-900 mb-1">
              {metrics.memory?.usage || 0}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${metrics.memory?.usage || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Disk Usage</h3>
              <HardDrive className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-semibold text-gray-900 mb-1">
              {metrics.disk?.usage || 0}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${metrics.disk?.usage || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Network I/O</h3>
              <Globe className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-semibold text-gray-900 mb-1">
              {metrics.network?.io_rate || 0} MB/s
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <TrendingUp className="h-3 w-3" />
              <span>+{metrics.network?.io_growth || 0}%</span>
            </div>
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => navigate('/admin/alerts')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All
              </button>
            </div>
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">All Systems Healthy</h4>
              <p className="text-gray-500">No active alerts at this time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className={`p-4 border rounded-lg ${getAlertColor(alert.severity)}`}>
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{alert.title}</h4>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      {alert.source && (
                        <p className="text-xs text-gray-500 mt-1">Source: {alert.source}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Application Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics.users?.active || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Filings Today</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics.filings?.today || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Revenue Today</p>
                <p className="text-2xl font-semibold text-gray-900">₹{metrics.revenue?.today || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">API Calls/min</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics.api?.calls_per_minute || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
            <div className="text-center py-8">
              <LineChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Performance chart visualization would be implemented here</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Usage</h3>
            <div className="text-center py-8">
              <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Resource usage chart would be implemented here</p>
            </div>
          </div>
        </div>

        {/* System Actions */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="flex items-center space-x-3">
                <RefreshCw className="h-6 w-6 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Restart Services</h4>
                  <p className="text-sm text-gray-500">Restart application services</p>
                </div>
              </div>
            </button>

            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="flex items-center space-x-3">
                <Database className="h-6 w-6 text-green-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Database Backup</h4>
                  <p className="text-sm text-gray-500">Create system backup</p>
                </div>
              </div>
            </button>

            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-purple-600" />
                <div>
                  <h4 className="font-medium text-gray-900">System Settings</h4>
                  <p className="text-sm text-gray-500">Configure system parameters</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSystemHealth;
