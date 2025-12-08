// =====================================================
// ADMIN ANALYTICS HOOKS
// React Query hooks for admin dashboard & analytics
// =====================================================

import { useQuery } from '@tanstack/react-query';
import { adminAnalyticsService } from '../services/analytics.service';
import wsService from '../../../../services/websocketService';

export const useAdminDashboardStats = () => {
  return useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: () => adminAnalyticsService.getDashboardStats(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: (query) => {
      // Use longer interval when WebSocket is connected (fallback polling)
      // WebSocket will trigger cache invalidation for real-time updates
      return 60 * 1000; // 60 seconds as fallback
    },
  });
};

export const useAdminChartData = (type, params = {}) => {
  return useQuery({
    queryKey: ['adminChartData', type, params],
    queryFn: () => adminAnalyticsService.getChartData(type, params),
    staleTime: 5 * 60 * 1000,
    enabled: !!type,
  });
};

export const useAdminSystemAlerts = () => {
  return useQuery({
    queryKey: ['adminSystemAlerts'],
    queryFn: () => adminAnalyticsService.getSystemAlerts(),
    staleTime: 1 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });
};

export const useAdminRecentActivity = (params = {}) => {
  return useQuery({
    queryKey: ['adminRecentActivity', params],
    queryFn: () => adminAnalyticsService.getRecentActivity(params),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // 30 seconds - more frequent for activity feed
  });
};

export const useAdminUserAnalytics = (params = {}) => {
  return useQuery({
    queryKey: ['adminUserAnalytics', params],
    queryFn: () => adminAnalyticsService.getUserAnalytics(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useAdminRevenueAnalytics = (params = {}) => {
  return useQuery({
    queryKey: ['adminRevenueAnalytics', params],
    queryFn: () => adminAnalyticsService.getRevenueAnalytics(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useAdminAnalytics = (timeRange = '30d', type = 'overview', dateFrom, dateTo) => {
  return useQuery({
    queryKey: ['adminAnalytics', timeRange, type, dateFrom, dateTo],
    queryFn: () => adminAnalyticsService.getAnalytics({
      timeRange,
      type,
      dateFrom,
      dateTo,
    }),
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
  });
};

export const useAdminCAAnalytics = (timeRange = '30d', dateFrom, dateTo) => {
  return useQuery({
    queryKey: ['adminCAAnalytics', timeRange, dateFrom, dateTo],
    queryFn: () => adminAnalyticsService.getCAAnalytics({
      timeRange,
      dateFrom,
      dateTo,
    }),
    staleTime: 5 * 60 * 1000,
  });
};

