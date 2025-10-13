import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    setUser(null);
    authService.logout(); // The service handles token removal
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const currentUser = await authService.getProfile();
        setUser(currentUser);
      } catch (error) {
        // This is expected if the user has no valid token
      } finally {
        setIsLoading(false);
      }
    };
    verifySession();
  }, []);

  const login = (userData, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    
    // Always redirect to /home - HomeRedirect will handle role-based routing
    navigate('/home');
  };

  const value = { user, isLoading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
