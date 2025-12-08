// =====================================================
// USER DASHBOARD HOOKS
// React Query hooks for user dashboard data
// =====================================================

import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/core/APIClient';
import itrService from '../services/api/itrService';
import { validateDashboardStats, validateFilings, validateRefunds } from '../lib/utils/api-validation';
import wsService from '../services/websocketService';

/**
 * Hook to fetch user dashboard stats with smart polling
 */
export const useUserDashboardStats = (userId, enabled = true) => {
  return useQuery({
    queryKey: ['dashboardStats', userId],
    queryFn: async () => {
      const response = await apiClient.get('/users/dashboard');
      if (response.data?.success && response.data?.data) {
        return validateDashboardStats(response.data.data);
      }
      throw new Error('Failed to fetch dashboard stats');
    },
    enabled: enabled && !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: (query) => {
      // Smart polling: longer interval when WebSocket connected, shorter when disconnected
      const isWebSocketConnected = wsService.isConnected();
      const isTabVisible = !document.hidden;

      if (!isTabVisible) {
        return false; // Pause polling when tab is hidden
      }

      if (isWebSocketConnected) {
        return 60 * 1000; // 60 seconds when WebSocket connected (fallback)
      }

      return 30 * 1000; // 30 seconds when WebSocket disconnected
    },
    retry: 2,
  });
};

/**
 * Hook to fetch user filings with smart polling
 */
export const useUserFilings = (userId, enabled = true) => {
  return useQuery({
    queryKey: ['userFilings', userId],
    queryFn: async () => {
      const response = await itrService.getUserITRs();
      const filings = validateFilings(response.data || response);
      return {
        all: filings,
        ongoing: filings.filter(f => ['draft', 'paused'].includes(f.status)),
        completed: filings.filter(f => ['submitted', 'acknowledged', 'processed'].includes(f.status)),
      };
    },
    enabled: enabled && !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: (query) => {
      const isWebSocketConnected = wsService.isConnected();
      const isTabVisible = !document.hidden;

      if (!isTabVisible) {
        return false; // Pause polling when tab is hidden
      }

      if (isWebSocketConnected) {
        return 60 * 1000; // 60 seconds when WebSocket connected
      }

      return 30 * 1000; // 30 seconds when WebSocket disconnected
    },
    retry: 2,
  });
};

/**
 * Hook to fetch user refunds
 */
export const useUserRefunds = (userId, enabled = true) => {
  return useQuery({
    queryKey: ['userRefunds', userId],
    queryFn: async () => {
      const response = await apiClient.get('/itr/refunds/history');
      if (response.data?.success && response.data?.data) {
        return validateRefunds(response.data.data);
      } else if (response.data?.success && response.data?.refunds) {
        return validateRefunds(response.data);
      }
      return {
        pendingRefunds: [],
        creditedRefunds: [],
        totalPendingAmount: 0,
        totalCreditedAmount: 0,
      };
    },
    enabled: enabled && !!userId,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Poll every minute
    retry: 1,
  });
};

