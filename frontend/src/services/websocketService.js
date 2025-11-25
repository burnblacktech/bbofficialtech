import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.listeners = new Map();
    this.isConnecting = false;
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
        console.log('🔌 WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        toast.success('Connected to live updates');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.isConnecting = false;
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        toast.error('Connection error. Retrying...');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        if (userId && token) {
          this.connect(userId, token);
        }
      }, this.reconnectInterval);
    } else {
      console.log('❌ Max reconnection attempts reached');
      toast.error('Unable to connect to live updates');
    }
  }

  handleMessage(data) {
    const { type, payload } = data;

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
      case 'FILING_UPDATE':
        toast.success(`Filing ${payload.status}: ${payload.filingId}`);
        break;
      case 'ACK_RECEIVED':
        toast.success(`Acknowledgement received: ${payload.ackNumber}`);
        break;
      case 'ERI_STATUS':
        toast.info(`ERI Status: ${payload.status}`);
        break;
      case 'SYSTEM_ALERT':
        toast.error(`System Alert: ${payload.message}`);
        break;
      default:
        console.log('Unhandled WebSocket message:', data);
    }
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

      return () => {
        clearInterval(statusInterval);
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
    return () => {
      listenersRef.current.forEach((unsubs) => {
        unsubs.forEach(unsub => unsub());
      });
      listenersRef.current.clear();
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
  }, [isConnected, subscribe]);

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
  }, [isConnected, subscribe]);

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
  }, [isConnected, subscribe]);

  return { eriStatus, isConnected };
};

export default wsService;
