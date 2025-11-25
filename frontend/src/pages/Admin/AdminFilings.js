// =====================================================
// ADMIN FILINGS PAGE
// Enterprise-grade filing oversight and management for admins
// =====================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Download,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2,
  User,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminFilings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [itrTypeFilter, setItrTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch all filings
  const { data: filingsData, isLoading } = useQuery({
    queryKey: ['adminFilings', searchTerm, statusFilter, itrTypeFilter, dateRange],
    queryFn: async () => {
      const response = await api.get(`/api/admin/filings?search=${searchTerm}&status=${statusFilter}&itr_type=${itrTypeFilter}&date_range=${dateRange}`);
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // 30 seconds
  });

  // Fetch filing statistics
  const { data: statsData } = useQuery({
    queryKey: ['adminFilingStats'],
    queryFn: async () => {
      const response = await api.get('/api/admin/filings/stats');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch filing analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['adminFilingAnalytics'],
    queryFn: async () => {
      const response = await api.get('/api/admin/filings/analytics');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const filings = filingsData?.filings || [];
  const stats = statsData?.stats || {};
  const analytics = analyticsData?.analytics || {};

  // Update filing status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ filingId, status, notes }) => {
      const response = await api.put(`/api/admin/filings/${filingId}/status`, {
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

  const handleStatusUpdate = (filingId, newStatus) => {
    updateStatusMutation.mutate({ filingId, status: newStatus });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'under_review':
        return <Eye className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
              <h1 className="text-xl font-semibold text-gray-900">Filing Management</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/reports/filings')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Filings</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.completed || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.in_progress || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.pending || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Completion Rate</h3>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stats.completion_rate || 0}%
                </div>
                <p className="text-sm text-gray-500">
                  {stats.completed || 0} of {stats.total || 0} filings completed
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Average Processing Time</h3>
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stats.average_processing_time || 0} days
                </div>
                <p className="text-sm text-gray-500">
                  Average time to process filings
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Revenue Generated</h3>
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  ₹{stats.revenue_generated || 0}
                </div>
                <p className="text-sm text-gray-500">
                  Total revenue from filings
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Filing Activity</h3>
              <div className="space-y-3">
                {filings.slice(0, 5).map((filing) => (
                  <div key={filing.filing_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(filing.status)}
                      <div>
                        <p className="font-medium text-gray-900">{filing.itr_type}</p>
                        <p className="text-sm text-gray-500">
                          {filing.user_name} • {filing.assessment_year}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(filing.status)}`}>
                        {filing.status.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => navigate(`/admin/filings/${filing.filing_id}`)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filings Tab */}
        {selectedTab === 'filings' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search filings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="under_review">Under Review</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* ITR Type Filter */}
                <select
                  value={itrTypeFilter}
                  onChange={(e) => setItrTypeFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All ITR Types</option>
                  <option value="itr1">ITR-1</option>
                  <option value="itr2">ITR-2</option>
                  <option value="itr3">ITR-3</option>
                  <option value="itr4">ITR-4</option>
                </select>

                {/* Date Range Filter */}
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>

            {/* Filings List */}
            {filings.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No filings found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || statusFilter !== 'all' || itrTypeFilter !== 'all' || dateRange !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'No filings have been submitted yet'
                  }
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {filings.length} Filing{filings.length !== 1 ? 's' : ''}
                  </h2>
                </div>

                <div className="divide-y divide-gray-200">
                  {filings.map((filing) => (
                    <div key={filing.filing_id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(filing.status)}
                          <div>
                            <h4 className="font-medium text-gray-900">{filing.itr_type}</h4>
                            <p className="text-sm text-gray-500">
                              {filing.user_name} • {filing.assessment_year}
                            </p>
                            <p className="text-sm text-gray-500">
                              Created: {new Date(filing.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(filing.status)}`}>
                            {filing.status.replace('_', ' ')}
                          </span>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => navigate(`/admin/filings/${filing.filing_id}`)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => navigate(`/admin/filings/${filing.filing_id}/edit`)}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit Filing"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            {filing.status === 'completed' && filing.acknowledgment_number && (
                              <button
                                onClick={() => navigate(`/admin/filings/${filing.filing_id}/acknowledgment`)}
                                className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Download Acknowledgment"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      {filing.ca_name && (
                        <div className="mt-2 text-sm text-gray-600">
                          Assigned CA: {filing.ca_name}
                        </div>
                      )}

                      {filing.last_updated && (
                        <div className="mt-1 text-xs text-gray-500">
                          Last updated: {new Date(filing.last_updated).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {selectedTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filing Status Distribution</h3>
                <div className="space-y-3">
                  {analytics.status_distribution?.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <span className="text-sm font-medium text-gray-700">{item.status.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(item.count / analytics.total) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ITR Type Distribution</h3>
                <div className="space-y-3">
                  {analytics.itr_type_distribution?.map((item) => (
                    <div key={item.itr_type} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{item.itr_type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(item.count / analytics.total) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Filing Trends</h3>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chart visualization would be implemented here</p>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {selectedTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filing Reports</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Filing Summary Report</h4>
                      <p className="text-sm text-gray-500">Complete overview of all filings</p>
                    </div>
                  </div>
                </button>

                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Performance Report</h4>
                      <p className="text-sm text-gray-500">CA and system performance metrics</p>
                    </div>
                  </div>
                </button>

                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Revenue Report</h4>
                      <p className="text-sm text-gray-500">Financial performance analysis</p>
                    </div>
                  </div>
                </button>

                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-6 w-6 text-orange-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Monthly Report</h4>
                      <p className="text-sm text-gray-500">Monthly filing statistics</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminFilings;
