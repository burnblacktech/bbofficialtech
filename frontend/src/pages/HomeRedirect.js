/**
 * HomeRedirect Component - Smart Role-Based Routing
 * Determines the correct dashboard based on user role
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomeRedirect = () => {
  const { user, isLoading } = useAuth();

  // Show loading state while authentication is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Determining your dashboard...</p>
        </div>
      </div>
    );
  }

  // This case should theoretically not be hit if it's a protected route,
  // but it's good practice to handle it.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ENHANCED LOGIC - Multi-tenant role-based redirection
  switch (user.role) {
    // Platform Administrators
    case 'SUPER_ADMIN':
      return <Navigate to="/admin/super" replace />;
    case 'PLATFORM_ADMIN':
      return <Navigate to="/admin/platform" replace />;

    // B2B Model - Admin-managed CA Firms
    case 'CA_FIRM_ADMIN':
      return <Navigate to="/firm/dashboard" replace />;
    case 'CA_FIRM_SENIOR_CA':
      return <Navigate to="/firm/clients" replace />;
    case 'CA_FIRM_CA':
      return <Navigate to="/firm/clients" replace />;
    case 'CA_FIRM_JUNIOR_CA':
      return <Navigate to="/firm/tasks" replace />;
    case 'CA_FIRM_ASSISTANT':
      return <Navigate to="/firm/tasks" replace />;

    // Independent CAs - Self-registered practices
    case 'INDEPENDENT_CA_ADMIN':
      return <Navigate to="/independent/dashboard" replace />;
    case 'INDEPENDENT_CA_SENIOR_CA':
      return <Navigate to="/independent/clients" replace />;
    case 'INDEPENDENT_CA':
      return <Navigate to="/independent/clients" replace />;
    case 'INDEPENDENT_CA_JUNIOR':
      return <Navigate to="/independent/tasks" replace />;
    case 'INDEPENDENT_CA_ASSISTANT':
      return <Navigate to="/independent/tasks" replace />;

    // Legacy roles for backward compatibility
    case 'CA':
      return <Navigate to="/ca/clients" replace />;

    // End Users
    case 'END_USER':
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

export default HomeRedirect;
