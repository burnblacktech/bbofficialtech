import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

// Dashboard-specific event types
export const DASHBOARD_EVENTS = {
  DASHBOARD_STATS_UPDATE: 'DASHBOARD_STATS_UPDATE',
  FILING_STATUS_CHANGE: 'FILING_STATUS_CHANGE',
  REVENUE_UPDATE: 'REVENUE_UPDATE',
  USER_ACTIVITY: 'USER_ACTIVITY',
  SYSTEM_METRICS_UPDATE: 'SYSTEM_METRICS_UPDATE',
  ADMIN_ALERT: 'ADMIN_ALERT',
  FILING_UPDATE: 'FILING_UPDATE',
  ACK_RECEIVED: 'ACK_RECEIVED',
  ERI_STATUS: 'ERI_STATUS',
  SYSTEM_ALERT: 'SYSTEM_ALERT',
};

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.listeners = new Map();
    this.isConnecting = false;
    this.queryClient = null; // Will be set by setQueryClient
    this.connectionStatusListeners = new Set();
    this.lastMessageTime = null;
  }

  /**
   * Set React Query client for cache invalidation
   */
  setQueryClient(queryClient) {
    this.queryClient = queryClient;
  }

  connect(userId, token) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:3001'}/ws?userId=${userId}&token=${token}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // WebSocket connected
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.lastMessageTime = Date.now();
        this.notifyConnectionStatus('connected');
        // Don't show toast on initial connection to avoid spam
        if (this.reconnectAttempts > 0) {
          toast.success('Reconnected to live updates');
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          // Error parsing WebSocket message - silently fail
          // In production, could log to error tracking service
        }
      };

      this.ws.onclose = () => {
        // WebSocket disconnected
        this.isConnecting = false;
        this.notifyConnectionStatus('disconnected');
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.notifyConnectionStatus('error');
        if (this.reconnectAttempts === 0) {
          toast.error('Connection error. Retrying...');
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      // Attempting to reconnect

      setTimeout(() => {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        if (userId && token) {
          this.connect(userId, token);
        }
      }, this.reconnectInterval);
    } else {
      // Max reconnection attempts reached
      toast.error('Unable to connect to live updates');
    }
  }

  handleMessage(data) {
    const { type, payload } = data;
    this.lastMessageTime = Date.now();

    // Invalidate React Query cache for dashboard-related events
    if (this.queryClient) {
      this.invalidateCacheForEvent(type, payload);
    }

    // Notify all listeners for this event type
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error('Error in WebSocket listener:', error);
        }
      });
    }

    // Handle specific message types
    switch (type) {
      case DASHBOARD_EVENTS.FILING_UPDATE:
      case DASHBOARD_EVENTS.FILING_STATUS_CHANGE:
        if (payload.showToast !== false) {
          toast.success(`Filing ${payload.status}: ${payload.filingId || payload.id}`);
        }
        break;
      case DASHBOARD_EVENTS.ACK_RECEIVED:
        if (payload.showToast !== false) {
          toast.success(`Acknowledgement received: ${payload.ackNumber}`);
        }
        break;
      case DASHBOARD_EVENTS.ERI_STATUS:
        if (payload.showToast !== false) {
          toast.info(`ERI Status: ${payload.status}`);
        }
        break;
      case DASHBOARD_EVENTS.SYSTEM_ALERT:
      case DASHBOARD_EVENTS.ADMIN_ALERT:
        if (payload.showToast !== false) {
          toast.error(`Alert: ${payload.message || payload.title}`);
        }
        break;
      case DASHBOARD_EVENTS.REVENUE_UPDATE:
        // Silent update for revenue - no toast
        break;
      case DASHBOARD_EVENTS.DASHBOARD_STATS_UPDATE:
        // Silent update for stats - no toast
        break;
      case DASHBOARD_EVENTS.USER_ACTIVITY:
        // Silent update for activity - no toast
        break;
      default:
        // Unhandled WebSocket message - silently ignore
        break;
    }
  }

  /**
   * Invalidate React Query cache based on event type
   */
  invalidateCacheForEvent(eventType, payload) {
    if (!this.queryClient) return;

    switch (eventType) {
      case DASHBOARD_EVENTS.DASHBOARD_STATS_UPDATE:
        // Invalidate user dashboard stats
        if (payload.userId) {
          this.queryClient.invalidateQueries({ queryKey: ['dashboardStats', payload.userId] });
        }
        // Invalidate admin dashboard stats
        this.queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
        break;

      case DASHBOARD_EVENTS.FILING_STATUS_CHANGE:
      case DASHBOARD_EVENTS.FILING_UPDATE:
        // Invalidate filing-related queries
        if (payload.userId) {
          this.queryClient.invalidateQueries({ queryKey: ['userFilings', payload.userId] });
          this.queryClient.invalidateQueries({ queryKey: ['dashboardStats', payload.userId] });
        }
        if (payload.filingId) {
          this.queryClient.invalidateQueries({ queryKey: ['filing', payload.filingId] });
        }
        // Invalidate admin filings
        this.queryClient.invalidateQueries({ queryKey: ['adminFilings'] });
        break;

      case DASHBOARD_EVENTS.REVENUE_UPDATE:
        // Invalidate revenue analytics
        this.queryClient.invalidateQueries({ queryKey: ['adminRevenueAnalytics'] });
        this.queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
        this.queryClient.invalidateQueries({ queryKey: ['adminChartData', 'revenue'] });
        break;

      case DASHBOARD_EVENTS.USER_ACTIVITY:
        // Invalidate activity feeds
        if (payload.userId) {
          this.queryClient.invalidateQueries({ queryKey: ['recentActivity', payload.userId] });
        }
        this.queryClient.invalidateQueries({ queryKey: ['adminRecentActivity'] });
        break;

      case DASHBOARD_EVENTS.SYSTEM_METRICS_UPDATE:
        // Invalidate system health metrics
        this.queryClient.invalidateQueries({ queryKey: ['adminSystemHealth'] });
        this.queryClient.invalidateQueries({ queryKey: ['adminSystemAlerts'] });
        break;

      case DASHBOARD_EVENTS.ADMIN_ALERT:
        // Invalidate admin alerts
        this.queryClient.invalidateQueries({ queryKey: ['adminSystemAlerts'] });
        break;

      default:
        // For unknown events, do selective invalidation if payload has hints
        if (payload.userId) {
          this.queryClient.invalidateQueries({ queryKey: ['dashboardStats', payload.userId] });
        }
    }
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionStatusChange(callback) {
    this.connectionStatusListeners.add(callback);
    return () => {
      this.connectionStatusListeners.delete(callback);
    };
  }

  /**
   * Notify all connection status listeners
   */
  notifyConnectionStatus(status) {
    this.connectionStatusListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in connection status listener:', error);
      }
    });
  }

  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    // Return unsubscribe function
    return () => {
      if (this.listeners.has(eventType)) {
        this.listeners.get(eventType).delete(callback);
        if (this.listeners.get(eventType).size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected. Message not sent:', message);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }

  getConnectionStatus() {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }

  /**
   * Get last message timestamp
   */
  getLastMessageTime() {
    return this.lastMessageTime;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
const wsService = new WebSocketService();

// React Hook for WebSocket
export const useWebSocket = (userId, token) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const listenersRef = useRef(new Map());

  useEffect(() => {
    if (userId && token) {
      wsService.connect(userId, token);

      // Monitor connection status
      const statusInterval = setInterval(() => {
        setConnectionStatus(wsService.getConnectionStatus());
      }, 1000);

      // Subscribe to connection status changes
      const unsubscribeStatus = wsService.onConnectionStatusChange((status) => {
        setConnectionStatus(status);
      });

      return () => {
        clearInterval(statusInterval);
        unsubscribeStatus();
      };
    }
  }, [userId, token]);

  const subscribe = (eventType, callback) => {
    const unsubscribe = wsService.subscribe(eventType, (payload) => {
      setLastMessage({ type: eventType, payload, timestamp: Date.now() });
      callback(payload);
    });

    // Store unsubscribe function
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType).add(unsubscribe);

    return unsubscribe;
  };

  const unsubscribe = (eventType) => {
    if (listenersRef.current.has(eventType)) {
      listenersRef.current.get(eventType).forEach(unsub => unsub());
      listenersRef.current.delete(eventType);
    }
  };

  const send = (message) => {
    wsService.send(message);
  };

  // Cleanup on unmount
  useEffect(() => {
    const listeners = listenersRef.current;
    return () => {
      listeners.forEach((unsubs) => {
        unsubs.forEach(unsub => unsub());
      });
      listeners.clear();
    };
  }, []);

  return {
    connectionStatus,
    lastMessage,
    subscribe,
    unsubscribe,
    send,
    isConnected: connectionStatus === 'connected',
  };
};

// Specific hooks for different event types
export const useFilingUpdates = (userId, token) => {
  const { subscribe, unsubscribe, isConnected } = useWebSocket(userId, token);
  const [filingUpdates, setFilingUpdates] = useState([]);

  useEffect(() => {
    if (isConnected) {
      subscribe('FILING_UPDATE', (payload) => {
        setFilingUpdates(prev => [...prev.slice(-9), { ...payload, timestamp: Date.now() }]);
      });

      subscribe('ACK_RECEIVED', (payload) => {
        setFilingUpdates(prev => [...prev.slice(-9), { ...payload, type: 'ACK_RECEIVED', timestamp: Date.now() }]);
      });

      return () => {
        unsubscribe('FILING_UPDATE');
        unsubscribe('ACK_RECEIVED');
      };
    }
  }, [isConnected, subscribe, unsubscribe]);

  return { filingUpdates, isConnected };
};

export const useSystemAlerts = (userId, token) => {
  const { subscribe, unsubscribe, isConnected } = useWebSocket(userId, token);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (isConnected) {
      subscribe('SYSTEM_ALERT', (payload) => {
        setAlerts(prev => [...prev.slice(-4), { ...payload, timestamp: Date.now() }]);
      });

      return () => unsubscribe('SYSTEM_ALERT');
    }
  }, [isConnected, subscribe, unsubscribe]);

  return { alerts, isConnected };
};

export const useERIUpdates = (userId, token) => {
  const { subscribe, unsubscribe, isConnected } = useWebSocket(userId, token);
  const [eriStatus, setEriStatus] = useState(null);

  useEffect(() => {
    if (isConnected) {
      subscribe('ERI_STATUS', (payload) => {
        setEriStatus(payload);
      });

      return () => unsubscribe('ERI_STATUS');
    }
  }, [isConnected, subscribe, unsubscribe]);

  return { eriStatus, isConnected };
};

export default wsService;
