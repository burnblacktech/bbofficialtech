// =====================================================
// SIDEBAR COMPONENT - COLLAPSIBLE NAVIGATION MENU
// Modern sidebar with smooth collapse/expand animation
// =====================================================

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Folder,
  Users,
  History,
  User,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const Sidebar = ({ isCollapsed, onToggle, isMobile, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Start Filing',
      path: '/itr/start',
      icon: FileText,
    },
    {
      name: 'Documents',
      path: '/documents',
      icon: Folder,
    },
    {
      name: 'Family Members',
      path: '/add-members',
      icon: Users,
    },
    {
      name: 'Filing History',
      path: '/filing-history',
      icon: History,
    },
    {
      name: 'Profile Settings',
      path: '/profile',
      icon: User,
    },
    {
      name: 'Help & Support',
      path: '/help',
      icon: HelpCircle,
    },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/home';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const sidebarClasses = `
    fixed top-14 sm:top-16 lg:top-20 left-0 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] bg-white border-r border-[var(--s29-border-light)] z-40
    transition-all duration-300 ease-in-out flex flex-col
    ${isMobile ? 'lg:hidden' : 'hidden lg:flex'}
    ${isCollapsed && !isMobile ? 'w-16' : 'w-64'}
    ${isMobile && !isCollapsed ? 'translate-x-0' : isMobile ? '-translate-x-full' : ''}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={sidebarClasses}>
        {/* Header */}
        <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 border-b border-slate-200">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[var(--s29-primary)] rounded-xl flex items-center justify-center shadow-sm relative">
                <img
                  src="/bb-logo.svg"
                  alt="BurnBlack Logo"
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = e.target.parentElement.querySelector('.logo-fallback');
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                <span className="text-white font-bold text-body-small sm:text-body-regular hidden logo-fallback absolute inset-0 flex items-center justify-center">BB</span>
              </div>
              <span className="text-body-large sm:text-body-large font-bold text-[var(--s29-text-main)]">BurnBlack</span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-aurora-gradient rounded-xl flex items-center justify-center mx-auto shadow-card">
              <img
                src="/bb-logo.svg"
                alt="BurnBlack Logo"
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  // Fallback to text if logo fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span className="text-white font-bold text-body-small sm:text-body-regular hidden">BB</span>
            </div>
          )}
          {!isMobile && (
            <button
              onClick={onToggle}
              className="p-1 sm:p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 sm:py-4 px-2">
          <ul className="space-y-0.5 sm:space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      w-full flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl
                      transition-all duration-200 text-body-regular sm:text-body-large
                      ${active
                        ? 'bg-[var(--s29-primary-light)]/10 text-[var(--s29-primary)] font-semibold'
                        : 'text-[var(--s29-text-muted)] hover:bg-[var(--s29-bg-alt)] hover:text-[var(--s29-text-main)]'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? item.name : ''}
                    aria-label={isCollapsed ? item.name : undefined}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${active ? 'text-[var(--s29-primary)]' : ''}`} aria-hidden="true" />
                    {!isCollapsed && <span className="text-body-regular sm:text-body-large">{item.name}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-[var(--s29-border-light)]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[var(--s29-primary)] rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white text-body-regular font-medium">
                  {user?.fullName
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-regular font-bold text-[var(--s29-text-main)] truncate">
                  {user?.fullName || 'User'}
                </p>
                <p className="text-body-small text-[var(--s29-text-muted)] truncate">{user?.email || ''}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;

