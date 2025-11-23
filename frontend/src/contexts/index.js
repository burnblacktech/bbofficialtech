// =====================================================
// STRATEGIC CONTEXT PROVIDERS - 4 CONTEXT SYSTEM
// Optimized context management for the BurnBlack platform
// =====================================================

import React from 'react';
import { AuthProvider } from './AuthContext';
import { ITRProvider } from './ITRContext';
import { AppProvider } from './AppContext';
import { NotificationProvider } from './NotificationContext';

/**
 * Combined Context Provider
 * Provides all 4 strategic contexts in a single wrapper
 */
export const ContextProvider = ({ children }) => {
  return (
    <AppProvider>
      <AuthProvider>
        <ITRProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </ITRProvider>
      </AuthProvider>
    </AppProvider>
  );
};

/**
 * Individual context exports for selective usage
 */
export {
  AuthProvider,
  ITRProvider,
  AppProvider,
  NotificationProvider
} from './AuthContext';
export { ITRProvider } from './ITRContext';
export { AppProvider } from './AppContext';
export { NotificationProvider } from './NotificationContext';

/**
 * Hook exports
 */
export { useAuth } from './AuthContext';
export { useITR } from './ITRContext';
export { useApp } from './AppContext';
export { useNotificationContext } from './NotificationContext';

/**
 * Context type definitions for TypeScript (if using)
 */
export const CONTEXT_TYPES = {
  AUTH: 'auth',
  ITR: 'itr',
  APP: 'app',
  NOTIFICATION: 'notification'
};

/**
 * Default export
 */
export default ContextProvider;