import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import enterpriseDebugger from '../../services/EnterpriseDebugger';
import EnterpriseErrorBoundary from '../../components/EnterpriseErrorBoundary';
import financialProfileService from '../../services/financialProfileService';
import {
  ArrowRight, ArrowLeft, TrendingUp, TrendingDown,
  DollarSign, PieChart,
  AlertTriangle, CheckCircle, Shield,
  RefreshCw, Info,
} from 'lucide-react';
import {
  EnterpriseCard,
  EnterpriseButton,
  EnterpriseBadge,
  EnterpriseStatCard,
} from '../../components/DesignSystem/EnterpriseComponents';

const FinancialProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Get context from navigation state
  const {
    pan,
    verificationResult,
    prefillData,
    isCAFiling,
    interactionMode,
    fromModeSelection,
  } = location.state || {};

  const [loading, setLoading] = useState(true);

  // Check if PAN is available
  useEffect(() => {
    if (!pan) {
      enterpriseDebugger.log('WARNING', 'FinancialProfile', 'No PAN provided, redirecting to PAN verification');
      navigate('/itr/pan-verification', {
        state: {
          redirectTo: '/financial-profile',
          message: 'PAN verification required to load financial profile',
        },
      });
    }
  }, [pan, navigate]);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState([]);

  // Financial profile data structure
  const [profileData, setProfileData] = useState({
    pan: pan || '',
    assessmentYears: [],
    incomeTrends: [],
    deductionUtilization: [],
    refundHistory: [],
    anomalies: [],
    complianceScore: 0,
    lastFilingDate: null,
    nextDueDate: null,
  });

  // Load financial profile data
  const loadFinancialProfile = useCallback(async () => {
    try {
      setLoading(true);
      enterpriseDebugger.log('INFO', 'FinancialProfile', 'Loading financial profile', {
        pan: pan || 'N/A',
        user: user?.email,
        interactionMode,
      });

      // Call the actual API service
      const response = await financialProfileService.getFinancialProfile(pan);
      const profileData = response.data;

      // Profile data is already set via setProfileData
      setProfileData(profileData);

      // Generate insights
      generateInsights(profileData);

      enterpriseDebugger.log('SUCCESS', 'FinancialProfile', 'Financial profile loaded', {
        dataPoints: Object.keys(profileData).length,
        complianceScore: profileData.complianceScore,
      });

    } catch (err) {
      enterpriseDebugger.log('ERROR', 'FinancialProfile', 'Failed to load financial profile', {
        error: err.message,
        pan: pan || 'N/A',
      });

      // Fallback to mock data if API fails
      const mockData = {
        pan: pan || 'ABCDE1234F',
        assessmentYears: ['2023-24', '2022-23', '2021-22'],
        incomeTrends: [
          { year: '2023-24', totalIncome: 850000, growth: 12.5 },
          { year: '2022-23', totalIncome: 755000, growth: 8.2 },
          { year: '2021-22', totalIncome: 697000, growth: -2.1 },
        ],
        deductionUtilization: [
          { category: 'Section 80C', utilized: 150000, available: 150000, utilization: 100 },
          { category: 'Section 80D', utilized: 25000, available: 25000, utilization: 100 },
          { category: 'Section 80G', utilized: 5000, available: 5000, utilization: 100 },
          { category: 'HRA', utilized: 120000, available: 150000, utilization: 80 },
        ],
        refundHistory: [
          { year: '2023-24', refundAmount: 45000, status: 'processed' },
          { year: '2022-23', refundAmount: 32000, status: 'processed' },
          { year: '2021-22', refundAmount: 0, status: 'no_refund' },
        ],
        anomalies: [
          { type: 'warning', message: 'HRA deduction underutilized by ₹30,000', impact: 'medium' },
          { type: 'info', message: 'Consistent filing history maintained', impact: 'positive' },
        ],
        complianceScore: 92,
        lastFilingDate: '2024-07-15',
        nextDueDate: '2025-07-31',
      };

      setProfileData(mockData);
      generateInsights(mockData);

      setError('Using sample data - API connection failed');
    } finally {
      setLoading(false);
    }
  }, [pan, user?.email, interactionMode]);

  // Generate insights from financial data
  const generateInsights = (data) => {
    const newInsights = [];

    // Income growth insight
    const latestGrowth = data.incomeTrends[0]?.growth;
    if (latestGrowth > 10) {
      newInsights.push({
        type: 'positive',
        icon: TrendingUp,
        title: 'Strong Income Growth',
        description: `Your income grew by ${latestGrowth}% this year - excellent progress!`,
        action: 'Keep up the momentum',
      });
    }

    // Deduction optimization insight
    const underutilizedDeductions = data.deductionUtilization.filter(d => d.utilization < 90);
    if (underutilizedDeductions.length > 0) {
      newInsights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Tax Optimization Opportunity',
        description: `${underutilizedDeductions.length} deduction(s) underutilized`,
        action: 'Consider maximizing deductions',
      });
    }

    // Compliance insight
    if (data.complianceScore >= 90) {
      newInsights.push({
        type: 'positive',
        icon: CheckCircle,
        title: 'Excellent Compliance Record',
        description: 'You maintain a strong compliance history',
        action: 'Continue the good work',
      });
    }

    setInsights(newInsights);
  };

  useEffect(() => {
    if (pan) {
      loadFinancialProfile();
    } else {
      setError('PAN number is required to load financial profile');
      setLoading(false);
    }
  }, [pan, loadFinancialProfile]);

  const handleProceedToITRSelection = () => {
    enterpriseDebugger.log('INFO', 'FinancialProfile', 'Proceeding to ITR selection', {
      pan: pan || 'N/A',
      interactionMode,
      user: user?.email,
    });

    navigate('/itr-selection', {
      state: {
        pan,
        verificationResult,
        prefillData,
        isCAFiling,
        interactionMode,
        fromModeSelection,
        financialProfile: profileData,
      },
    });
  };

  const handleBackToModeSelection = () => {
    navigate('/interaction-mode-selection', {
      state: {
        pan,
        verificationResult,
        prefillData,
        isCAFiling,
      },
    });
  };

  const formatCurrency = (amount) => {
    return financialProfileService.formatCurrency(amount);
  };

  const getComplianceBadge = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    return 'Needs Attention';
  };

  if (loading) {
    return (
      <EnterpriseErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Financial Profile</h2>
            <p className="text-gray-600">Analyzing your financial history...</p>
          </div>
        </div>
      </EnterpriseErrorBoundary>
    );
  }

  if (error) {
    return (
      <EnterpriseErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Profile</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleBackToModeSelection}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </EnterpriseErrorBoundary>
    );
  }

  return (
    <EnterpriseErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToModeSelection}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Financial Profile</h1>
                  <p className="text-gray-600">PAN: {pan}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-600">Secure & Encrypted</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Compliance Score Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Compliance Score</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                profileData.complianceScore >= 90 ? 'bg-green-100 text-green-800' :
                profileData.complianceScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {getComplianceBadge(profileData.complianceScore)}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold text-gray-900">
                {profileData.complianceScore}%
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      profileData.complianceScore >= 90 ? 'bg-green-500' :
                      profileData.complianceScore >= 70 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${profileData.complianceScore}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Based on filing history and compliance record
                </p>
              </div>
            </div>
          </div>

          {/* Insights Cards */}
          {insights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {insights.map((insight, index) => (
                <div key={index} className={`rounded-lg border p-6 ${
                  insight.type === 'positive' ? 'border-green-200 bg-green-50' :
                  insight.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }`}>
                  <div className="flex items-start space-x-3">
                    <insight.icon className={`h-6 w-6 mt-1 ${
                      insight.type === 'positive' ? 'text-green-600' :
                      insight.type === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                    <div>
                      <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                      <p className="text-xs text-gray-500 mt-2">{insight.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Financial Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Income Trends */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                Income Trends
              </h3>
              <div className="space-y-3">
                {profileData.incomeTrends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{trend.year}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(trend.totalIncome)}</p>
                    </div>
                    <div className={`flex items-center space-x-1 ${
                      trend.growth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trend.growth > 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">{Math.abs(trend.growth)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deduction Utilization */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PieChart className="h-5 w-5 text-green-600 mr-2" />
                Deduction Utilization
              </h3>
              <div className="space-y-3">
                {profileData.deductionUtilization.map((deduction, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">{deduction.category}</p>
                      <span className="text-sm text-gray-600">{deduction.utilization}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          deduction.utilization >= 90 ? 'bg-green-500' :
                          deduction.utilization >= 70 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${deduction.utilization}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(deduction.utilized)} / {formatCurrency(deduction.available)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Refund History */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 text-green-600 mr-2" />
              Refund History
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profileData.refundHistory.map((refund, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{refund.year}</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      refund.status === 'processed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {refund.status === 'processed' ? 'Processed' : 'No Refund'}
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {refund.refundAmount > 0 ? formatCurrency(refund.refundAmount) : 'No Refund'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-4">
              <Info className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">
                  Next filing due: <span className="font-medium text-gray-900">{profileData.nextDueDate}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Last filed: {profileData.lastFilingDate}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToModeSelection}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleProceedToITRSelection}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>Proceed to ITR Selection</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </EnterpriseErrorBoundary>
  );
};

export default FinancialProfile;
