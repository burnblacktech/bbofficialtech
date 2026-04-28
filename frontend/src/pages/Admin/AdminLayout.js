/**
 * AdminLayout — Sidebar navigation for admin pages.
 * Responsive: collapsible sidebar on mobile via hamburger toggle.
 */

import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  Wifi,
  Tag,
  Activity,
  ArrowLeft,
  Menu,
  X,
  FolderPlus,
} from 'lucide-react';
import P from '../../styles/palette';

const NAV_ITEMS = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/filings', icon: FileText, label: 'Filings' },
  { path: '/admin/filing-mgmt', icon: FolderPlus, label: 'Filing Mgmt' },
  { path: '/admin/revenue', icon: DollarSign, label: 'Revenue' },
  { path: '/admin/eri', icon: Wifi, label: 'ERI Monitor' },
  { path: '/admin/coupons', icon: Tag, label: 'Coupons' },
  { path: '/admin/health', icon: Activity, label: 'Health' },
];

const SIDEBAR_WIDTH = 220;
const MOBILE_BREAKPOINT = 768;

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT,
  );

  // Track viewport width
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const sidebarStyle = {
    width: SIDEBAR_WIDTH,
    background: P.brandBlack,
    padding: '16px 0',
    flexShrink: 0,
    ...(isMobile
      ? {
          position: 'fixed',
          top: 0,
          left: sidebarOpen ? 0 : -SIDEBAR_WIDTH,
          height: '100vh',
          zIndex: 1000,
          transition: 'left 0.2s ease',
          boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.4)' : 'none',
        }
      : {}),
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={sidebarStyle}>
        <div
          style={{
            padding: '0 16px 16px',
            borderBottom: '1px solid #2a2a2a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: P.brand }}>Admin Panel</div>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                color: '#999',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0',
                marginTop: 4,
                minHeight: 'auto',
              }}
            >
              <ArrowLeft size={11} /> Back to App
            </button>
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                padding: 4,
                minHeight: 'auto',
              }}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <nav style={{ padding: '8px 0' }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                textDecoration: 'none',
                color: isActive ? P.brand : '#aaa',
                background: isActive ? '#1a1a1a' : 'transparent',
                borderLeft: isActive ? `3px solid ${P.brand}` : '3px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              <item.icon size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, background: P.bgPage, overflow: 'auto', minHeight: '100vh' }}>
        {/* Mobile top bar */}
        {isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: P.brandBlack,
              borderBottom: '1px solid #2a2a2a',
              position: 'sticky',
              top: 0,
              zIndex: 100,
            }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: P.brand,
                cursor: 'pointer',
                padding: 0,
                minHeight: 'auto',
              }}
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 700, color: P.brand }}>Admin Panel</span>
          </div>
        )}
        <div style={{ padding: isMobile ? 16 : 24 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
