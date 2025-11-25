// =====================================================
// ADMIN REPORTS PAGE
// Enterprise-grade comprehensive reporting system for admins
// =====================================================

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Calendar,
  FileText,
  Users,
  DollarSign,
  Building2,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  Filter,
  Search,
  Eye,
  RefreshCw,
  Settings,
  Database,
  Globe,
  Shield,
} from 'lucide-react';
import api from '../../services/api';

const AdminReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [reportFormat, setReportFormat] = useState('pdf');

  // Fetch report data
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['adminReports', selectedReport, dateRange],
    queryFn: async () => {
      const response = await api.get(`/api/admin/reports/${selectedReport}?date_range=${dateRange}`);
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch report templates
  const { data: templatesData } = useQuery({
    queryKey: ['adminReportTemplates'],
    queryFn: async () => {
      const response = await api.get('/api/admin/reports/templates');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const report = reportData?.report || {};
  const templates = templatesData?.templates || [];

  const reportTypes = [
    {
      id: 'overview',
      name: 'Platform Overview',
      description: 'Complete platform statistics and metrics',
      icon: BarChart3,
      color: 'blue',
    },
    {
      id: 'users',
      name: 'User Analytics',
      description: 'User behavior, growth, and engagement metrics',
      icon: Users,
      color: 'green',
    },
    {
      id: 'filings',
      name: 'Filing Reports',
      description: 'ITR filing statistics and performance metrics',
      icon: FileText,
      color: 'purple',
    },
    {
      id: 'revenue',
      name: 'Revenue Analysis',
      description: 'Financial performance and revenue tracking',
      icon: DollarSign,
      color: 'yellow',
    },
    {
      id: 'ca-firms',
      name: 'CA Firm Analytics',
      description: 'CA firm performance and client management',
      icon: Building2,
      color: 'orange',
    },
    {
      id: 'system',
      name: 'System Performance',
      description: 'System health, performance, and usage metrics',
      icon: Activity,
      color: 'red',
    },
    {
      id: 'compliance',
      name: 'Compliance Report',
      description: 'Regulatory compliance and audit trail',
      icon: Shield,
      color: 'indigo',
    },
    {
      id: 'security',
      name: 'Security Audit',
      description: 'Security events, threats, and access logs',
      icon: Shield,
      color: 'red',
    },
  ];

  const dateRanges = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const formats = [
    { value: 'pdf', label: 'PDF', icon: FileText },
    { value: 'excel', label: 'Excel', icon: Database },
    { value: 'csv', label: 'CSV', icon: Database },
    { value: 'json', label: 'JSON', icon: Settings },
  ];

  const handleGenerateReport = () => {
    // Generate report logic
    toast.success('Report generation started! You will be notified when ready.');
  };

  const handleDownloadReport = (reportId) => {
    // Download report logic
    window.open(`/api/admin/reports/${reportId}/download?format=${reportFormat}`, '_blank');
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
              <h1 className="text-xl font-semibold text-gray-900">Reports & Analytics</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/reports/scheduled')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Calendar className="h-4 w-4" />
                <span>Scheduled Reports</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Report Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Report Type */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {reportTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {dateRanges.map((range) => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format
              </label>
              <select
                value={reportFormat}
                onChange={(e) => setReportFormat(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {formats.map((format) => (
                  <option key={format.value} value={format.value}>{format.label}</option>
                ))}
              </select>
            </div>

            {/* Generate Button */}
            <div className="flex items-end">
              <button
                onClick={handleGenerateReport}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Generate</span>
              </button>
            </div>
          </div>
        </div>

        {/* Report Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {reportTypes.map((type) => (
            <div
              key={type.id}
              onClick={() => setSelectedReport(type.id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedReport === type.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  type.color === 'blue' ? 'bg-blue-100' :
                  type.color === 'green' ? 'bg-green-100' :
                  type.color === 'purple' ? 'bg-purple-100' :
                  type.color === 'yellow' ? 'bg-yellow-100' :
                  type.color === 'orange' ? 'bg-orange-100' :
                  type.color === 'red' ? 'bg-red-100' :
                  'bg-indigo-100'
                }`}>
                  <type.icon className={`h-5 w-5 ${
                    type.color === 'blue' ? 'text-blue-600' :
                    type.color === 'green' ? 'text-green-600' :
                    type.color === 'purple' ? 'text-purple-600' :
                    type.color === 'yellow' ? 'text-yellow-600' :
                    type.color === 'orange' ? 'text-orange-600' :
                    type.color === 'red' ? 'text-red-600' :
                    'text-indigo-600'
                  }`} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{type.name}</h3>
                  <p className="text-sm text-gray-500">{type.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {reportTypes.find(t => t.id === selectedReport)?.name} Report
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleDownloadReport(selectedReport)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Report Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{report.total_users || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Filings</p>
                  <p className="text-2xl font-semibold text-gray-900">{report.total_filings || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">₹{report.revenue || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">CA Firms</p>
                  <p className="text-2xl font-semibold text-gray-900">{report.ca_firms || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Analysis</h3>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Trend chart visualization would be implemented here</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution</h3>
              <div className="text-center py-8">
                <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Distribution chart visualization would be implemented here</p>
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Metrics</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">User Growth</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">New Users (30d)</span>
                    <span className="font-medium">{report.new_users_30d || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Growth Rate</span>
                    <span className="font-medium text-green-600">+{report.user_growth_rate || 0}%</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Filing Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-medium">{report.filing_completion_rate || 0}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Processing Time</span>
                    <span className="font-medium">{report.avg_processing_time || 0} days</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Revenue Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Monthly Revenue</span>
                    <span className="font-medium">₹{report.monthly_revenue || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Growth Rate</span>
                    <span className="font-medium text-green-600">+{report.revenue_growth_rate || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Templates */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3 mb-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Last used: {template.last_used}</span>
                  <button
                    onClick={() => handleDownloadReport(template.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminReports;
