// =====================================================
// ADMIN FILINGS PAGE
// Filing oversight and management with DesignSystem components
// =====================================================

import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import apiClient from '../../services/core/APIClient';
import { useNavigate } from 'react-router-dom';
import { CardHeaderTitleContent, Typography } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import {
  useAdminFilings,
  useAdminFilingStats,
  useAdminFilingAnalytics,
} from '../../features/admin/filings/hooks/use-filings';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Download,
  Search,
  Filter,
  TrendingUp,
  IndianRupee,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { OrientationPage } from '../../components/templates';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const AdminFilings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [itrTypeFilter, setItrTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Build query params
  const queryParams = {
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    itrType: itrTypeFilter !== 'all' ? itrTypeFilter : undefined,
    dateRange: dateRange !== 'all' ? dateRange : undefined,
  };

  // Fetch all filings using hooks
  const { data: filingsData, isLoading } = useAdminFilings(queryParams);
  const { data: statsData } = useAdminFilingStats();
  const { data: analyticsData } = useAdminFilingAnalytics();

  const filings = filingsData?.data?.filings || filingsData?.filings || [];
  const stats = statsData?.data?.stats || statsData?.stats || {};
  const analytics = analyticsData?.data?.analytics || analyticsData?.analytics || {};

  // Update filing status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ filingId, status, notes }) => {
      const response = await apiClient.put(`/api/admin/filings/${filingId}/status`, {
        status,
        notes,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminFilings']);
      queryClient.invalidateQueries(['adminFilingStats']);
      toast.success('Filing status updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update filing: ${error.message}`);
    },
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-info-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-warning-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-error-500" />;
      case 'under_review':
        return <Eye className="h-4 w-4 text-secondary-500" />;
      default:
        return <FileText className="h-4 w-4 text-neutral-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-700';
      case 'in_progress':
        return 'bg-info-100 text-info-700';
      case 'pending':
        return 'bg-warning-100 text-warning-700';
      case 'rejected':
        return 'bg-error-100 text-error-700';
      case 'under_review':
        return 'bg-secondary-100 text-secondary-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'filings', name: 'All Filings', icon: FileText },
    { id: 'analytics', name: 'Analytics', icon: PieChart },
    { id: 'reports', name: 'Reports', icon: Activity },
  ];

  if (isLoading) {

    return (
      <PageTransition className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            <Typography.Body className="text-neutral-600">Loading filings...</Typography.Body>
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
            <Typography.H1 className="mb-2">Filing Management</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Manage and monitor all ITR filings
            </Typography.Body>
          </div>
          <Button onClick={() => navigate('/admin/reports/filings')} className="bg-success-600 hover:bg-success-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Navigation Tabs */}
        <Card className="mb-6">
          <CardContent className="p-2">
            <nav className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StaggerItem>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-info-100 rounded-xl flex items-center justify-center">
                        <FileText className="h-6 w-6 text-info-600" />
                      </div>
                      <div className="ml-4">
                        <Typography.Small className="text-neutral-500">Total Filings</Typography.Small>
                        <Typography.H3>{stats.total || 0}</Typography.H3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-success-600" />
                      </div>
                      <div className="ml-4">
                        <Typography.Small className="text-neutral-500">Completed</Typography.Small>
                        <Typography.H3>{stats.completed || 0}</Typography.H3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                        <Clock className="h-6 w-6 text-warning-600" />
                      </div>
                      <div className="ml-4">
                        <Typography.Small className="text-neutral-500">In Progress</Typography.Small>
                        <Typography.H3>{stats.in_progress || 0}</Typography.H3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-error-100 rounded-xl flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-error-600" />
                      </div>
                      <div className="ml-4">
                        <Typography.Small className="text-neutral-500">Pending</Typography.Small>
                        <Typography.H3>{stats.pending || 0}</Typography.H3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            </StaggerContainer>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Typography.Body className="font-semibold">Completion Rate</Typography.Body>
                    <TrendingUp className="h-5 w-5 text-success-500" />
                  </div>
                  <Typography.H1 className="mb-2">{stats.completion_rate || 0}%</Typography.H1>
                  <Typography.Small className="text-neutral-500">
                    {stats.completed || 0} of {stats.total || 0} filings completed
                  </Typography.Small>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Typography.Body className="font-semibold">Avg Processing Time</Typography.Body>
                    <Clock className="h-5 w-5 text-info-500" />
                  </div>
                  <Typography.H1 className="mb-2">{stats.average_processing_time || 0} days</Typography.H1>
                  <Typography.Small className="text-neutral-500">
                    Average time to process filings
                  </Typography.Small>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Typography.Body className="font-semibold">Revenue Generated</Typography.Body>
                    <IndianRupee className="h-5 w-5 text-success-500" />
                  </div>
                  <Typography.H1 className="mb-2">₹{stats.revenue_generated || 0}</Typography.H1>
                  <Typography.Small className="text-neutral-500">
                    Total revenue from filings
                  </Typography.Small>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Filing Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filings.slice(0, 5).map((filing) => (
                  <div key={filing.filing_id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(filing.status)}
                      <div>
                        <Typography.Body className="font-medium">{filing.itr_type}</Typography.Body>
                        <Typography.Small className="text-neutral-500">
                          {filing.user_name} • {filing.assessment_year}
                        </Typography.Small>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(filing.status)}`}>
                        {filing.status?.replace(/_/g, ' ')}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/filings/${filing.id || filing.filing_id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filings Tab */}
        {selectedTab === 'filings' && (
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search filings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-neutral-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="under_review">Under Review</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <select
                    value={itrTypeFilter}
                    onChange={(e) => setItrTypeFilter(e.target.value)}
                    className="px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All ITR Types</option>
                    <option value="itr1">ITR-1</option>
                    <option value="itr2">ITR-2</option>
                    <option value="itr3">ITR-3</option>
                    <option value="itr4">ITR-4</option>
                  </select>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Filings List */}
            {filings.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-neutral-400" />
                  </div>
                  <Typography.H3 className="mb-2">No filings found</Typography.H3>
                  <Typography.Body className="text-neutral-600">
                    {searchTerm || statusFilter !== 'all' || itrTypeFilter !== 'all' || dateRange !== 'all'
                      ? 'Try adjusting your search or filter criteria'
                      : 'No filings have been submitted yet'
                    }
                  </Typography.Body>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>{filings.length} Filing{filings.length !== 1 ? 's' : ''}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <StaggerContainer className="divide-y divide-neutral-200">
                    {filings.map((filing) => (
                      <StaggerItem key={filing.filing_id} className="p-4 sm:p-6 hover:bg-neutral-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                              {getStatusIcon(filing.status)}
                            </div>
                            <div>
                              <Typography.Body className="font-medium">{filing.itr_type}</Typography.Body>
                              <Typography.Small className="text-neutral-500">
                                {filing.user_name} • {filing.assessment_year}
                              </Typography.Small>
                              <Typography.Small className="text-neutral-400 block">
                                Created: {new Date(filing.created_at).toLocaleDateString()}
                              </Typography.Small>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(filing.status)}`}>
                              {filing.status?.replace(/_/g, ' ')}
                            </span>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/admin/filings/${filing.id || filing.filing_id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/admin/filings/${filing.filing_id}/edit`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {filing.status === 'completed' && filing.acknowledgment_number && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/admin/filings/${filing.filing_id}/acknowledgment`)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {selectedTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Filing Status Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analytics.status_distribution?.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <Typography.Small className="font-medium capitalize">{item.status?.replace(/_/g, ' ')}</Typography.Small>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-neutral-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${(item.count / (analytics.total || 1)) * 100}%` }}
                          />
                        </div>
                        <Typography.Small className="font-medium w-8 text-right">{item.count}</Typography.Small>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ITR Type Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analytics.itr_type_distribution?.map((item) => (
                    <div key={item.itr_type} className="flex items-center justify-between">
                      <Typography.Small className="font-medium">{item.itr_type}</Typography.Small>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-neutral-200 rounded-full h-2">
                          <div
                            className="bg-success-600 h-2 rounded-full"
                            style={{ width: `${(item.count / (analytics.total || 1)) * 100}%` }}
                          />
                        </div>
                        <Typography.Small className="font-medium w-8 text-right">{item.count}</Typography.Small>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Filing Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-neutral-400" />
                  </div>
                  <Typography.Body className="text-neutral-500">Chart visualization would be implemented here</Typography.Body>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Tab */}
        {selectedTab === 'reports' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filing Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="p-4 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-info-100 rounded-xl flex items-center justify-center">
                        <FileText className="h-5 w-5 text-info-600" />
                      </div>
                      <div>
                        <Typography.Body className="font-medium">Filing Summary Report</Typography.Body>
                        <Typography.Small className="text-neutral-500">Complete overview of all filings</Typography.Small>
                      </div>
                    </div>
                  </button>

                  <button className="p-4 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-success-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-success-600" />
                      </div>
                      <div>
                        <Typography.Body className="font-medium">Performance Report</Typography.Body>
                        <Typography.Small className="text-neutral-500">CA and system performance metrics</Typography.Small>
                      </div>
                    </div>
                  </button>

                  <button className="p-4 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-secondary-100 rounded-xl flex items-center justify-center">
                        <IndianRupee className="h-5 w-5 text-secondary-600" />
                      </div>
                      <div>
                        <Typography.Body className="font-medium">Revenue Report</Typography.Body>
                        <Typography.Small className="text-neutral-500">Financial performance analysis</Typography.Small>
                      </div>
                    </div>
                  </button>

                  <button className="p-4 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-warning-100 rounded-xl flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-warning-600" />
                      </div>
                      <div>
                        <Typography.Body className="font-medium">Monthly Report</Typography.Body>
                        <Typography.Small className="text-neutral-500">Monthly filing statistics</Typography.Small>
                      </div>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default AdminFilings;
