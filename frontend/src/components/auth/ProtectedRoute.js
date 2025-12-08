import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Check for admin user from localStorage (admin login bypasses AuthContext)
  const isAdminRoute = location.pathname.startsWith('/admin');
  const adminToken = localStorage.getItem('adminToken');
  const adminUserStr = localStorage.getItem('adminUser');

  // For admin routes, check if admin is authenticated via localStorage
  if (isAdminRoute && adminToken && adminUserStr) {
    try {
      const adminUser = JSON.parse(adminUserStr);
      if (adminUser.role === 'SUPER_ADMIN' || adminUser.role === 'PLATFORM_ADMIN') {
        return <Outlet />;
      }
    } catch {
      // Invalid admin data, fall through to normal auth check
    }
  }

  if (isLoading) {
    return <div>Loading...</div>; // Replace with a proper full-page spinner component
  }

  // Redirect admin routes to admin login, regular routes to regular login
  if (!user) {
    return <Navigate to={isAdminRoute ? '/admin/login' : '/login'} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
