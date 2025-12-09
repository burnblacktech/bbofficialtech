// =====================================================
// PLATFORM SYSTEM HEALTH PAGE
// Enterprise-grade platform-wide system monitoring for platform admins
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
  IndianRupee,
  BarChart3,
  PieChart,
  LineChart,
  Building2,
  Eye,
  Download,
} from 'lucide-react';
import api from '../../services/api';

const PlatformSystemHealth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch platform system health data
  const { data: healthData, isLoading, refetch } = useQuery({
    queryKey: ['platformSystemHealth', selectedTimeRange],
    queryFn: async () => {
      const response = await api.get(`/api/platform-admin/system/health?time_range=${selectedTimeRange}`);
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: autoRefresh ? 30 * 1000 : false, // Auto refresh every 30 seconds
  });

  // Fetch platform metrics
  const { data: metricsData } = useQuery({
    queryKey: ['platformSystemMetrics'],
    queryFn: async () => {
      const response = await api.get('/api/platform-admin/system/metrics');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Fetch platform alerts
  const { data: alertsData } = useQuery({
    queryKey: ['platformSystemAlerts'],
    queryFn: async () => {
      const response = await api.get('/api/platform-admin/system/alerts');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch service status
  const { data: servicesData } = useQuery({
    queryKey: ['platformServices'],
    queryFn: async () => {
      const response = await api.get('/api/platform-admin/system/services');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const health = healthData?.health || {};
  const metrics = metricsData?.metrics || {};
  const alerts = alertsData?.alerts || [];
  const services = servicesData?.services || [];

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
        return 'bg-success-50 text-success-600';
      case 'warning':
        return 'bg-warning-50 text-warning-600';
      case 'critical':
        return 'bg-error-50 text-error-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceIcon = (service) => {
    switch (service.type) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'api':
        return <Wifi className="h-4 w-4" />;
      case 'auth':
        return <Shield className="h-4 w-4" />;
      case 'storage':
        return <HardDrive className="h-4 w-4" />;
      case 'cache':
        return <Zap className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const getServiceColor = (status) => {
    switch (status) {
      case 'running':
        return 'text-success-500';
      case 'stopped':
        return 'text-error-600';
      case 'starting':
        return 'text-gold-600';
      case 'stopping':
        return 'text-gold-600';
      default:
        return 'text-gray-600';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'services', name: 'Services', icon: Server },
    { id: 'metrics', name: 'Metrics', icon: Activity },
    { id: 'alerts', name: 'Alerts', icon: AlertTriangle },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-card border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-body-md text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-heading-lg font-semibold text-gray-900">Platform System Health</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-label-lg text-gray-600">Auto Refresh</label>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoRefresh ? 'bg-gold-500' : 'bg-gray-200'
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
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
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

              <button
                onClick={() => navigate('/platform-admin/system/settings')}
                className="bg-gold-500 text-white px-4 py-2 rounded-lg hover:bg-gold-600 transition-colors flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-label-lg transition-colors ${
                  selectedTab === tab.id
                    ? 'border-gold-500 text-gold-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-6">
        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* System Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-card p-4">
                <div className="flex items-center">
                  <Server className="h-8 w-8 text-info-500" />
                  <div className="ml-3">
                    <p className="text-label-lg font-medium text-gray-600">Platform Status</p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-label-sm rounded-full ${getStatusColor(health.platform?.status || 'healthy')}`}>
                        {health.platform?.status || 'healthy'}
                      </span>
                      <span className="text-body-md text-gray-500">
                        Uptime: {health.platform?.uptime || '99.9%'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-card p-4">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-success-500" />
                  <div className="ml-3">
                    <p className="text-label-lg font-medium text-gray-600">Database</p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-label-sm rounded-full ${getStatusColor(health.database?.status || 'healthy')}`}>
                        {health.database?.status || 'healthy'}
                      </span>
                      <span className="text-body-md text-gray-500">
                        {health.database?.connections || 0} connections
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-card p-4">
                <div className="flex items-center">
                  <Wifi className="h-8 w-8 text-info-600" />
                  <div className="ml-3">
                    <p className="text-label-lg font-medium text-gray-600">API Response</p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-label-sm rounded-full ${getStatusColor(health.api?.status || 'healthy')}`}>
                        {health.api?.status || 'healthy'}
                      </span>
                      <span className="text-body-md text-gray-500">
                        {health.api?.avg_response_time || 0}ms avg
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-card p-4">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-error-600" />
                  <div className="ml-3">
                    <p className="text-label-lg font-medium text-gray-600">Security</p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-label-sm rounded-full ${getStatusColor(health.security?.status || 'healthy')}`}>
                        {health.security?.status || 'healthy'}
                      </span>
                      <span className="text-body-md text-gray-500">
                        {alerts.filter(alert => alert.severity === 'critical').length} critical
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-label-lg font-medium text-gray-600">CPU Usage</h3>
                  <Cpu className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-number-lg font-semibold text-gray-900 mb-1">
                  {metrics.cpu?.usage || 0}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-info-500 h-2 rounded-full"
                    style={{ width: `${metrics.cpu?.usage || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-label-lg font-medium text-gray-600">Memory Usage</h3>
                  <HardDrive className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-number-lg font-semibold text-gray-900 mb-1">
                  {metrics.memory?.usage || 0}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-success-500 h-2 rounded-full"
                    style={{ width: `${metrics.memory?.usage || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-label-lg font-medium text-gray-600">Disk Usage</h3>
                  <HardDrive className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-number-lg font-semibold text-gray-900 mb-1">
                  {metrics.disk?.usage || 0}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-info-500 h-2 rounded-full"
                    style={{ width: `${metrics.disk?.usage || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-label-lg font-medium text-gray-600">Network I/O</h3>
                  <Globe className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-number-lg font-semibold text-gray-900 mb-1">
                  {metrics.network?.io_rate || 0} MB/s
                </div>
                <div className="flex items-center space-x-1 text-body-md text-gray-500">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{metrics.network?.io_growth || 0}%</span>
                </div>
              </div>
            </div>

            {/* Platform Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-card p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-info-500" />
                  <div className="ml-3">
                    <p className="text-label-lg font-medium text-gray-600">Active Users</p>
                    <p className="text-number-lg font-semibold text-gray-900">{metrics.users?.active || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-card p-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-success-500" />
                  <div className="ml-3">
                    <p className="text-label-lg font-medium text-gray-600">Filings Today</p>
                    <p className="text-number-lg font-semibold text-gray-900">{metrics.filings?.today || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-card p-4">
                <div className="flex items-center">
                  <IndianRupee className="h-8 w-8 text-info-600" />
                  <div className="ml-3">
                    <p className="text-label-lg font-medium text-gray-600">Revenue Today</p>
                    <p className="text-number-lg font-semibold text-gray-900">₹{metrics.revenue?.today || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-card p-4">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-gold-600" />
                  <div className="ml-3">
                    <p className="text-label-lg font-medium text-gray-600">API Calls/min</p>
                    <p className="text-number-lg font-semibold text-gray-900">{metrics.api?.calls_per_minute || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Alerts */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => navigate('/platform-admin/system/alerts')}
                    className="text-gold-600 hover:text-gold-700 text-label-lg font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>

              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-success-500 mx-auto mb-4" />
                  <h4 className="text-heading-lg font-medium text-gray-900 mb-2">All Systems Healthy</h4>
                  <p className="text-gray-500">No active alerts at this time.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className={`p-4 border rounded-lg ${
                      alert.severity === 'critical' ? 'bg-error-50 border-error-200' :
                      alert.severity === 'warning' ? 'bg-gold-50 border-gold-200' :
                      'bg-info-50 border-info-100'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-4 w-4 text-error-500" />
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
          </div>
        )}

        {/* Services Tab */}
        {selectedTab === 'services' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Services</h3>

              {services.length === 0 ? (
                <div className="text-center py-8">
                  <Server className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Services Found</h4>
                  <p className="text-gray-500">Service information is not available.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map((service) => (
                    <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          service.status === 'running' ? 'bg-success-50' :
                          service.status === 'stopped' ? 'bg-error-50' :
                          'bg-warning-50'
                        }`}>
                          <div className={getServiceColor(service.status)}>
                            {getServiceIcon(service)}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{service.name}</h4>
                          <p className="text-sm text-gray-500">{service.type}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Status</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            service.status === 'running' ? 'bg-success-50 text-success-600' :
                            service.status === 'stopped' ? 'bg-error-50 text-error-600' :
                            'bg-warning-50 text-warning-600'
                          }`}>
                            {service.status}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Uptime</span>
                          <span className="font-medium">{service.uptime || 'N/A'}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Version</span>
                          <span className="font-medium">{service.version || 'N/A'}</span>
                        </div>

                        {service.last_restart && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Last Restart</span>
                            <span className="font-medium">
                              {new Date(service.last_restart).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metrics Tab */}
        {selectedTab === 'metrics' && (
          <div className="space-y-6">
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

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Activity</h3>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Activity chart visualization would be implemented here</p>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {selectedTab === 'alerts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>

              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-success-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h4>
                  <p className="text-gray-500">All systems are operating normally.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`p-4 border rounded-lg ${
                      alert.severity === 'critical' ? 'bg-error-50 border-error-200' :
                      alert.severity === 'warning' ? 'bg-gold-50 border-gold-200' :
                      'bg-info-50 border-info-100'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5" />
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
          </div>
        )}
      </main>
    </div>
  );
};

export default PlatformSystemHealth;
