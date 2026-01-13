// =====================================================
// PLATFORM COMPLIANCE PAGE
// Enterprise-grade compliance monitoring and management for platform admins
// =====================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Building2,
  Search,
  Filter,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  IndianRupee,
  Globe,
  Lock,
  Unlock,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from '../../components/UI';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const PlatformCompliance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch compliance data
  const { data: complianceData, isLoading } = useQuery({
    queryKey: ['platformCompliance', searchTerm, statusFilter, severityFilter],
    queryFn: async () => {
      const response = await api.get(`/api/platform-admin/compliance?search=${searchTerm}&status=${statusFilter}&severity=${severityFilter}`);
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch compliance statistics
  const { data: statsData } = useQuery({
    queryKey: ['platformComplianceStats'],
    queryFn: async () => {
      const response = await api.get('/api/platform-admin/compliance/stats');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch compliance alerts
  const { data: alertsData } = useQuery({
    queryKey: ['platformComplianceAlerts'],
    queryFn: async () => {
      const response = await api.get('/api/platform-admin/compliance/alerts');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 30 * 1000, // 30 seconds
  });

  const compliance = complianceData?.compliance || [];
  const stats = statsData?.stats || {};
  const alerts = alertsData?.alerts || [];

  // Update compliance status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ complianceId, status, notes }) => {
      const response = await api.put(`/api/platform-admin/compliance/${complianceId}/status`, {
        status,
        notes,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['platformCompliance']);
      queryClient.invalidateQueries(['platformComplianceStats']);
      toast.success('Compliance status updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update compliance: ${error.message}`);
    },
  });

  const handleStatusUpdate = (complianceId, newStatus, notes = '') => {
    updateStatusMutation.mutate({ complianceId, status: newStatus, notes });
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-error-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-gold-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-warning-500" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-info-500" />;
      default:
        return <Shield className="h-4 w-4 text-slate-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-error-50 text-error-600';
      case 'high':
        return 'bg-warning-50 text-warning-600';
      case 'medium':
        return 'bg-warning-50 text-warning-600';
      case 'low':
        return 'bg-info-50 text-info-600';
      default:
        return 'bg-slate-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'non_compliant':
        return <AlertTriangle className="h-4 w-4 text-error-500" />;
      case 'under_review':
        return <Clock className="h-4 w-4 text-gold-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-info-500" />;
      default:
        return <Shield className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'compliant':
        return 'bg-success-50 text-success-600';
      case 'non_compliant':
        return 'bg-error-50 text-error-600';
      case 'under_review':
        return 'bg-warning-50 text-warning-600';
      case 'pending':
        return 'bg-info-50 text-info-600';
      default:
        return 'bg-slate-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'compliance', name: 'Compliance Issues', icon: Shield },
    { id: 'alerts', name: 'Alerts', icon: AlertTriangle },
    { id: 'audit', name: 'Audit Trail', icon: FileText },
  ];

  if (isLoading) {

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-card border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-body-md text-slate-600 hover:text-slate-900"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-heading-lg font-semibold text-slate-900">Platform Compliance</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/platform-admin/compliance/export')}
                className="bg-success-500 text-white px-4 py-2 rounded-xl hover:bg-success-600 transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export Report</span>
              </button>

              <button
                onClick={() => navigate('/platform-admin/compliance/settings')}
                className="bg-gold-500 text-white px-4 py-2 rounded-xl hover:bg-gold-600 transition-colors flex items-center space-x-2"
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
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-label-lg transition-colors ${selectedTab === tab.id
                  ? 'border-gold-500 text-gold-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
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
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-card p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-success-600" />
                  <div className="ml-3">
                    <p className="text-label-lg font-medium text-slate-600">Compliant</p>
                    <p className="text-number-lg font-semibold text-slate-900">{stats.compliant || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-card p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-error-600" />
                  <div className="ml-3">
                    <p className="text-label-lg font-medium text-slate-600">Non-Compliant</p>
                    <p className="text-number-lg font-semibold text-slate-900">{stats.non_compliant || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-card p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-gold-600" />
                  <div className="ml-3">
                    <p className="text-label-lg font-medium text-slate-600">Under Review</p>
                    <p className="text-number-lg font-semibold text-slate-900">{stats.under_review || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-card p-4">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-info-600" />
                  <div className="ml-3">
                    <p className="text-label-lg font-medium text-slate-600">Compliance Score</p>
                    <p className="text-number-lg font-semibold text-slate-900">{stats.compliance_score || 0}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-heading-lg font-semibold text-slate-900 mb-4">Compliance by Category</h3>
                <div className="space-y-3">
                  {stats.compliance_by_category?.map((category) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-slate-400" />
                        <span className="text-label-lg font-medium text-slate-700">{category.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-gold-500 h-2 rounded-full"
                            style={{ width: `${category.compliance_rate}%` }}
                          ></div>
                        </div>
                        <span className="text-label-lg font-medium text-slate-900">{category.compliance_rate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-heading-lg font-semibold text-slate-900 mb-4">Recent Compliance Activity</h3>
                <div className="space-y-3">
                  {stats.recent_activity?.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
                      {getStatusIcon(activity.status)}
                      <div className="flex-1">
                        <p className="text-body-regular font-medium text-slate-900">{activity.description}</p>
                        <p className="text-body-small text-slate-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Critical Alerts */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="text-heading-lg font-semibold text-slate-900 mb-4">Critical Compliance Alerts</h3>
              {alerts.filter(alert => alert.severity === 'critical').length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-success-500 mx-auto mb-4" />
                  <h4 className="text-heading-lg font-medium text-slate-900 mb-2">No Critical Alerts</h4>
                  <p className="text-body-md text-slate-500">All compliance requirements are being met.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.filter(alert => alert.severity === 'critical').slice(0, 5).map((alert) => (
                    <div key={alert.id} className="p-4 border border-error-200 bg-error-50 rounded-xl">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">{alert.title}</h4>
                          <p className="text-body-md text-slate-600 mt-1">{alert.description}</p>
                          <p className="text-body-sm text-slate-500 mt-2">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleStatusUpdate(alert.id, 'under_review')}
                          className="px-3 py-1 bg-error-500 text-white text-label-lg rounded-xl hover:bg-error-600 transition-colors"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {selectedTab === 'compliance' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search compliance issues..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="compliant">Compliant</option>
                    <option value="non_compliant">Non-Compliant</option>
                    <option value="under_review">Under Review</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                {/* Severity Filter */}
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                >
                  <option value="all">All Severity</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Compliance Issues List */}
            {compliance.length === 0 ? (
              <div className="bg-white rounded-xl shadow-card p-12 text-center">
                <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-heading-lg font-medium text-slate-900 mb-2">No compliance issues found</h3>
                <p className="text-body-md text-slate-500 mb-6">
                  {searchTerm || statusFilter !== 'all' || severityFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'All compliance requirements are being met'
                  }
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-elevation-1 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="text-heading-4 font-semibold text-slate-900">
                    {compliance.length} Compliance Issue{compliance.length !== 1 ? 's' : ''}
                  </h2>
                </div>

                <div className="divide-y divide-gray-200">
                  {compliance.map((issue) => (
                    <div key={issue.id} className="px-6 py-4 hover:bg-slate-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          {getSeverityIcon(issue.severity)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-slate-900">{issue.title}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(issue.severity)}`}>
                                {issue.severity}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(issue.status)}`}>
                                {issue.status.replace('_', ' ')}
                              </span>
                            </div>

                            <p className="text-body-regular text-slate-600 mb-2">{issue.description}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-body-regular text-slate-600">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4" />
                                  <span>Category: {issue.category}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>Due: {new Date(issue.due_date).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Users className="h-4 w-4" />
                                  <span>Assigned: {issue.assigned_to || 'Unassigned'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Activity className="h-4 w-4" />
                                  <span>Last Updated: {new Date(issue.last_updated).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/platform-admin/compliance/${issue.id}`)}
                            className="p-2 text-info-600 hover:text-info-800 hover:bg-info-50 rounded-xl transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {issue.status === 'non_compliant' && (
                            <button
                              onClick={() => handleStatusUpdate(issue.id, 'under_review')}
                              className="p-2 text-gold-600 hover:text-gold-800 hover:bg-gold-50 rounded-xl transition-colors"
                              title="Mark Under Review"
                            >
                              <Clock className="h-4 w-4" />
                            </button>
                          )}

                          {issue.status === 'under_review' && (
                            <button
                              onClick={() => handleStatusUpdate(issue.id, 'compliant')}
                              className="p-2 text-success-600 hover:text-success-800 hover:bg-success-50 rounded-xl transition-colors"
                              title="Mark Compliant"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {selectedTab === 'alerts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="text-heading-lg font-semibold text-slate-900 mb-4">Compliance Alerts</h3>

              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-success-500 mx-auto mb-4" />
                  <h4 className="text-heading-lg font-medium text-slate-900 mb-2">No Active Alerts</h4>
                  <p className="text-body-md text-slate-500">All compliance requirements are being met.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`p-4 border rounded-xl ${alert.severity === 'critical' ? 'bg-error-50 border-error-200' :
                      alert.severity === 'high' ? 'bg-gold-50 border-gold-200' :
                        alert.severity === 'medium' ? 'bg-warning-50 border-warning-200' :
                          'bg-info-50 border-info-200'
                      }`}>
                      <div className="flex items-start space-x-3">
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-slate-900">{alert.title}</h4>
                            <span className="text-body-small text-slate-500">
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-body-regular text-slate-600 mt-1">{alert.description}</p>
                          {alert.source && (
                            <p className="text-body-small text-slate-500 mt-1">Source: {alert.source}</p>
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

        {/* Audit Trail Tab */}
        {selectedTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-elevation-1 p-6">
              <h3 className="text-heading-4 font-semibold text-slate-900 mb-4">Compliance Audit Trail</h3>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Audit trail visualization would be implemented here</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PlatformCompliance;
