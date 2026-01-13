// =====================================================
// ADMIN REPORTS PAGE
// Comprehensive reporting with DesignSystem components
// =====================================================

import { useState } from 'react';
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
  IndianRupee,
  Building2,
  Activity,
  RefreshCw,
  Settings,
  Database,
  Shield,
} from 'lucide-react';
import { CardHeaderTitleContent, Typography } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import api from '../../services/api';
import ReportBuilder from '../../features/admin/reports/components/ReportBuilder';
import { OrientationPage } from '../../components/templates';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

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
    staleTime: 5 * 60 * 1000,
  });

  // Fetch report templates
  const { data: templatesData } = useQuery({
    queryKey: ['adminReportTemplates'],
    queryFn: async () => {
      const response = await api.get('/api/admin/reports/templates');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 10 * 60 * 1000,
  });

  const report = reportData?.report || {};
  const templates = templatesData?.templates || [];

  const reportTypes = [
    {
      id: 'overview',
      name: 'Platform Overview',
      description: 'Complete platform statistics and metrics',
      icon: BarChart3,
      color: 'primary',
    },
    {
      id: 'users',
      name: 'User Analytics',
      description: 'User behavior, growth, and engagement metrics',
      icon: Users,
      color: 'success',
    },
    {
      id: 'filings',
      name: 'Filing Reports',
      description: 'ITR filing statistics and performance metrics',
      icon: FileText,
      color: 'info',
    },
    {
      id: 'revenue',
      name: 'Revenue Analysis',
      description: 'Financial performance and revenue tracking',
      icon: IndianRupee,
      color: 'warning',
    },
    {
      id: 'ca-firms',
      name: 'CA Firm Analytics',
      description: 'CA firm performance and client management',
      icon: Building2,
      color: 'primary',
    },
    {
      id: 'system',
      name: 'System Performance',
      description: 'System health, performance, and usage metrics',
      icon: Activity,
      color: 'error',
    },
    {
      id: 'compliance',
      name: 'Compliance Report',
      description: 'Regulatory compliance and audit trail',
      icon: Shield,
      color: 'info',
    },
    {
      id: 'security',
      name: 'Security Audit',
      description: 'Security events, threats, and access logs',
      icon: Shield,
      color: 'error',
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
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON' },
  ];

  const handleGenerateReport = () => {
    toast.success('Report generation started! You will be notified when ready.');
  };

  const handleDownloadReport = (reportId) => {
    window.open(`/api/admin/reports/${reportId}/download?format=${reportFormat}`, '_blank');
  };

  const getColorClasses = (color) => {
    const colors = {
      primary: 'bg-primary-100 text-primary-600',
      success: 'bg-success-100 text-success-600',
      info: 'bg-info-100 text-info-600',
      warning: 'bg-warning-100 text-warning-600',
      error: 'bg-error-100 text-error-600',
    };
    return colors[color] || colors.primary;
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
            <Typography.H1 className="mb-2">Reports & Analytics</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Generate and export comprehensive reports
            </Typography.Body>
          </div>
          <Button onClick={() => navigate('/admin/reports/scheduled')}>
            <Calendar className="w-4 h-4 mr-2" />
            Scheduled Reports
          </Button>
        </div>

        {/* Report Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                  Report Type
                </label>
                <select
                  value={selectedReport}
                  onChange={(e) => setSelectedReport(e.target.value)}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                >
                  {reportTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                >
                  {dateRanges.map((range) => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                  Format
                </label>
                <select
                  value={reportFormat}
                  onChange={(e) => setReportFormat(e.target.value)}
                  className="px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                >
                  {formats.map((format) => (
                    <option key={format.value} value={format.value}>{format.label}</option>
                  ))}
                </select>
              </div>
              <Button onClick={handleGenerateReport}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Types Grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {reportTypes.map((type) => (
            <StaggerItem key={type.id}>
              <div
                onClick={() => setSelectedReport(type.id)}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${selectedReport === type.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getColorClasses(type.color)}`}>
                    <type.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <Typography.Body className="font-medium">{type.name}</Typography.Body>
                    <Typography.Small className="text-neutral-500">{type.description}</Typography.Small>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Report Content */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {reportTypes.find(t => t.id === selectedReport)?.name} Report
            </CardTitle>
            <Button onClick={() => handleDownloadReport(selectedReport)} className="bg-success-600 hover:bg-success-700">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </CardHeader>
          <CardContent>
            {/* Report Summary */}
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <StaggerItem>
                <div className="bg-neutral-50 rounded-xl p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <Typography.Small className="text-neutral-500">Total Users</Typography.Small>
                      <Typography.H3>{report.total_users || 0}</Typography.H3>
                    </div>
                  </div>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div className="bg-neutral-50 rounded-xl p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-success-600" />
                    </div>
                    <div className="ml-3">
                      <Typography.Small className="text-neutral-500">Total Filings</Typography.Small>
                      <Typography.H3>{report.total_filings || 0}</Typography.H3>
                    </div>
                  </div>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div className="bg-neutral-50 rounded-xl p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-xl bg-info-100 flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-info-600" />
                    </div>
                    <div className="ml-3">
                      <Typography.Small className="text-neutral-500">Revenue</Typography.Small>
                      <Typography.H3>₹{report.revenue || 0}</Typography.H3>
                    </div>
                  </div>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div className="bg-neutral-50 rounded-xl p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-warning-600" />
                    </div>
                    <div className="ml-3">
                      <Typography.Small className="text-neutral-500">CA Firms</Typography.Small>
                      <Typography.H3>{report.ca_firms || 0}</Typography.H3>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            </StaggerContainer>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-neutral-50 rounded-xl p-6">
                <Typography.H3 className="mb-4">Trend Analysis</Typography.H3>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <Typography.Body className="text-neutral-500">Trend chart visualization</Typography.Body>
                </div>
              </div>
              <div className="bg-neutral-50 rounded-xl p-6">
                <Typography.H3 className="mb-4">Distribution</Typography.H3>
                <div className="text-center py-8">
                  <PieChart className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <Typography.Body className="text-neutral-500">Distribution chart visualization</Typography.Body>
                </div>
              </div>
            </div>

            {/* Detailed Metrics */}
            <Typography.H3 className="mb-4">Detailed Metrics</Typography.H3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <Typography.Body className="font-medium mb-2">User Growth</Typography.Body>
                  <div className="space-y-2">
                    <div className="flex justify-between text-body-regular">
                      <Typography.Small className="text-neutral-600">New Users (30d)</Typography.Small>
                      <Typography.Small className="font-medium">{report.new_users_30d || 0}</Typography.Small>
                    </div>
                    <div className="flex justify-between text-body-regular">
                      <Typography.Small className="text-neutral-600">Growth Rate</Typography.Small>
                      <Typography.Small className="font-medium text-success-600">+{report.user_growth_rate || 0}%</Typography.Small>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <Typography.Body className="font-medium mb-2">Filing Performance</Typography.Body>
                  <div className="space-y-2">
                    <div className="flex justify-between text-body-regular">
                      <Typography.Small className="text-neutral-600">Completion Rate</Typography.Small>
                      <Typography.Small className="font-medium">{report.filing_completion_rate || 0}%</Typography.Small>
                    </div>
                    <div className="flex justify-between text-body-regular">
                      <Typography.Small className="text-neutral-600">Avg Processing Time</Typography.Small>
                      <Typography.Small className="font-medium">{report.avg_processing_time || 0} days</Typography.Small>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <Typography.Body className="font-medium mb-2">Revenue Metrics</Typography.Body>
                  <div className="space-y-2">
                    <div className="flex justify-between text-body-regular">
                      <Typography.Small className="text-neutral-600">Monthly Revenue</Typography.Small>
                      <Typography.Small className="font-medium">₹{report.monthly_revenue || 0}</Typography.Small>
                    </div>
                    <div className="flex justify-between text-body-regular">
                      <Typography.Small className="text-neutral-600">Growth Rate</Typography.Small>
                      <Typography.Small className="font-medium text-success-600">+{report.revenue_growth_rate || 0}%</Typography.Small>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Custom Report Builder */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Custom Report Builder</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportBuilder />
          </CardContent>
        </Card>

        {/* Report Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Report Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="border border-neutral-200 rounded-xl p-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-600" />
                    </div>
                    <Typography.Body className="font-medium">{template.name}</Typography.Body>
                  </div>
                  <Typography.Small className="text-neutral-600 block mb-3">{template.description}</Typography.Small>
                  <div className="flex items-center justify-between">
                    <Typography.Small className="text-neutral-500">Last used: {template.last_used}</Typography.Small>
                    <Button variant="link" size="sm" onClick={() => handleDownloadReport(template.id)}>
                      Use Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default AdminReports;
