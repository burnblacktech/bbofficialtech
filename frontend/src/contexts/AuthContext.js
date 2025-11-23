// =====================================================
// AUTH CONTEXT - STRATEGIC CONTEXT 1
// User authentication & profile management
// =====================================================

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services';

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
  const navigate = useNavigate();

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);

          // Load user profile
          try {
            const profileData = await authService.getProfile();
            setProfile(profileData);
          } catch (error) {
            console.warn('Failed to load user profile:', error);
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

  // Login function
  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);

        // Load profile after successful login
        try {
          const profileData = await authService.getProfile();
          setProfile(profileData);
        } catch (error) {
          console.warn('Failed to load user profile after login:', error);
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

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  }, [navigate]);

  // Update user profile
  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      if (response.success) {
        setProfile(response.profile);
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

    // Actions
    login,
    logout,
    updateProfile,

    // Utilities
    hasRole,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;