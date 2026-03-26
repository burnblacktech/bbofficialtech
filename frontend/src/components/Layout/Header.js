/**
 * Header — Clean top bar with logo, dynamic AY, and user menu.
 * No search bar or notifications (post-MVP).
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, LogOut, User, ChevronDown } from 'lucide-react';
import { getCurrentAY, ayToFY } from '../../utils/assessmentYear';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  const ay = getCurrentAY();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo + AY */}
          <div className="flex items-center gap-4">
            <button onClick={onMenuClick} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Toggle menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center mr-2">
                <img src="/bb-logo.svg" alt="BB" className="w-full h-full object-contain p-1.5" />
              </div>
              <span className="text-lg font-bold text-slate-900 hidden sm:block">BurnBlack</span>
            </div>
            <div className="hidden md:flex px-3 py-1 bg-slate-100 rounded-full border border-slate-200 items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-xs font-semibold text-slate-500">AY {ay} (FY {ayToFY(ay)})</span>
            </div>
          </div>

          {/* Right: User menu */}
          <div className="relative" ref={userMenuRef}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="w-8 h-8 bg-[var(--brand-primary)] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">{initials}</span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-900">{user?.fullName?.split(' ')[0] || 'User'}</p>
                <p className="text-xs text-slate-500 truncate max-w-[120px]">{user?.email || ''}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden md:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-100 md:hidden">
                  <p className="text-sm font-medium text-slate-900">{user?.fullName || 'User'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
                </div>
                <button onClick={() => { navigate('/profile'); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <User className="h-4 w-4" /> Profile
                </button>
                <div className="border-t border-slate-100 my-0.5"></div>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

