// =====================================================
// SMART POLLING HOOK
// Implements WebSocket-aware polling with tab visibility handling
// =====================================================

import { useEffect, useRef, useState } from 'react';
import wsService from '../services/websocketService';

/**
 * Hook for smart polling that adjusts based on WebSocket connection and tab visibility
 * @param {Function} refetchFn - Function to call for refetching data
 * @param {number} pollingInterval - Base polling interval in ms (default: 30000)
 * @param {boolean} enabled - Whether polling is enabled
 */
export const useSmartPolling = (refetchFn, pollingInterval = 30000, enabled = true) => {
  const [isTabVisible, setIsTabVisible] = useState(true);
  const intervalRef = useRef(null);
  const lastRefetchRef = useRef(Date.now());

  // Monitor tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Smart polling logic
  useEffect(() => {
    if (!enabled || !refetchFn) return;

    const isWebSocketConnected = wsService.isConnected();
    
    // Calculate polling interval:
    // - If WebSocket connected: use longer interval (60s) as fallback
    // - If WebSocket disconnected: use shorter interval (15-30s)
    // - If tab hidden: pause polling
    const getPollingInterval = () => {
      if (!isTabVisible) {
        return null; // Pause polling when tab is hidden
      }
      
      if (isWebSocketConnected) {
        return Math.max(pollingInterval * 2, 60000); // Longer interval when WS connected
      }
      
      return Math.min(pollingInterval, 30000); // Shorter interval when WS disconnected
    };

    const interval = getPollingInterval();
    
    if (interval === null) {
      // Tab is hidden, pause polling
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      const timeSinceLastRefetch = Date.now() - lastRefetchRef.current;
      
      // Only refetch if enough time has passed
      if (timeSinceLastRefetch >= interval) {
        lastRefetchRef.current = Date.now();
        refetchFn();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, refetchFn, pollingInterval, isTabVisible]);

  return {
    isTabVisible,
    isPolling: intervalRef.current !== null,
  };
};

export default useSmartPolling;

