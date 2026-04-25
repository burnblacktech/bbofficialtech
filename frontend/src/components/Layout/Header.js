/**
 * Header — 56px sticky top bar with logo, AY badge, notification bell,
 * theme toggle, and user menu.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import useThemeStore from '../../store/useThemeStore';
import useNotificationStore from '../../store/useNotificationStore';
import { Menu, LogOut, User, ChevronDown, Bell, Sun, Moon } from 'lucide-react';
import { getCurrentAY, ayToFY } from '../../utils/assessmentYear';

// ── NotificationBell ──

const NotificationBell = () => {
  const { togglePanel } = useNotificationStore();
  // Placeholder unread count — will be wired to React Query later
  const unreadCount = 0;

  return (
    <button
      onClick={togglePanel}
      className="relative p-2 rounded-lg transition-colors"
      style={{ color: 'var(--text-muted)' }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-muted)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = '';
      }}
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full text-[10px] font-bold leading-none"
          style={{
            minWidth: '16px',
            height: '16px',
            padding: '0 4px',
            backgroundColor: 'var(--notification-badge-bg)',
            color: 'var(--notification-badge-text)',
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

// ── ThemeToggle ──

const ThemeToggle = () => {
  const { resolvedTheme, setTheme, theme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-lg transition-colors"
      style={{ color: 'var(--text-muted)' }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-muted)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = '';
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
};

// ── Header ──

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  const ay = getCurrentAY();

  return (
    <header
      className="sticky top-0 z-50 h-14"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left: Hamburger + Logo + AY */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg lg:hidden transition-colors"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div
              className="flex items-center cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-2"
                style={{
                  backgroundColor: 'var(--bg-muted)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <img
                  src="/bb-logo.svg"
                  alt="BB"
                  className="w-full h-full object-contain p-1.5"
                />
              </div>
              <span
                className="text-lg font-bold hidden sm:block"
                style={{ color: 'var(--brand-primary)' }}
              >
                BurnBlack
              </span>
            </div>

            <div
              className="hidden md:flex px-3 py-1 rounded-full items-center gap-1.5"
              style={{
                backgroundColor: 'var(--bg-muted)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span
                className="text-xs font-semibold"
                style={{ color: 'var(--text-light)' }}
              >
                AY {ay} (FY {ayToFY(ay)})
              </span>
            </div>
          </div>

          {/* Right: Notification bell + Theme toggle + User menu */}
          <div className="flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />

            <div className="relative ml-1" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg transition-colors"
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-muted)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '';
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  <span
                    className="text-xs font-medium"
                    style={{ color: 'var(--brand-black)' }}
                  >
                    {initials}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {user?.fullName?.split(' ')[0] || 'User'}
                  </p>
                  <p
                    className="text-xs truncate max-w-[120px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {user?.email || ''}
                  </p>
                </div>
                <ChevronDown
                  className="h-3.5 w-3.5 hidden md:block"
                  style={{ color: 'var(--text-muted)' }}
                />
              </button>

              {showUserMenu && (
                <div
                  className="absolute right-0 mt-1 w-52 rounded-lg shadow-lg py-1 z-50"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div
                    className="px-4 py-2 md:hidden"
                    style={{ borderBottom: '1px solid var(--border-light)' }}
                  >
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {user?.fullName || 'User'}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {user?.email || ''}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-muted)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                    }}
                  >
                    <User className="h-4 w-4" /> Profile & Settings
                  </button>
                  <div
                    style={{
                      borderTop: '1px solid var(--border-light)',
                      margin: '2px 0',
                    }}
                  />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                    style={{ color: 'var(--color-error)' }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-error-bg)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                    }}
                  >
                    <LogOut className="h-4 w-4" /> Logout
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
