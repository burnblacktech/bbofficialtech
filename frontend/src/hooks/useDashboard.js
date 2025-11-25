import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';

const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    userStats: {
      totalFilings: 0,
      completedFilings: 0,
      pendingFilings: 0,
      totalTaxSaved: 0,
    },
    recentActivity: [],
    notifications: [],
    loading: false,
    error: null,
  });

  const fetchDashboardData = useCallback(async () => {
    setDashboardData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Call the real API endpoint
      const response = await apiClient.get('/dashboard/summary');

      if (response.data.success) {
        const data = response.data.data;
        setDashboardData(prev => ({
          ...prev,
          userStats: {
            totalFilings: data.stats?.totalFilings || 0,
            completedFilings: data.stats?.completedFilings || 0,
            pendingFilings: data.stats?.activeFilings || 0,
            totalTaxSaved: 0, // Not provided by API
          },
          recentActivity: data.recentActivity || [],
          notifications: data.notifications || [],
          loading: false,
        }));
      } else {
        throw new Error(response.data.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setDashboardData(prev => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    summary: {
      filingCounts: {
        total: dashboardData.userStats.totalFilings,
        inProgress: dashboardData.userStats.pendingFilings,
        acknowledged: dashboardData.userStats.completedFilings,
      },
      ticketCounts: {
        total: 0, // Will be implemented with service tickets
      },
    },
    isLoading: dashboardData.loading,
    error: dashboardData.error,
    refresh: fetchDashboardData,
    recentActivity: dashboardData.recentActivity,
    notifications: dashboardData.notifications,
  };
};

export default useDashboard;
