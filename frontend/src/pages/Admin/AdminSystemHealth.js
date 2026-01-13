// =====================================================
// ADMIN SYSTEM HEALTH PAGE
// System monitoring with DesignSystem components
// =====================================================

import { useState, useEffect } from 'react';
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
  Activity,
  TrendingUp,
  RefreshCw,
  Settings,
  Shield,
  Globe,
  Users,
  FileText,
  IndianRupee,
  LineChart,
  PieChart,
} from 'lucide-react';
import { CardHeaderTitleContent, Typography } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from '../../components/UI';
import { typography, spacing, components, layout } from '../../styles/designTokens';

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
    staleTime: 30 * 1000,
    refetchInterval: autoRefresh ? 30 * 1000 : false,
  });

  // Fetch system metrics
  const { data: metricsData } = useQuery({
    queryKey: ['adminSystemMetrics'],
    queryFn: async () => {
      const response = await api.get('/api/admin/system/metrics');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 1 * 60 * 1000,
  });

  // Fetch system alerts
  const { data: alertsData } = useQuery({
    queryKey: ['adminSystemAlerts'],
    queryFn: async () => {
      const response = await api.get('/api/admin/system/alerts');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 30 * 1000,
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-success-100 text-success-700';
      case 'warning':
        return 'bg-warning-100 text-warning-700';
      case 'critical':
        return 'bg-error-100 text-error-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-error-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning-500" />;
      case 'info':
        return <Activity className="h-4 w-4 text-info-500" />;
      default:
        return <Activity className="h-4 w-4 text-neutral-500" />;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-error-50 border-error-200';
      case 'warning':
        return 'bg-warning-50 border-warning-200';
      case 'info':
        return 'bg-info-50 border-info-200';
      default:
        return 'bg-neutral-50 border-neutral-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Typography.H1 className="mb-2">System Health</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Monitor system performance and health status
            </Typography.Body>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Typography.Small className="text-neutral-600">Auto Refresh</Typography.Small>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoRefresh ? 'bg-primary-500' : 'bg-neutral-200'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoRefresh ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* System Status Overview */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-info-100 flex items-center justify-center">
                    <Server className="w-5 h-5 text-info-600" />
                  </div>
                  <div className="ml-3">
                    <Typography.Small className="text-neutral-500">Server Status</Typography.Small>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(health.server?.status || 'healthy')}`}>
                        {health.server?.status || 'healthy'}
                      </span>
                      <Typography.Small className="text-neutral-500">
                        {health.server?.uptime || '99.9%'}
                      </Typography.Small>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center">
                    <Database className="w-5 h-5 text-success-600" />
                  </div>
                  <div className="ml-3">
                    <Typography.Small className="text-neutral-500">Database</Typography.Small>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(health.database?.status || 'healthy')}`}>
                        {health.database?.status || 'healthy'}
                      </span>
                      <Typography.Small className="text-neutral-500">
                        {health.database?.connections || 0} conn
                      </Typography.Small>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-info-100 flex items-center justify-center">
                    <Wifi className="w-5 h-5 text-info-600" />
                  </div>
                  <div className="ml-3">
                    <Typography.Small className="text-neutral-500">API Response</Typography.Small>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(health.api?.status || 'healthy')}`}>
                        {health.api?.status || 'healthy'}
                      </span>
                      <Typography.Small className="text-neutral-500">
                        {health.api?.avg_response_time || 0}ms
                      </Typography.Small>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-error-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-error-600" />
                  </div>
                  <div className="ml-3">
                    <Typography.Small className="text-neutral-500">Security</Typography.Small>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(health.security?.status || 'healthy')}`}>
                        {health.security?.status || 'healthy'}
                      </span>
                      <Typography.Small className="text-neutral-500">
                        {alerts.filter(alert => alert.severity === 'critical').length} critical
                      </Typography.Small>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Performance Metrics */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Typography.Small className="text-neutral-500">CPU Usage</Typography.Small>
                  <Cpu className="h-4 w-4 text-neutral-400" />
                </div>
                <Typography.H3 className="mb-1">{metrics.cpu?.usage || 0}%</Typography.H3>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${metrics.cpu?.usage || 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Typography.Small className="text-neutral-500">Memory Usage</Typography.Small>
                  <HardDrive className="h-4 w-4 text-neutral-400" />
                </div>
                <Typography.H3 className="mb-1">{metrics.memory?.usage || 0}%</Typography.H3>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className="bg-success-600 h-2 rounded-full"
                    style={{ width: `${metrics.memory?.usage || 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Typography.Small className="text-neutral-500">Disk Usage</Typography.Small>
                  <HardDrive className="h-4 w-4 text-neutral-400" />
                </div>
                <Typography.H3 className="mb-1">{metrics.disk?.usage || 0}%</Typography.H3>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className="bg-info-600 h-2 rounded-full"
                    style={{ width: `${metrics.disk?.usage || 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Typography.Small className="text-neutral-500">Network I/O</Typography.Small>
                  <Globe className="h-4 w-4 text-neutral-400" />
                </div>
                <Typography.H3 className="mb-1">{metrics.network?.io_rate || 0} MB/s</Typography.H3>
                <div className="flex items-center space-x-1 text-body-regular text-neutral-500">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{metrics.network?.io_growth || 0}%</span>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* System Alerts */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>System Alerts</CardTitle>
            <div className="flex items-center space-x-2">
              <Typography.Small className="text-neutral-500">
                {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
              </Typography.Small>
              <Button variant="link" onClick={() => navigate('/admin/alerts')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-success-600" />
                </div>
                <Typography.H3 className="mb-2">All Systems Healthy</Typography.H3>
                <Typography.Body className="text-neutral-500">No active alerts at this time.</Typography.Body>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className={`p-4 border rounded-xl ${getAlertColor(alert.severity)}`}>
                    <div className="flex items-start space-x-3">
                      {getAlertIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <Typography.Body className="font-medium">{alert.title}</Typography.Body>
                          <Typography.Small className="text-neutral-500">
                            {new Date(alert.timestamp).toLocaleString()}
                          </Typography.Small>
                        </div>
                        <Typography.Small className="text-neutral-600 mt-1 block">{alert.message}</Typography.Small>
                        {alert.source && (
                          <Typography.Small className="text-neutral-500 mt-1 block">Source: {alert.source}</Typography.Small>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Metrics */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <Typography.Small className="text-neutral-500">Active Users</Typography.Small>
                    <Typography.H3>{metrics.users?.active || 0}</Typography.H3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-success-600" />
                  </div>
                  <div className="ml-3">
                    <Typography.Small className="text-neutral-500">Filings Today</Typography.Small>
                    <Typography.H3>{metrics.filings?.today || 0}</Typography.H3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-info-100 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5 text-info-600" />
                  </div>
                  <div className="ml-3">
                    <Typography.Small className="text-neutral-500">Revenue Today</Typography.Small>
                    <Typography.H3>₹{metrics.revenue?.today || 0}</Typography.H3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-warning-600" />
                  </div>
                  <div className="ml-3">
                    <Typography.Small className="text-neutral-500">API Calls/min</Typography.Small>
                    <Typography.H3>{metrics.api?.calls_per_minute || 0}</Typography.H3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <LineChart className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <Typography.Body className="text-neutral-500">Performance chart visualization</Typography.Body>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <PieChart className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <Typography.Body className="text-neutral-500">Resource usage chart</Typography.Body>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Actions */}
        <Card>
          <CardHeader>
            <CardTitle>System Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <Typography.Body className="font-medium">Restart Services</Typography.Body>
                    <Typography.Small className="text-neutral-500">Restart application services</Typography.Small>
                  </div>
                </div>
              </button>
              <button className="p-4 border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center">
                    <Database className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <Typography.Body className="font-medium">Database Backup</Typography.Body>
                    <Typography.Small className="text-neutral-500">Create system backup</Typography.Small>
                  </div>
                </div>
              </button>
              <button className="p-4 border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-info-100 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-info-600" />
                  </div>
                  <div>
                    <Typography.Body className="font-medium">System Settings</Typography.Body>
                    <Typography.Small className="text-neutral-500">Configure parameters</Typography.Small>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default AdminSystemHealth;
