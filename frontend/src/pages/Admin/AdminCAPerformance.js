// =====================================================
// ADMIN CA PERFORMANCE DASHBOARD
// CA performance metrics with DesignSystem components
// =====================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CardHeaderTitleContent, Typography } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import {
  Users,
  FileText,
  IndianRupee,
  Clock,
  Star,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import adminService from '../../services/api/adminService';
import toast from 'react-hot-toast';
import { DataEntryPage } from '../../components/templates';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const AdminCAPerformance = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);
  const [dateRange, setDateRange] = useState('30d');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      loadPerformanceData();
    }
  }, [id, dateRange]);

  const loadPerformanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getCAPerformance(id);
      setPerformanceData(data);
    } catch (error) {
      console.error('Failed to load CA performance:', error);
      setError('Failed to load performance data');
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {

    return (
      <PageTransition className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            <Typography.Body className="text-neutral-600">Loading performance data...</Typography.Body>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error || !performanceData) {
    return (
      <PageTransition className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-error-500" />
              </div>
              <Typography.H3 className="mb-2">Error Loading Data</Typography.H3>
              <Typography.Body className="text-neutral-600 mb-6">
                {error || 'Performance data not available'}
              </Typography.Body>
              <Button onClick={() => navigate('/admin/ca-firms')}>
                Back to CA Firms
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  const {
    firmName,
    completedFilings,
    totalFilings,
    totalClients,
    revenue,
    revenueBreakdown,
    averageCompletionTime,
    clientSatisfactionScore,
    reviewCount,
    errorRate,
    averageResponseTime } = performanceData;

  const completionRate = totalFilings > 0
    ? ((completedFilings / totalFilings) * 100).toFixed(1)
    : 0;

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/ca-firms')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <Typography.H1 className="mb-1">{firmName}</Typography.H1>
              <Typography.Small className="text-neutral-500">Performance Dashboard</Typography.Small>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Button variant="outline" size="sm" onClick={loadPerformanceData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Performance Metrics Cards */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography.Small className="text-neutral-500 mb-1">Completed Filings</Typography.Small>
                    <Typography.H3>{completedFilings}</Typography.H3>
                    <Typography.Small className={completionRate > 80 ? 'text-success-600' : completionRate > 60 ? 'text-warning-600' : 'text-error-600'}>
                      {completionRate}% completion rate
                    </Typography.Small>
                  </div>
                  <div className="w-12 h-12 bg-info-100 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-info-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography.Small className="text-neutral-500 mb-1">Total Clients</Typography.Small>
                    <Typography.H3>{totalClients}</Typography.H3>
                    <Typography.Small className="text-neutral-500">Active clients</Typography.Small>
                  </div>
                  <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-success-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography.Small className="text-neutral-500 mb-1">Revenue Generated</Typography.Small>
                    <Typography.H3>₹{(revenue / 1000).toFixed(1)}K</Typography.H3>
                    <Typography.Small className="text-neutral-500">Total revenue</Typography.Small>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <IndianRupee className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography.Small className="text-neutral-500 mb-1">Satisfaction Score</Typography.Small>
                    <Typography.H3>{clientSatisfactionScore.toFixed(1)}</Typography.H3>
                    <Typography.Small className="text-neutral-500">{reviewCount} reviews</Typography.Small>
                  </div>
                  <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                    <Star className="h-6 w-6 text-secondary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-neutral-500" />
                  <Typography.Body>Average Completion Time</Typography.Body>
                </div>
                <Typography.Body className="font-semibold">
                  {averageCompletionTime.toFixed(1)} hours
                </Typography.Body>
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-neutral-500" />
                  <Typography.Body>Average Response Time</Typography.Body>
                </div>
                <Typography.Body className="font-semibold">
                  {averageResponseTime.toFixed(1)} hours
                </Typography.Body>
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-neutral-500" />
                  <Typography.Body>Error Rate</Typography.Body>
                </div>
                <Typography.Body className={`font-semibold ${errorRate < 5 ? 'text-success-600' : errorRate < 10 ? 'text-warning-600' : 'text-error-600'
                  }`}>
                  {errorRate}%
                </Typography.Body>
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-neutral-500" />
                  <Typography.Body>Total Filings</Typography.Body>
                </div>
                <Typography.Body className="font-semibold">
                  {totalFilings}
                </Typography.Body>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(revenueBreakdown || {}).length > 0 ? (
                <>
                  {Object.entries(revenueBreakdown).map(([itrType, amount]) => (
                    <div key={itrType} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                      <Typography.Body>{itrType}</Typography.Body>
                      <Typography.Body className="font-semibold">
                        ₹{amount.toLocaleString('en-IN')}
                      </Typography.Body>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-neutral-200">
                    <div className="flex items-center justify-between">
                      <Typography.Body className="font-semibold">Total Revenue</Typography.Body>
                      <Typography.H3 className="text-primary-600">
                        ₹{revenue.toLocaleString('en-IN')}
                      </Typography.H3>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <Typography.Body>No revenue data available</Typography.Body>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-neutral-50 rounded-xl">
                <Typography.H1 className="text-neutral-900">{completedFilings}</Typography.H1>
                <Typography.Small className="text-neutral-600 mt-1">Completed Filings</Typography.Small>
              </div>
              <div className="text-center p-6 bg-neutral-50 rounded-xl">
                <Typography.H1 className="text-neutral-900">{totalClients}</Typography.H1>
                <Typography.Small className="text-neutral-600 mt-1">Total Clients</Typography.Small>
              </div>
              <div className="text-center p-6 bg-neutral-50 rounded-xl">
                <Typography.H1 className="text-neutral-900">{reviewCount}</Typography.H1>
                <Typography.Small className="text-neutral-600 mt-1">Reviews</Typography.Small>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default AdminCAPerformance;
