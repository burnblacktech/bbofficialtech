/**
 * BottomNav — Mobile-only bottom tab bar with 5 tabs.
 * Hidden on desktop (≥1024px) and filing flow pages.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, TrendingUp, FolderOpen, Settings } from 'lucide-react';

const TABS = [
  {
    label: 'Dashboard',
    icon: Home,
    path: '/dashboard',
    matchPaths: ['/dashboard'],
  },
  {
    label: 'File ITR',
    icon: FileText,
    path: '/filing/start',
    matchPaths: ['/filing/start'],
  },
  {
    label: 'Finance',
    icon: TrendingUp,
    path: '/finance',
    matchPaths: ['/finance', '/finance/income', '/finance/expenses', '/finance/investments'],
  },
  {
    label: 'Documents',
    icon: FolderOpen,
    path: '/vault',
    matchPaths: ['/vault'],
  },
  {
    label: 'Settings',
    icon: Settings,
    path: '/settings',
    matchPaths: ['/settings'],
  },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (tab) => {
    return tab.matchPaths.some(
      (mp) =>
        location.pathname === mp || location.pathname.startsWith(mp + '/'),
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center"
      style={{
        height: '56px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        backgroundColor: 'var(--bottom-nav-bg)',
        borderTop: '1px solid var(--bottom-nav-border)',
        boxShadow: '0 -1px 4px rgba(0,0,0,0.04)',
      }}
      role="navigation"
      aria-label="Bottom navigation"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex flex-col items-center justify-center gap-0.5"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 12px',
              minHeight: '44px',
              minWidth: '44px',
              color: active
                ? 'var(--bottom-nav-active)'
                : 'var(--bottom-nav-inactive)',
              transition: 'color 0.15s',
            }}
            aria-current={active ? 'page' : undefined}
            aria-label={tab.label}
          >
            <Icon size={20} />
            <span className="text-[10px] font-semibold leading-tight">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
