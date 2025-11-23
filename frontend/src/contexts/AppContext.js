// =====================================================
// APP CONTEXT - STRATEGIC CONTEXT 3
// App-wide settings & preferences
// =====================================================

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// Initial state
const initialState = {
  // UI state
  theme: 'light',
  sidebarOpen: true,
  language: 'en',

  // Preferences
  preferences: {
    autoSave: true,
    notifications: true,
    emailAlerts: true,
    darkMode: false,
    compactMode: false
  },

  // Feature flags
  features: {
    aiAssist: true,
    ocr: true,
    eriIntegration: true,
    mfa: true,
    betaFeatures: false
  },

  // App state
  isOnline: navigator.onLine,
  lastActivity: Date.now(),

  // Loading states
  globalLoading: false
};

// Action types
const ActionTypes = {
  // UI actions
  SET_THEME: 'SET_THEME',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_LANGUAGE: 'SET_LANGUAGE',
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  SET_GLOBAL_LOADING: 'SET_GLOBAL_LOADING',

  // Preference actions
  SET_PREFERENCES: 'SET_PREFERENCES',
  UPDATE_PREFERENCE: 'UPDATE_PREFERENCE',

  // Feature flag actions
  SET_FEATURES: 'SET_FEATURES',
  TOGGLE_FEATURE: 'TOGGLE_FEATURE',

  // Activity tracking
  UPDATE_ACTIVITY: 'UPDATE_ACTIVITY'
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_THEME:
      return {
        ...state,
        theme: action.payload.theme,
        preferences: {
          ...state.preferences,
          darkMode: action.payload.theme === 'dark'
        }
      };

    case ActionTypes.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      };

    case ActionTypes.SET_LANGUAGE:
      return {
        ...state,
        language: action.payload.language
      };

    case ActionTypes.SET_ONLINE_STATUS:
      return {
        ...state,
        isOnline: action.payload.isOnline
      };

    case ActionTypes.SET_GLOBAL_LOADING:
      return {
        ...state,
        globalLoading: action.payload.loading
      };

    case ActionTypes.SET_PREFERENCES:
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload.preferences }
      };

    case ActionTypes.UPDATE_PREFERENCE:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          [action.payload.key]: action.payload.value
        }
      };

    case ActionTypes.SET_FEATURES:
      return {
        ...state,
        features: { ...state.features, ...action.payload.features }
      };

    case ActionTypes.TOGGLE_FEATURE:
      return {
        ...state,
        features: {
          ...state.features,
          [action.payload.feature]: !state.features[action.payload.feature]
        }
      };

    case ActionTypes.UPDATE_ACTIVITY:
      return {
        ...state,
        lastActivity: action.payload.timestamp
      };

    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize app settings from localStorage
  useEffect(() => {
    const initializeApp = () => {
      try {
        // Load preferences from localStorage
        const savedPreferences = localStorage.getItem('appPreferences');
        if (savedPreferences) {
          const preferences = JSON.parse(savedPreferences);
          dispatch({
            type: ActionTypes.SET_PREFERENCES,
            payload: { preferences }
          });
        }

        // Load theme from localStorage
        const savedTheme = localStorage.getItem('theme') || 'light';
        dispatch({
          type: ActionTypes.SET_THEME,
          payload: { theme: savedTheme }
        });

        // Load language from localStorage
        const savedLanguage = localStorage.getItem('language') || 'en';
        dispatch({
          type: ActionTypes.SET_LANGUAGE,
          payload: { language: savedLanguage }
        });

        // Load feature flags from localStorage
        const savedFeatures = localStorage.getItem('featureFlags');
        if (savedFeatures) {
          const features = JSON.parse(savedFeatures);
          dispatch({
            type: ActionTypes.SET_FEATURES,
            payload: { features }
          });
        }
      } catch (error) {
        console.error('App initialization error:', error);
      }
    };

    initializeApp();
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('appPreferences', JSON.stringify(state.preferences));
  }, [state.preferences]);

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('theme', state.theme);
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', state.language);
  }, [state.language]);

  // Save feature flags to localStorage when they change
  useEffect(() => {
    localStorage.setItem('featureFlags', JSON.stringify(state.features));
  }, [state.features]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      dispatch({
        type: ActionTypes.SET_ONLINE_STATUS,
        payload: { isOnline: true }
      });
    };

    const handleOffline = () => {
      dispatch({
        type: ActionTypes.SET_ONLINE_STATUS,
        payload: { isOnline: false }
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Activity tracking
  useEffect(() => {
    const trackActivity = () => {
      dispatch({
        type: ActionTypes.UPDATE_ACTIVITY,
        payload: { timestamp: Date.now() }
      });
    };

    // Track activity on various user interactions
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
    };
  }, []);

  // Context value with memoized functions
  const value = {
    state,
    dispatch,

    // UI actions
    setTheme: useCallback((theme) => {
      dispatch({
        type: ActionTypes.SET_THEME,
        payload: { theme }
      });
    }, []),

    toggleSidebar: useCallback(() => {
      dispatch({ type: ActionTypes.TOGGLE_SIDEBAR });
    }, []),

    setLanguage: useCallback((language) => {
      dispatch({
        type: ActionTypes.SET_LANGUAGE,
        payload: { language }
      });
    }, []),

    setGlobalLoading: useCallback((loading) => {
      dispatch({
        type: ActionTypes.SET_GLOBAL_LOADING,
        payload: { loading }
      });
    }, []),

    // Preference actions
    setPreferences: useCallback((preferences) => {
      dispatch({
        type: ActionTypes.SET_PREFERENCES,
        payload: { preferences }
      });
    }, []),

    updatePreference: useCallback((key, value) => {
      dispatch({
        type: ActionTypes.UPDATE_PREFERENCE,
        payload: { key, value }
      });
    }, []),

    // Feature flag actions
    toggleFeature: useCallback((feature) => {
      dispatch({
        type: ActionTypes.TOGGLE_FEATURE,
        payload: { feature }
      });
    }, []),

    setFeatures: useCallback((features) => {
      dispatch({
        type: ActionTypes.SET_FEATURES,
        payload: { features }
      });
    }, []),

    // Utility functions
    isFeatureEnabled: useCallback((feature) => {
      return state.features[feature] || false;
    }, [state.features]),

    getPreference: useCallback((key, defaultValue = null) => {
      return state.preferences[key] !== undefined ? state.preferences[key] : defaultValue;
    }, [state.preferences])
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;