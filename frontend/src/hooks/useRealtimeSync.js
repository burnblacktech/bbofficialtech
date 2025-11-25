// useRealtimeSync Hook
// Provides real-time data synchronization functionality

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useRealtimeSync = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);

  const syncData = useCallback(async (data) => {
    try {
      const result = await api.syncData(data);
      setLastSync(new Date());
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      const status = await api.checkConnection();
      setIsConnected(status.connected);
      return status;
    } catch (err) {
      setIsConnected(false);
      setError(err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    checkConnection();

    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    isConnected,
    lastSync,
    error,
    syncData,
    checkConnection,
  };
};

export default useRealtimeSync;
