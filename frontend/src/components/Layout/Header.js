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
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm backdrop-blur-md bg-white/90">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Left Section: Logo & Menu Button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div
              className="flex items-center cursor-pointer group"
              onClick={() => navigate('/dashboard')}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-sm relative overflow-hidden transition-transform group-hover:scale-105">
                <div className="absolute inset-0 bg-aurora-gradient opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <img
                  src="/bb-logo.svg"
                  alt="BB"
                  className="w-full h-full object-contain p-1.5 z-10"
                />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 hidden sm:block">
                BurnBlack
              </span>
            </div>

            {/* Assessment Year Switcher */}
            <div className="hidden md:flex ml-8 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200 items-center gap-2">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AY 2024-25</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          {/* Center Section: Global AI Search */}
          <div className="flex-1 max-w-xl mx-4 hidden lg:block">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="Ask your CA assistant anything..."
                className="w-full pl-12 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white transition-all text-sm"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-[10px] font-sans font-semibold text-slate-400 bg-white border border-slate-200 rounded-md">Ctrl</kbd>
                <kbd className="px-1.5 py-0.5 text-[10px] font-sans font-semibold text-slate-400 bg-white border border-slate-200 rounded-md">K</kbd>
              </div>
            </div>
          </div>

          {/* Right Section: Actions & User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search Button (mobile) */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-error-500 rounded-full border-2 border-white"></span>
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
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[var(--s29-primary)] rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white text-body-small sm:text-body-regular font-medium">
                    {getUserInitials()}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-body-small sm:text-body-regular font-bold text-[var(--s29-text-main)]">
                    {user?.fullName?.split(' ')[0] || 'User'}
                  </p>
                  <p className="text-body-small text-[var(--s29-text-muted)] truncate max-w-[100px] lg:max-w-[120px]">
                    {user?.email || ''}
                  </p>
                </div>
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500 hidden md:block" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[var(--s29-border-light)] py-1 z-50">
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

