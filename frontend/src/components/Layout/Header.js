// =====================================================
// HEADER COMPONENT - TOP NAVIGATION BAR
// Clean, professional header with user menu and notifications
// =====================================================

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Menu,
  Bell,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Search,
  X,
} from 'lucide-react';
import NotificationsPanel from './NotificationsPanel';

const Header = ({ onMenuClick, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-elevation-1">
      <div className="px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Left Section: Logo & Menu Button */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            <button
              onClick={onMenuClick}
              className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <div
              className="flex items-center cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-aurora-gradient rounded-xl flex items-center justify-center mr-1.5 sm:mr-2 shadow-card relative">
                <img
                  src="/bb-logo.svg"
                  alt="BurnBlack Logo"
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    // Fallback to text if logo fails to load
                    e.target.style.display = 'none';
                    const fallback = e.target.parentElement.querySelector('.logo-fallback');
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                <span className="text-white font-bold text-body-small sm:text-body-regular hidden logo-fallback absolute">BB</span>
              </div>
              <span className="text-body-large sm:text-heading-3 font-bold text-slate-900 hidden sm:block">
                BurnBlack
              </span>
            </div>
          </div>

          {/* Center Section: Search (optional, can be toggled) */}
          {showSearch && (
            <div className="flex-1 max-w-lg mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  onClick={() => setShowSearch(false)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Right Section: Actions & User Menu */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
            {/* Search Button (mobile) */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
              aria-label="Search"
            >
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-error-500 rounded-full"></span>
              </button>
              {showNotifications && <NotificationsPanel />}
            </div>

            {/* Settings */}
            <button
              onClick={() => navigate('/profile')}
              className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 hidden sm:block"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-1.5 sm:space-x-2 p-1 sm:p-1.5 lg:p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-aurora-gradient rounded-full flex items-center justify-center shadow-card">
                  <span className="text-white text-body-small sm:text-body-regular font-medium">
                    {getUserInitials()}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-body-small sm:text-body-regular font-medium text-slate-900">
                    {user?.fullName?.split(' ')[0] || 'User'}
                  </p>
                  <p className="text-body-small text-slate-500 truncate max-w-[100px] lg:max-w-[120px]">
                    {user?.email || ''}
                  </p>
                </div>
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500 hidden md:block" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-elevation-3 border border-slate-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-slate-200 sm:hidden">
                    <p className="text-body-regular font-medium text-slate-900">
                      {user?.fullName || 'User'}
                    </p>
                    <p className="text-body-small text-slate-500 truncate">{user?.email || ''}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-body-regular text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-body-regular text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                  <div className="border-t border-slate-200 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-body-regular text-error-600 hover:bg-error-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

