// =====================================================
// USER DASHBOARD HOOKS
// React Query hooks for user dashboard data
// =====================================================

import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/core/APIClient';
import itrService from '../services/api/itrService';
import { validateDashboardStats, validateFilings, validateRefunds } from '../utils/api-validation';
import wsService from '../services/websocketService';

/**
 * Hook to fetch user dashboard stats with smart polling
 */
export const useUserDashboardStats = (userId, enabled = true) => {
  return useQuery({
    queryKey: ['dashboardStats', userId],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/users/dashboard');
        // Handle error response format
        if (response.data?.success === false && response.data?.error) {
          throw new Error(response.data.error.message || 'Failed to fetch dashboard stats');
        }
        if (response.data?.success && response.data?.data) {
          return validateDashboardStats(response.data.data);
        }
        throw new Error('Failed to fetch dashboard stats');
      } catch (error) {
        // Ensure we throw a proper Error object with a message string
        const errorMessage = error?.response?.data?.error?.message ||
                            error?.response?.data?.message ||
                            error?.message ||
                            'Failed to fetch dashboard stats';
        throw new Error(errorMessage);
      }
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
      try {
        const response = await itrService.getUserITRs();
        // Handle both success and error response formats
        if (response?.success === false && response?.error) {
          throw new Error(response.error.message || 'Failed to fetch filings');
        }
        const filings = validateFilings(response?.data || response?.filings || response);
        return {
          all: filings,
          ongoing: filings.filter(f => ['draft', 'paused'].includes(f.status)),
          completed: filings.filter(f => ['submitted', 'acknowledged', 'processed'].includes(f.status)),
        };
      } catch (error) {
        // Ensure we throw a proper Error object with a message string
        const errorMessage = error?.response?.data?.error?.message ||
                            error?.response?.data?.message ||
                            error?.message ||
                            'Failed to fetch filings';
        throw new Error(errorMessage);
      }
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

/**
 * Hook to fetch user drafts for “Resume Hub” behavior.
 * Drafts are returned latest-first by the backend.
 */
export const useUserDrafts = (userId, enabled = true) => {
  return useQuery({
    queryKey: ['userDrafts', userId],
    queryFn: async () => {
      try {
        const response = await itrService.getUserDrafts({ page: 1, limit: 50 });
        if (response?.success === false && response?.error) {
          throw new Error(response.error.message || 'Failed to fetch drafts');
        }
        const drafts = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
        return drafts;
      } catch (error) {
        const errorMessage = error?.response?.data?.error?.message ||
                            error?.response?.data?.message ||
                            error?.message ||
                            'Failed to fetch drafts';
        throw new Error(errorMessage);
      }
    },
    enabled: enabled && !!userId,
    staleTime: 30 * 1000,
    retry: 1,
  });
};

