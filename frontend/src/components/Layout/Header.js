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
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#0F0F0F', borderBottom: '1px solid #2A2A2A', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo + AY */}
          <div className="flex items-center gap-4">
            <button onClick={onMenuClick} className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 lg:hidden" aria-label="Toggle menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-2" style={{ background: '#1A1A1A', border: '1px solid #333' }}>
                <img src="/bb-logo.svg" alt="BB" className="w-full h-full object-contain p-1.5" />
              </div>
              <span className="text-lg font-bold hidden sm:block" style={{ color: '#D4AF37' }}>BurnBlack</span>
            </div>
            <div className="hidden md:flex px-3 py-1 rounded-full items-center gap-1.5" style={{ background: '#1A1A1A', border: '1px solid #333' }}>
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-xs font-semibold" style={{ color: '#999' }}>AY {ay} (FY {ayToFY(ay)})</span>
            </div>
          </div>

          {/* Right: User menu */}
          <div className="relative" ref={userMenuRef}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 p-1.5 rounded-lg transition-colors" style={{ ':hover': { background: '#1A1A1A' } }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#D4AF37' }}>
                <span className="text-xs font-medium" style={{ color: '#0F0F0F' }}>{initials}</span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold" style={{ color: '#E8E8E4' }}>{user?.fullName?.split(' ')[0] || 'User'}</p>
                <p className="text-xs truncate max-w-[120px]" style={{ color: '#999' }}>{user?.email || ''}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 hidden md:block" style={{ color: '#999' }} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-1 w-52 rounded-lg shadow-lg py-1 z-50" style={{ background: '#1A1A1A', border: '1px solid #333' }}>
                <div className="px-4 py-2 md:hidden" style={{ borderBottom: '1px solid #333' }}>
                  <p className="text-sm font-medium" style={{ color: '#E8E8E4' }}>{user?.fullName || 'User'}</p>
                  <p className="text-xs truncate" style={{ color: '#999' }}>{user?.email || ''}</p>
                </div>
                <button onClick={() => { navigate('/profile'); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm" style={{ color: '#E8E8E4' }}>
                  <User className="h-4 w-4" /> Profile
                </button>
                <div style={{ borderTop: '1px solid #333', margin: '2px 0' }}></div>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm" style={{ color: '#DC2626' }}>
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

