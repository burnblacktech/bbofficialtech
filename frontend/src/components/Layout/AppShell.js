import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { Home, FileText, User } from 'lucide-react';

const MOBILE_NAV = [
  { name: 'Dashboard', path: '/dashboard', icon: Home },
  { name: 'File ITR', path: '/filing/start', icon: FileText },
  { name: 'Profile', path: '/profile', icon: User },
];

/**
 * AppShell — Header (h-14) + Sidebar (desktop) + Bottom Nav (mobile) + Content area.
 */
export const AppShell = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isFilingPage = location.pathname.startsWith('/filing/') && location.pathname !== '/filing/start';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <div className="flex flex-1 relative">
        {!isMobile && (
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            isMobile={false}
            onClose={() => {}}
            isOpenMobile={false}
          />
        )}
        {isMobile && isMobileMenuOpen && (
          <Sidebar
            isCollapsed={false}
            onToggle={() => {}}
            isMobile={true}
            onClose={() => setIsMobileMenuOpen(false)}
            isOpenMobile={true}
          />
        )}
        <main className={`flex-1 transition-all duration-300 ${isMobile ? 'w-full' : sidebarCollapsed ? 'pl-14' : 'pl-56'}`}>
          <div className={`p-4 sm:p-6 ${isMobile && !isFilingPage ? 'pb-20' : ''}`}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation — hidden on filing pages (HUD has its own nav) */}
      {isMobile && !isFilingPage && (
        <nav style={bottomNavStyles.nav}>
          {MOBILE_NAV.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{ ...bottomNavStyles.tab, color: active ? 'var(--brand-primary)' : 'var(--text-muted)' }}
              >
                <Icon size={20} />
                <span style={bottomNavStyles.label}>{item.name}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};

const bottomNavStyles = {
  nav: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
    display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    height: 56, background: '#ffffff', borderTop: '1px solid var(--border-light)',
    boxShadow: '0 -1px 4px rgba(0,0,0,0.04)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  },
  tab: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    background: 'none', border: 'none', cursor: 'pointer', padding: '6px 16px',
    minHeight: 44, minWidth: 44, transition: 'color 0.15s',
  },
  label: { fontSize: 10, fontWeight: 600 },
};
