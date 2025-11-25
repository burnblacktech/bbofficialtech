// =====================================================
// ADMIN DASHBOARD - PLATFORM CONTROL CENTER
// Comprehensive administrative interface for platform management
// =====================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, Typography } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, FadeInUp, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import {
  Users,
  FileText,
  MessageSquare,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Shield,
  Settings,
  BarChart3,
} from 'lucide-react';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  // Mock dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockData = {
        metrics: {
          newUsers: {
            today: 45,
            last7Days: 312,
            growth: 12.5,
          },
          itrFilings: {
            initiated: 189,
            completed: 156,
            completionRate: 82.5,
          },
          serviceTickets: {
            open: 23,
            resolved: 89,
            avgResolutionTime: '4.2 hours',
          },
          revenue: {
            today: 125000,
            last7Days: 875000,
            growth: 8.3,
          },
        },
        recentActivity: [
          {
            id: 1,
            type: 'user_signup',
            message: 'New user registered: john.doe@example.com',
            timestamp: new Date(Date.now() - 1000 * 60 * 15),
            status: 'success',
          },
          {
            id: 2,
            type: 'itr_filing',
            message: 'ITR filing completed for PAN: ABCDE1234F',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            status: 'success',
          },
          {
            id: 3,
            type: 'support_ticket',
            message: 'New support ticket created: #ST-2024-001',
            timestamp: new Date(Date.now() - 1000 * 60 * 45),
            status: 'warning',
          },
          {
            id: 4,
            type: 'payment',
            message: 'Payment received: ₹2,500 from user@example.com',
            timestamp: new Date(Date.now() - 1000 * 60 * 60),
            status: 'success',
          },
        ],
        systemHealth: {
          status: 'healthy',
          uptime: '99.9%',
          responseTime: '245ms',
          activeUsers: 1247,
          serverLoad: 65,
        },
        topPerformers: [
          {
            name: 'CA Firm Alpha',
            filings: 45,
            revenue: 112500,
            rating: 4.8,
          },
          {
            name: 'CA Firm Beta',
            filings: 38,
            revenue: 95000,
            rating: 4.6,
          },
          {
            name: 'CA Firm Gamma',
            filings: 32,
            revenue: 80000,
            rating: 4.7,
          },
        ],
      };

      setDashboardData(mockData);
      setLoading(false);
    };

    fetchDashboardData();
  }, [selectedTimeRange]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_signup': return <Users className="w-4 h-4" />;
      case 'itr_filing': return <FileText className="w-4 h-4" />;
      case 'support_ticket': return <MessageSquare className="w-4 h-4" />;
      case 'payment': return <DollarSign className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-success-600 bg-success-100';
      case 'warning': return 'text-warning-600 bg-warning-100';
      case 'error': return 'text-error-600 bg-error-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <PageTransition className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Typography.H1 className="mb-4">Loading Dashboard...</Typography.H1>
            <Typography.Body>Please wait while we load your admin dashboard.</Typography.Body>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Typography.H1 className="mb-2">Admin Dashboard</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Platform overview and management control center
            </Typography.Body>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
              Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StaggerItem>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography.Small className="text-neutral-600 mb-1">
                      New Users
                    </Typography.Small>
                    <Typography.H3 className="text-2xl font-bold text-neutral-900">
                      {dashboardData.metrics.newUsers.today}
                    </Typography.H3>
                    <Typography.Small className="text-success-600">
                      +{dashboardData.metrics.newUsers.growth}% from last week
                    </Typography.Small>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography.Small className="text-neutral-600 mb-1">
                      ITR Filings
                    </Typography.Small>
                    <Typography.H3 className="text-2xl font-bold text-neutral-900">
                      {dashboardData.metrics.itrFilings.completed}
                    </Typography.H3>
                    <Typography.Small className="text-success-600">
                      {dashboardData.metrics.itrFilings.completionRate}% completion rate
                    </Typography.Small>
                  </div>
                  <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-success-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography.Small className="text-neutral-600 mb-1">
                      Open Tickets
                    </Typography.Small>
                    <Typography.H3 className="text-2xl font-bold text-neutral-900">
                      {dashboardData.metrics.serviceTickets.open}
                    </Typography.H3>
                    <Typography.Small className="text-neutral-600">
                      Avg resolution: {dashboardData.metrics.serviceTickets.avgResolutionTime}
                    </Typography.Small>
                  </div>
                  <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-warning-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography.Small className="text-neutral-600 mb-1">
                      Revenue
                    </Typography.Small>
                    <Typography.H3 className="text-2xl font-bold text-neutral-900">
                      {formatCurrency(dashboardData.metrics.revenue.today)}
                    </Typography.H3>
                    <Typography.Small className="text-success-600">
                      +{dashboardData.metrics.revenue.growth}% from last week
                    </Typography.Small>
                  </div>
                  <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-secondary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* System Health & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-primary-600" />
                <span>System Health</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Typography.Small className="text-neutral-600">
                    Status
                  </Typography.Small>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success-500 rounded-full" />
                    <Typography.Small className="text-success-600 font-medium">
                      {dashboardData.systemHealth.status.toUpperCase()}
                    </Typography.Small>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Typography.Small className="text-neutral-600">
                    Uptime
                  </Typography.Small>
                  <Typography.Small className="font-medium">
                    {dashboardData.systemHealth.uptime}
                  </Typography.Small>
                </div>
                <div className="flex items-center justify-between">
                  <Typography.Small className="text-neutral-600">
                    Response Time
                  </Typography.Small>
                  <Typography.Small className="font-medium">
                    {dashboardData.systemHealth.responseTime}
                  </Typography.Small>
                </div>
                <div className="flex items-center justify-between">
                  <Typography.Small className="text-neutral-600">
                    Active Users
                  </Typography.Small>
                  <Typography.Small className="font-medium">
                    {dashboardData.systemHealth.activeUsers.toLocaleString()}
                  </Typography.Small>
                </div>
                <div className="flex items-center justify-between">
                  <Typography.Small className="text-neutral-600">
                    Server Load
                  </Typography.Small>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-neutral-200 rounded-full">
                      <div
                        className="h-2 bg-primary-500 rounded-full"
                        style={{ width: `${dashboardData.systemHealth.serverLoad}%` }}
                      />
                    </div>
                    <Typography.Small className="font-medium">
                      {dashboardData.systemHealth.serverLoad}%
                    </Typography.Small>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary-600" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-3 bg-neutral-50 rounded-lg"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor(activity.status)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <Typography.Small className="text-neutral-700">
                        {activity.message}
                      </Typography.Small>
                      <Typography.Small className="text-neutral-500">
                        {formatTimeAgo(activity.timestamp)}
                      </Typography.Small>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <span>Top Performing CA Firms</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.topPerformers.map((firm, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <span className="text-primary-600 font-medium">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <Typography.Small className="font-medium text-neutral-700">
                        {firm.name}
                      </Typography.Small>
                      <Typography.Small className="text-neutral-500">
                        {firm.filings} filings • Rating: {firm.rating}/5
                      </Typography.Small>
                    </div>
                  </div>
                  <div className="text-right">
                    <Typography.Small className="font-medium text-neutral-700">
                      {formatCurrency(firm.revenue)}
                    </Typography.Small>
                    <Typography.Small className="text-neutral-500">
                      Revenue
                    </Typography.Small>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-primary-600" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="flex items-center space-x-3 p-4 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors">
                <Users className="w-5 h-5 text-primary-600" />
                <Typography.Small className="font-medium text-primary-700">
                  Manage Users
                </Typography.Small>
              </button>
              <button className="flex items-center space-x-3 p-4 bg-success-50 border border-success-200 rounded-lg hover:bg-success-100 transition-colors">
                <MessageSquare className="w-5 h-5 text-success-600" />
                <Typography.Small className="font-medium text-success-700">
                  Support Tickets
                </Typography.Small>
              </button>
              <button className="flex items-center space-x-3 p-4 bg-warning-50 border border-warning-200 rounded-lg hover:bg-warning-100 transition-colors">
                <DollarSign className="w-5 h-5 text-warning-600" />
                <Typography.Small className="font-medium text-warning-700">
                  Pricing Control
                </Typography.Small>
              </button>
              <button className="flex items-center space-x-3 p-4 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-colors">
                <Shield className="w-5 h-5 text-neutral-600" />
                <Typography.Small className="font-medium text-neutral-700">
                  System Settings
                </Typography.Small>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default AdminDashboard;
