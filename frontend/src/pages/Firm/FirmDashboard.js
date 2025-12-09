// =====================================================
// FIRM DASHBOARD PAGE
// Displays firm-level statistics and overview
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  FileText,
  Clock,
  TrendingUp,
  AlertCircle,
  Plus,
  ArrowRight,
  Loader,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';
import apiClient from '../../services/core/APIClient';

const FirmDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [firmId, setFirmId] = useState(null);

  useEffect(() => {
    // Get firm ID from user context or URL params
    const fetchFirmId = async () => {
      try {
        const response = await apiClient.get('/user/profile');
        if (response.data.data?.caFirmId) {
          setFirmId(response.data.data.caFirmId);
          fetchDashboardData(response.data.data.caFirmId);
        } else {
          toast.error('You are not associated with a CA firm.');
          navigate('/dashboard');
        }
      } catch (error) {
        toast.error('Failed to load firm information.');
        navigate('/dashboard');
      }
    };

    fetchFirmId();
  }, [navigate]);

  const fetchDashboardData = async (id) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/firms/${id}/dashboard`);
      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        toast.error('Failed to load dashboard data.');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load dashboard.');
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Dashboard Data</h2>
          <p className="text-gray-600 mb-4">Unable to load firm dashboard data.</p>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const { firm, stats, queue } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{firm.name}</h1>
                <p className="text-xs text-gray-500">Firm Dashboard</p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate(`/firm/${firmId}/clients/new`)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Client</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-7xl mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{stats.staff.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-4 text-xs text-gray-500">
              {Object.entries(stats.staff.byRole || {}).map(([role, count]) => (
                <span key={role} className="mr-2">
                  {role}: {count}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Clients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.clients.active}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/firm/${firmId}/clients`)}
                className="text-xs"
              >
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Filings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.filings.active}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{queue?.pending || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-gold-600" />
            </div>
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/firm/${firmId}/review-queue`)}
                className="text-xs"
              >
                View Queue <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="secondary"
              onClick={() => navigate(`/firm/${firmId}/clients/new`)}
              className="flex items-center justify-center space-x-2 h-20"
            >
              <Plus className="w-5 h-5" />
              <span>Onboard New Client</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/firm/${firmId}/staff`)}
              className="flex items-center justify-center space-x-2 h-20"
            >
              <Users className="w-5 h-5" />
              <span>Manage Staff</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/firm/${firmId}/review-queue`)}
              className="flex items-center justify-center space-x-2 h-20"
            >
              <Clock className="w-5 h-5" />
              <span>Review Queue</span>
            </Button>
          </div>
        </Card>

        {/* Queue Statistics */}
        {queue && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Queue Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{queue.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{queue.inReview}</p>
                <p className="text-sm text-gray-600">In Review</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{queue.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gold-600">{queue.byPriority?.URGENT || 0}</p>
                <p className="text-sm text-gray-600">Urgent</p>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default FirmDashboard;

