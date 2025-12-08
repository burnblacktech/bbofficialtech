// =====================================================
// ADMIN DASHBOARD REAL-TIME HOOK
// Provides real-time updates for admin dashboard via WebSocket
// =====================================================

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import wsService, { DASHBOARD_EVENTS, useWebSocket } from '../services/websocketService';

/**
 * Hook for admin dashboard real-time updates
 * Subscribes to platform-wide WebSocket events and invalidates React Query cache
 */
export const useAdminDashboardRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || user?.userId;
  const token = localStorage.getItem('token');
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'PLATFORM_ADMIN';

  const { connectionStatus, isConnected, subscribe, unsubscribe } = useWebSocket(userId, token);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [platformUpdates, setPlatformUpdates] = useState([]);

  // Subscribe to admin-specific events
  useEffect(() => {
    if (!isConnected || !isAdmin || !userId) return;

    // Dashboard stats updates
    const unsubscribeStats = subscribe(DASHBOARD_EVENTS.DASHBOARD_STATS_UPDATE, (payload) => {
      setLastUpdate(Date.now());
      setPlatformUpdates(prev => [...prev.slice(-9), { type: 'stats', payload, timestamp: Date.now() }]);
      // Invalidate admin dashboard stats
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    });

    // Revenue updates
    const unsubscribeRevenue = subscribe(DASHBOARD_EVENTS.REVENUE_UPDATE, (payload) => {
      setLastUpdate(Date.now());
      setPlatformUpdates(prev => [...prev.slice(-9), { type: 'revenue', payload, timestamp: Date.now() }]);
      // Invalidate revenue analytics
      queryClient.invalidateQueries({ queryKey: ['adminRevenueAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['adminChartData', 'revenue'] });
    });

    // User activity (new registrations, etc.)
    const unsubscribeActivity = subscribe(DASHBOARD_EVENTS.USER_ACTIVITY, (payload) => {
      setLastUpdate(Date.now());
      setPlatformUpdates(prev => [...prev.slice(-9), { type: 'activity', payload, timestamp: Date.now() }]);
      // Invalidate user analytics and activity feeds
      queryClient.invalidateQueries({ queryKey: ['adminRecentActivity'] });
      queryClient.invalidateQueries({ queryKey: ['adminUserAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    });

    // Filing status changes
    const unsubscribeFiling = subscribe(DASHBOARD_EVENTS.FILING_STATUS_CHANGE, (payload) => {
      setLastUpdate(Date.now());
      setPlatformUpdates(prev => [...prev.slice(-9), { type: 'filing', payload, timestamp: Date.now() }]);
      // Invalidate filing-related queries
      queryClient.invalidateQueries({ queryKey: ['adminFilings'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    });

    // System metrics updates
    const unsubscribeMetrics = subscribe(DASHBOARD_EVENTS.SYSTEM_METRICS_UPDATE, (payload) => {
      setLastUpdate(Date.now());
      setPlatformUpdates(prev => [...prev.slice(-9), { type: 'metrics', payload, timestamp: Date.now() }]);
      // Invalidate system health queries
      queryClient.invalidateQueries({ queryKey: ['adminSystemHealth'] });
      queryClient.invalidateQueries({ queryKey: ['adminSystemAlerts'] });
    });

    // Admin alerts
    const unsubscribeAlerts = subscribe(DASHBOARD_EVENTS.ADMIN_ALERT, (payload) => {
      setLastUpdate(Date.now());
      setPlatformUpdates(prev => [...prev.slice(-9), { type: 'alert', payload, timestamp: Date.now() }]);
      // Invalidate alerts
      queryClient.invalidateQueries({ queryKey: ['adminSystemAlerts'] });
    });

    return () => {
      unsubscribeStats();
      unsubscribeRevenue();
      unsubscribeActivity();
      unsubscribeFiling();
      unsubscribeMetrics();
      unsubscribeAlerts();
    };
  }, [isConnected, isAdmin, userId, subscribe, queryClient]);

  // Manual refresh function
  const refreshDashboard = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
    queryClient.invalidateQueries({ queryKey: ['adminRecentActivity'] });
    queryClient.invalidateQueries({ queryKey: ['adminSystemAlerts'] });
  }, [queryClient]);

  return {
    connectionStatus,
    isConnected,
    lastUpdate,
    platformUpdates,
    refreshDashboard,
  };
};

export default useAdminDashboardRealtime;

