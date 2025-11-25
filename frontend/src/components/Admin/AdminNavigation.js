// =====================================================
// ADMIN NAVIGATION COMPONENT
// =====================================================

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Card from '../UI/Card';
import Button from '../common/Button';
import { enterpriseLogger } from '../../utils/logger';

const AdminNavigation = ({ className = '' }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const navigationItems = [
    {
      path: '/admin',
      label: 'Dashboard',
      icon: '📊',
      description: 'System overview and statistics',
    },
    {
      path: '/admin/users',
      label: 'User Management',
      icon: '👥',
      description: 'Manage users and permissions',
    },
    {
      path: '/admin/tickets',
      label: 'Service Tickets',
      icon: '🎫',
      description: 'Monitor and manage support tickets',
    },
    {
      path: '/admin/filings',
      label: 'ITR Filings',
      icon: '📄',
      description: 'Oversee ITR filing process',
    },
    {
      path: '/admin/documents',
      label: 'Documents',
      icon: '📁',
      description: 'Manage uploaded documents',
    },
    {
      path: '/admin/audit',
      label: 'Audit Logs',
      icon: '📋',
      description: 'View system audit trails',
    },
    {
      path: '/admin/settings',
      label: 'Settings',
      icon: '⚙️',
      description: 'System configuration',
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    window.location.href = '/login';

    enterpriseLogger.info('Admin user logged out');
  };

  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className={`admin-navigation ${isCollapsed ? 'collapsed' : ''} ${className}`}>
      <Card className="nav-header">
        <div className="nav-brand">
          <div className="brand-icon">👑</div>
          {!isCollapsed && (
            <div className="brand-text">
              <h3>Admin Panel</h3>
              <p>BurnBlack Platform</p>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="small"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="collapse-button"
        >
          {isCollapsed ? '▶' : '◀'}
        </Button>
      </Card>

      <nav className="nav-menu">
        {navigationItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActiveRoute(item.path) ? 'active' : ''}`}
            title={isCollapsed ? item.label : ''}
          >
            <div className="nav-item-content">
              <div className="nav-icon">{item.icon}</div>
              {!isCollapsed && (
                <div className="nav-text">
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-description">{item.description}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </nav>

      <Card className="nav-footer">
        <div className="nav-user-info">
          <div className="user-avatar">
            {localStorage.getItem('userName')?.charAt(0).toUpperCase() || 'A'}
          </div>
          {!isCollapsed && (
            <div className="user-details">
              <p className="user-name">{localStorage.getItem('userName') || 'Admin'}</p>
              <p className="user-role">{localStorage.getItem('userRole') || 'admin'}</p>
            </div>
          )}
        </div>

        <div className="nav-actions">
          <Button
            variant="outline"
            size="small"
            onClick={() => window.location.href = '/dashboard'}
            className="dashboard-button"
            title={isCollapsed ? 'Go to Dashboard' : ''}
          >
            {!isCollapsed && 'Dashboard'}
            <span className="icon">🏠</span>
          </Button>

          <Button
            variant="danger"
            size="small"
            onClick={handleLogout}
            className="logout-button"
            title={isCollapsed ? 'Logout' : ''}
          >
            {!isCollapsed && 'Logout'}
            <span className="icon">🚪</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminNavigation;
