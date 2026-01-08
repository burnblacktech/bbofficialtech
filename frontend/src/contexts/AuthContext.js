// =====================================================
// AUTH CONTEXT - STRATEGIC CONTEXT 1
// User authentication & profile management
// =====================================================

import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services';
import { trackEvent } from '../utils/analyticsEvents';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const navigate = useNavigate();
  const profileFetchInProgress = useRef(false); // Prevent multiple simultaneous profile fetches

  const refreshProfile = useCallback(async () => {
    // Best-effort; do not throw unless needed by caller
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return null;

    // For admin users, skip profile fetch (admin profile endpoint may not exist)
    const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'PLATFORM_ADMIN';
    if (isAdmin) return null;

    if (profileFetchInProgress.current) return null;

    try {
      profileFetchInProgress.current = true;
      const profileData = await authService.getProfile();
      setProfile(profileData);
      if (profileData?.user) {
        setUser(prevUser => ({ ...prevUser, ...profileData.user }));
      }
      return profileData;
    } catch (error) {
      console.warn('Failed to refresh user profile:', error);
      return null;
    } finally {
      profileFetchInProgress.current = false;
    }
  }, []);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);

          // For admin users, skip profile fetch (admin profile endpoint may not exist)
          const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'PLATFORM_ADMIN';

          // Load user profile (only if not already fetching and not admin)
          if (!profileFetchInProgress.current && !isAdmin) {
            try {
              profileFetchInProgress.current = true;
              const profileData = await authService.getProfile();
              setProfile(profileData);
              // Update user state with profile data including dateOfBirth, metadata, etc.
              if (profileData?.user) {
                setUser(prevUser => ({ ...prevUser, ...profileData.user }));
              }
            } catch (error) {
              console.warn('Failed to load user profile:', error);
            } finally {
              profileFetchInProgress.current = false;
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function (for email/password)
  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        setJustLoggedIn(true); // Mark that user just logged in
        trackEvent('auth_login_success', { role: response.user?.role || null });

        // Load profile after successful login (only if not already fetching)
        if (!profileFetchInProgress.current) {
          try {
            profileFetchInProgress.current = true;
            const profileData = await authService.getProfile();
            setProfile(profileData);
            // Update user state with profile data including dateOfBirth, metadata, etc.
            if (profileData?.user) {
              setUser(prevUser => ({ ...prevUser, ...profileData.user }));
            }
          } catch (error) {
            console.warn('Failed to load user profile after login:', error);
          } finally {
            profileFetchInProgress.current = false;
          }
        }

        navigate('/home');
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // OAuth login function (for Google OAuth, etc.)
  const loginWithOAuth = useCallback(async (user, token, refreshToken) => {
    setIsLoading(true);
    try {
      // Handle OAuth login (sets tokens directly)
      const response = authService.handleOAuthLogin(user, token, refreshToken);

      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        setJustLoggedIn(true); // Mark that user just logged in
        trackEvent('auth_oauth_success', { role: response.user?.role || null });

        // Load profile after successful login (only if not already fetching)
        if (!profileFetchInProgress.current) {
          try {
            profileFetchInProgress.current = true;
            const profileData = await authService.getProfile();
            setProfile(profileData);
            // Update user state with profile data including dateOfBirth, metadata, etc.
            if (profileData?.user) {
              setUser(prevUser => ({ ...prevUser, ...profileData.user }));
            }
          } catch (error) {
            console.warn('Failed to load user profile after OAuth login:', error);
          } finally {
            profileFetchInProgress.current = false;
          }
        }

        navigate('/home');
        return { success: true };
      }
      return { success: false, message: 'OAuth login failed' };
    } catch (error) {
      console.error('OAuth login error:', error);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Logout function
  const logout = useCallback(async () => {
    // Clear local state immediately for better UX
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    setJustLoggedIn(false);

    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Ensure we always end up at login
      navigate('/login');
    }
  }, [navigate]);

  // Update user profile
  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      if (response.success) {
        setProfile(response.profile || response);
        // Update user state with updated profile data
        if (response.user) {
          setUser(prevUser => ({ ...prevUser, ...response.user }));
        } else if (response.profile?.user) {
          setUser(prevUser => ({ ...prevUser, ...response.profile.user }));
        }
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, message: error.message };
    }
  }, []);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    return user?.roles?.includes(role) || user?.role === role;
  }, [user]);

  // Check if user has specific permission
  const hasPermission = useCallback((permission) => {
    return user?.permissions?.includes(permission) || hasRole('admin');
  }, [user, hasRole]);

  const value = {
    // State
    user,
    profile,
    isLoading,
    isAuthenticated,
    justLoggedIn,

    // Actions
    login,
    loginWithOAuth,
    logout,
    updateProfile,
    setJustLoggedIn, // Allow components to clear the flag
    refreshProfile,

    // Utilities
    hasRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
