import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  Calendar,
  IndianRupee,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Lightbulb,
  Activity,
  Clock,
  Star,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import api from '../../services/api';

// =====================================================
// FINANCIAL PROFILE PAGE - HISTORICAL FILINGS & INSIGHTS
// Based on verified ITR blueprint and ERI integration
// =====================================================

const fetchFinancialProfile = async () => {
  try {
    const response = await api.get('/financial-profile');
    return response.data.profile;
  } catch (error) {
    console.error('Failed to fetch financial profile:', error);
    throw error;
  }
};

const fetchFinancialHistory = async () => {
  try {
    const response = await api.get('/financial-profile/history');
    return response.data.history;
  } catch (error) {
    console.error('Failed to fetch financial history:', error);
    throw error;
  }
};

const fetchInsights = async () => {
  try {
    const response = await api.get('/financial-profile/insights');
    return response.data.insights;
  } catch (error) {
    console.error('Failed to fetch insights:', error);
    throw error;
  }
};

const refreshFromITPortal = async () => {
  try {
    const response = await api.post('/financial-profile/refresh');
    return response.data;
  } catch (error) {
    console.error('Failed to refresh from IT Portal:', error);
    throw error;
  }
};

const FinancialProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management
  const [selectedTimeRange, setSelectedTimeRange] = useState('5y');
  const [selectedMetric, setSelectedMetric] = useState('income');
  const [showInsights, setShowInsights] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch data
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['financialProfile', user?.user_id],
    queryFn: fetchFinancialProfile,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!user?.user_id,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['financialHistory', user?.user_id, selectedTimeRange],
    queryFn: fetchFinancialHistory,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!user?.user_id,
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['financialInsights', user?.user_id],
    queryFn: fetchInsights,
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!user?.user_id,
  });

  // Refresh mutation
  const refreshMutation = useMutation({
    mutationFn: refreshFromITPortal,
    onSuccess: () => {
      setIsRefreshing(false);
      queryClient.invalidateQueries(['financialProfile']);
      queryClient.invalidateQueries(['financialHistory']);
      queryClient.invalidateQueries(['financialInsights']);
      toast.success('Financial profile refreshed from IT Portal');
    },
    onError: (error) => {
      setIsRefreshing(false);
      toast.error('Failed to refresh: ' + error.message);
    },
  });

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshMutation.mutate();
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!history) return null;

    const totalFilings = history.length;
    const totalIncome = history.reduce((sum, h) => sum + h.gross_income, 0);
    const totalDeductions = history.reduce((sum, h) => sum + h.deductions, 0);
    const totalTaxPaid = history.reduce((sum, h) => sum + h.tax_paid, 0);
    const totalRefund = history.reduce((sum, h) => sum + h.refund, 0);
    const averageIncome = totalIncome / totalFilings;
    const averageDeductions = totalDeductions / totalFilings;
    const averageTaxPaid = totalTaxPaid / totalFilings;
    const averageRefund = totalRefund / totalFilings;
    const effectiveTaxRate = totalTaxPaid / totalIncome * 100;

    return {
      totalFilings,
      totalIncome,
      totalDeductions,
      totalTaxPaid,
      totalRefund,
      averageIncome,
      averageDeductions,
      averageTaxPaid,
      averageRefund,
      effectiveTaxRate,
    };
  }, [history]);

  // Calculate trends
  const trends = useMemo(() => {
    if (!history || history.length < 2) return null;

    const sortedHistory = [...history].sort((a, b) =>
      new Date(a.assessment_year) - new Date(b.assessment_year),
    );

    const incomeTrend = sortedHistory.map((h, index) => {
      const prevIncome = index > 0 ? sortedHistory[index - 1].gross_income : h.gross_income;
      const change = ((h.gross_income - prevIncome) / prevIncome) * 100;
      return {
        year: h.assessment_year,
        income: h.gross_income,
        change: index > 0 ? change : 0,
      };
    });

    const deductionTrend = sortedHistory.map((h, index) => {
      const prevDeductions = index > 0 ? sortedHistory[index - 1].deductions : h.deductions;
      const change = ((h.deductions - prevDeductions) / prevDeductions) * 100;
      return {
        year: h.assessment_year,
        deductions: h.deductions,
        change: index > 0 ? change : 0,
      };
    });

    return { incomeTrend, deductionTrend };
  }, [history]);

  // Loading state
  if (profileLoading || historyLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your financial profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (profileError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-error-600 mx-auto mb-4" />
          <h2 className="text-heading-3 font-semibold text-black mb-2">Failed to Load Profile</h2>
          <p className="text-slate-700 mb-4">{profileError.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-heading-3 font-semibold text-slate-900 mb-2">No Financial Profile Found</h2>
          <p className="text-slate-600 mb-4">
            We couldn't find any financial history for your PAN. This could be because:
          </p>
          <ul className="text-left text-slate-600 mb-6 max-w-md mx-auto">
            <li>• You haven't filed any ITRs yet</li>
            <li>• Your PAN is not linked to any filings</li>
            <li>• There's an issue with data retrieval</li>
          </ul>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/itr-selection')}
              className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600"
            >
              Start Filing
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh from IT Portal'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-elevation-1 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-heading-2 font-bold text-slate-900">Financial Profile</h1>
              <div className="ml-4 text-body-regular text-slate-500">
                PAN: {profile.pan}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center px-3 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="px-3 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-elevation-1 p-6 border border-slate-200">
              <div className="flex items-center">
                <div className="p-2 bg-royal-100 rounded-xl">
                  <FileText className="w-6 h-6 text-royal-600" />
                </div>
                <div className="ml-4">
                  <p className="text-body-regular font-medium text-slate-600">Total Filings</p>
                  <p className="text-heading-2 font-bold text-black">{stats.totalFilings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-elevation-1 p-6 border border-slate-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-body-regular font-medium text-slate-600">Total Income</p>
                  <p className="text-heading-2 font-bold text-slate-900">₹{stats.totalIncome.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-elevation-1 p-6 border border-slate-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-body-regular font-medium text-slate-600">Total Deductions</p>
                  <p className="text-heading-2 font-bold text-slate-900">₹{stats.totalDeductions.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-elevation-1 p-6 border border-slate-200">
              <div className="flex items-center">
                <div className="p-2 bg-gold-100 rounded-xl">
                  <IndianRupee className="w-6 h-6 text-gold-600" />
                </div>
                <div className="ml-4">
                  <p className="text-body-regular font-medium text-slate-600">Total Refund</p>
                  <p className="text-heading-2 font-bold text-slate-900">₹{stats.totalRefund.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Income Trend Chart */}
          <div className="bg-white rounded-xl shadow-elevation-1 p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-heading-4 font-semibold text-slate-900">Income Trend</h3>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-body-regular text-green-600">+12.5%</span>
              </div>
            </div>

            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl">
              <div className="text-center">
                <LineChart className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600">Income trend chart will be displayed here</p>
                <p className="text-body-regular text-slate-500">Integration with charting library pending</p>
              </div>
            </div>
          </div>

          {/* Deductions Breakdown */}
          <div className="bg-white rounded-xl shadow-elevation-1 p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-heading-4 font-semibold text-black">Deductions Breakdown</h3>
              <div className="flex items-center space-x-2">
                <PieChart className="w-5 h-5 text-royal-600" />
                <span className="text-body-regular text-royal-600">80C: 65%</span>
              </div>
            </div>

            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600">Deductions breakdown chart will be displayed here</p>
                <p className="text-body-regular text-slate-500">Integration with charting library pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Insights Section */}
        {insights && insights.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-heading-4 font-semibold text-slate-900">Financial Insights</h3>
              <button
                onClick={() => setShowInsights(!showInsights)}
                className="flex items-center text-body-regular text-slate-600 hover:text-gray-800"
              >
                <Eye className="w-4 h-4 mr-1" />
                {showInsights ? 'Hide' : 'Show'} Insights
              </button>
            </div>

            {showInsights && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {insights.map((insight, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-elevation-1 p-6 border border-slate-200">
                    <div className="flex items-start">
                      <div className="p-2 bg-gold-100 rounded-xl mr-3">
                        <Lightbulb className="w-5 h-5 text-gold-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-black mb-2">{insight.title}</h4>
                        <p className="text-body-regular text-slate-600 mb-3">{insight.description}</p>
                        <div className="flex items-center text-body-regular text-slate-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {insight.assessment_year}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filing History Table */}
        <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-heading-4 font-semibold text-slate-900">Filing History</h3>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1y">Last 1 Year</option>
                  <option value="3y">Last 3 Years</option>
                  <option value="5y">Last 5 Years</option>
                  <option value="all">All Time</option>
                </select>

                <button className="flex items-center px-3 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                    Assessment Year
                  </th>
                  <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                    ITR Type
                  </th>
                  <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                    Gross Income
                  </th>
                  <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                    Tax Paid
                  </th>
                  <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                    Refund
                  </th>
                  <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history?.map((filing, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-body-regular font-medium text-slate-900">
                      {filing.assessment_year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-body-regular text-slate-600">
                      {filing.itr_type || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-body-regular text-slate-600">
                      ₹{filing.gross_income.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-body-regular text-slate-600">
                      ₹{filing.deductions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-body-regular text-slate-600">
                      ₹{filing.tax_paid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-body-regular text-slate-600">
                      ₹{filing.refund.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-body-small font-semibold rounded-full bg-green-100 text-green-800">
                        Completed
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-body-regular text-slate-600">
                      <div className="flex items-center space-x-2">
                        <button className="text-gold-600 hover:text-gold-800">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-slate-600 hover:text-gray-800">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialProfilePage;
