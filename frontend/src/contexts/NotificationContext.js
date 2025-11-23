// =====================================================
// NOTIFICATION CONTEXT - STRATEGIC CONTEXT 4
// System notifications and alerts management
// =====================================================

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import sseClient from '../services/SSENotificationClient';
import { enterpriseLogger } from '../utils/logger';

const NotificationContext = createContext();

// Action types
const NOTIFICATION_ACTIONS = {
  SET_CONNECTED: 'SET_CONNECTED',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  CLEAR_ALL: 'CLEAR_ALL',
  SET_ERROR: 'SET_ERROR'
};

// Initial state
const initialState = {
  isConnected: false,
  notifications: [],
  unreadCount: 0,
  error: null,
  lastNotification: null
};

// Reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.SET_CONNECTED:
      return {
        ...state,
        isConnected: action.payload,
        error: null
      };

    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      const newNotification = {
        ...action.payload,
        id: action.payload.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: action.payload.timestamp || new Date().toISOString(),
        isRead: false
      };
      
      return {
        ...state,
        notifications: [newNotification, ...state.notifications].slice(0, 100), // Keep last 100
        unreadCount: state.unreadCount + 1,
        lastNotification: newNotification
      };

    case NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION:
      const notificationToRemove = state.notifications.find(n => n.id === action.payload);
      const wasUnread = notificationToRemove && !notificationToRemove.isRead;
      
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount
      };

    case NOTIFICATION_ACTIONS.MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(n => 
          n.id === action.payload ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };

    case NOTIFICATION_ACTIONS.CLEAR_ALL:
      return {
        ...state,
        notifications: [],
        unreadCount: 0
      };

    case NOTIFICATION_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isConnected: false
      };

    default:
      return state;
  }
};

// Provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  useEffect(() => {
    // Initialize SSE connection when component mounts
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (token && userId) {
      initializeSSEConnection(userId, token);
    }

    // Cleanup on unmount
    return () => {
      sseClient.disconnect();
    };
  }, []);

  const initializeSSEConnection = (userId, token) => {
    try {
      // Setup SSE event listeners
      sseClient.on('connected', (data) => {
        dispatch({ type: NOTIFICATION_ACTIONS.SET_CONNECTED, payload: true });
        enterpriseLogger.info('SSE connected via context', { userId });
      });

      sseClient.on('disconnected', () => {
        dispatch({ type: NOTIFICATION_ACTIONS.SET_CONNECTED, payload: false });
        enterpriseLogger.info('SSE disconnected via context', { userId });
      });

      sseClient.on('error', (error) => {
        dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: error.message });
        enterpriseLogger.error('SSE error via context', { error: error.message });
      });

      sseClient.on('notification', (notification) => {
        dispatch({ type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION, payload: notification });
        
        // Show browser notification if permission granted
        showBrowserNotification(notification);
      });

      // Connect to SSE
      sseClient.connect(userId, token);

    } catch (error) {
      enterpriseLogger.error('Failed to initialize SSE connection', { error: error.message });
      dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  const showBrowserNotification = (notification) => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const browserNotification = new Notification(notification.data.title || 'BurnBlack Notification', {
          body: notification.data.message || 'You have a new notification',
          icon: '/favicon.ico',
          tag: notification.id
        });

        browserNotification.onclick = () => {
          window.focus();
          browserNotification.close();
        };

        // Auto-close after 5 seconds
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    } catch (error) {
      enterpriseLogger.error('Failed to show browser notification', { error: error.message });
    }
  };

  const requestNotificationPermission = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        enterpriseLogger.info('Notification permission requested', { permission });
        return permission === 'granted';
      }
      return false;
    } catch (error) {
      enterpriseLogger.error('Failed to request notification permission', { error: error.message });
      return false;
    }
  };

  const addNotification = (notification) => {
    dispatch({ type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION, payload: notification });
  };

  const removeNotification = (notificationId) => {
    dispatch({ type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION, payload: notificationId });
  };

  const markAsRead = (notificationId) => {
    dispatch({ type: NOTIFICATION_ACTIONS.MARK_AS_READ, payload: notificationId });
  };

  const markAllAsRead = () => {
    state.notifications.forEach(notification => {
      if (!notification.isRead) {
        dispatch({ type: NOTIFICATION_ACTIONS.MARK_AS_READ, payload: notification.id });
      }
    });
  };

  const clearAll = () => {
    dispatch({ type: NOTIFICATION_ACTIONS.CLEAR_ALL });
  };

  const sendTestNotification = async (message) => {
    try {
      await sseClient.sendTestNotification(message);
    } catch (error) {
      enterpriseLogger.error('Failed to send test notification', { error: error.message });
      throw error;
    }
  };

  const reconnect = () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (token && userId) {
      sseClient.disconnect();
      initializeSSEConnection(userId, token);
    }
  };

  const getNotificationsByType = (type) => {
    return state.notifications.filter(n => n.type === type);
  };

  const getUnreadNotifications = () => {
    return state.notifications.filter(n => !n.isRead);
  };

  const getRecentNotifications = (limit = 10) => {
    return state.notifications.slice(0, limit);
  };

  const getNotificationCount = () => {
    return state.notifications.length;
  };

  const getUnreadCount = () => {
    return state.unreadCount;
  };

  const isConnected = () => {
    return state.isConnected;
  };

  const getLastNotification = () => {
    return state.lastNotification;
  };

  const getConnectionStatus = () => {
    return sseClient.getStatus();
  };

  const value = {
    // State
    ...state,
    
    // Actions
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    sendTestNotification,
    reconnect,
    requestNotificationPermission,
    
    // Getters
    getNotificationsByType,
    getUnreadNotifications,
    getRecentNotifications,
    getNotificationCount,
    getUnreadCount,
    isConnected,
    getLastNotification,
    getConnectionStatus
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use notification context
export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  
  return context;
};

export default NotificationContext;
