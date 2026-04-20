/**
 * AdminLayout — Sidebar navigation for admin pages
 */

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, DollarSign, Wifi, Tag, Activity, ArrowLeft } from 'lucide-react';
import P from '../../styles/palette';

const NAV_ITEMS = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/filings', icon: FileText, label: 'Filings' },
  { path: '/admin/revenue', icon: DollarSign, label: 'Revenue' },
  { path: '/admin/eri', icon: Wifi, label: 'ERI Monitor' },
  { path: '/admin/coupons', icon: Tag, label: 'Coupons' },
  { path: '/admin/health', icon: Activity, label: 'Health' },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: P.brandBlack, padding: '16px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 16px 16px', borderBottom: '1px solid #2a2a2a' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: P.brand }}>Admin Panel</div>
          <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#999', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginTop: 4, minHeight: 'auto' }}>
            <ArrowLeft size={11} /> Back to App
          </button>
        </div>
        <nav style={{ padding: '8px 0' }}>
          {NAV_ITEMS.map(item => (
            <NavLink key={item.path} to={item.path} end={item.end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                fontSize: 13, fontWeight: isActive ? 600 : 400, textDecoration: 'none',
                color: isActive ? P.brand : '#aaa', background: isActive ? '#1a1a1a' : 'transparent',
                borderLeft: isActive ? `3px solid ${P.brand}` : '3px solid transparent',
                transition: 'all 0.15s',
              })}>
              <item.icon size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: 24, background: P.bgPage, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
