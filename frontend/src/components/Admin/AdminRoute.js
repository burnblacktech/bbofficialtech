// =====================================================
// ADMIN ROUTE PROTECTION COMPONENT
// =====================================================

import React from 'react';
import { Navigate } from 'react-router-dom';
import Card from '../UI/Card';
import { enterpriseLogger } from '../../utils/logger';
import { useAuth } from '../../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    enterpriseLogger.warn('Unauthenticated user attempted to access admin route');
    return <Navigate to="/login" replace />;
  }

  // Check if user has admin privileges
  const allowedRoles = ['super_admin', 'platform_admin', 'ca_firm_admin', 'ca'];
  if (!allowedRoles.includes(user.role)) {
    enterpriseLogger.warn('Non-admin user attempted to access admin route', {
      userRole: user.role,
      userId: user.id,
    });

    return (
      <div className="admin-access-denied">
        <Card className="access-denied-card">
          <div className="access-denied-content">
            <div className="access-denied-icon">🚫</div>
            <h2>Access Denied</h2>
            <p>You don't have permission to access the admin panel.</p>
            <p>Only administrators can view this page.</p>
            <div className="access-denied-actions">
              <button
                onClick={() => window.history.back()}
                className="btn btn-outline"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="btn btn-primary"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // User has admin access
  enterpriseLogger.info('Admin user accessed admin route', {
    userRole: user.role,
    userId: user.id,
  });
  return children;
};

export default AdminRoute;
