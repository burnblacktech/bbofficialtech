// =====================================================
// USER DASHBOARD REAL-TIME HOOK
// Provides real-time updates for user dashboard via WebSocket
// =====================================================

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import wsService, { DASHBOARD_EVENTS, useWebSocket } from '../services/websocketService';

/**
 * Hook for user dashboard real-time updates
 * Subscribes to user-specific WebSocket events and invalidates React Query cache
 */
export const useDashboardRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || user?.userId;
  const token = localStorage.getItem('token');

  const { connectionStatus, isConnected, subscribe, unsubscribe } = useWebSocket(userId, token);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [statsUpdate, setStatsUpdate] = useState(null);

  // Subscribe to dashboard stats updates
  useEffect(() => {
    if (!isConnected || !userId) return;

    const unsubscribeStats = subscribe(DASHBOARD_EVENTS.DASHBOARD_STATS_UPDATE, (payload) => {
      if (payload.userId === userId) {
        setStatsUpdate(payload);
        setLastUpdate(Date.now());
        // Invalidate dashboard stats query
        queryClient.invalidateQueries({ queryKey: ['dashboardStats', userId] });
      }
    });

    const unsubscribeFiling = subscribe(DASHBOARD_EVENTS.FILING_STATUS_CHANGE, (payload) => {
      if (payload.userId === userId) {
        setLastUpdate(Date.now());
        // Invalidate filing-related queries
        queryClient.invalidateQueries({ queryKey: ['userFilings', userId] });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats', userId] });
        if (payload.filingId) {
          queryClient.invalidateQueries({ queryKey: ['filing', payload.filingId] });
        }
      }
    });

    const unsubscribeActivity = subscribe(DASHBOARD_EVENTS.USER_ACTIVITY, (payload) => {
      if (payload.userId === userId) {
        setLastUpdate(Date.now());
        // Invalidate activity feed
        queryClient.invalidateQueries({ queryKey: ['recentActivity', userId] });
      }
    });

    return () => {
      unsubscribeStats();
      unsubscribeFiling();
      unsubscribeActivity();
    };
  }, [isConnected, userId, subscribe, queryClient]);

  // Manual refresh function
  const refreshDashboard = useCallback(() => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', userId] });
      queryClient.invalidateQueries({ queryKey: ['userFilings', userId] });
      queryClient.invalidateQueries({ queryKey: ['recentActivity', userId] });
    }
  }, [userId, queryClient]);

  return {
    connectionStatus,
    isConnected,
    lastUpdate,
    statsUpdate,
    refreshDashboard,
  };
};

export default useDashboardRealtime;

