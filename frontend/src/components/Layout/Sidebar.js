/**
 * Sidebar — Minimal nav. Logo and user info live in Header.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CheckCircle, User, ChevronLeft, ChevronRight } from 'lucide-react';

const NAV = [
  { name: 'Dashboard', path: '/dashboard', icon: Home },
  { name: 'File ITR', path: '/filing/start', icon: CheckCircle },
  { name: 'Profile', path: '/profile', icon: User },
];

const Sidebar = ({ isCollapsed, onToggle, isMobile, onClose, isOpenMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/home';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const go = (path) => { navigate(path); if (isMobile && onClose) onClose(); };

  const cls = `
    fixed left-0 bottom-0 z-40 bg-white border-r border-slate-200
    transition-all duration-300 ease-in-out flex flex-col top-14
    ${isMobile ? (isOpenMobile ? 'w-56 translate-x-0 shadow-2xl' : 'w-56 -translate-x-full') : (isCollapsed ? 'w-14' : 'w-56')}
  `;

  return (
    <>
      {isMobile && isOpenMobile && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside className={cls}>
        {/* Toggle */}
        {!isMobile && (
          <div className="flex justify-end px-2 py-2">
            <button onClick={onToggle} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100" aria-label={isCollapsed ? 'Expand' : 'Collapse'}>
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-1">
          <ul className="space-y-0.5">
            {NAV.map(item => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <button
                    onClick={() => go(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                      ${active ? 'bg-blue-50 text-[var(--brand-primary)] font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? item.name : ''}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? 'text-[var(--brand-primary)]' : ''}`} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
