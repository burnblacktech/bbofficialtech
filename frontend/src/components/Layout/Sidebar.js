/**
 * Sidebar — Grouped navigation with dynamic NavGroups.
 * Reads state from useSidebarStore. Uses NavLink for active detection.
 * Fetches filings via React Query for Post-Filing section and progress badge.
 */

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Home,
  FileText,
  Sparkles,
  TrendingUp,
  Receipt,
  PiggyBank,
  Users,
  FolderOpen,
  Activity,
  Settings,
  PanelLeftClose,
  PanelLeft,
  DollarSign,
  FileSearch,
  FileEdit,
} from 'lucide-react';
import api from '../../services/api';
import { computeFilingProgress } from '../../utils/filingProgress';

// ── Dynamic navigation config ──

const buildNavGroups = (submittedFilings, progressBadge) => {
  const groups = [
    {
      label: 'Main',
      items: [
        { to: '/dashboard', icon: Home, label: 'Dashboard' },
        { to: '/filing/start', icon: FileText, label: 'File ITR', badge: progressBadge },
      ],
    },
  ];

  if (submittedFilings.length > 0) {
    const mostRecentId = submittedFilings[0].id;
    groups.push({
      label: 'Post-Filing',
      items: [
        { to: `/post-filing/${mostRecentId}/refund`, icon: DollarSign, label: 'Refund Tracker' },
        { to: `/post-filing/${mostRecentId}/cpc`, icon: FileSearch, label: 'CPC Notices' },
        { to: `/post-filing/${mostRecentId}/revised`, icon: FileEdit, label: 'Revised Return' },
      ],
    });
  }

  groups.push(
    {
      label: 'Finance',
      items: [
        { to: '/finance/income', icon: TrendingUp, label: 'Income' },
        { to: '/finance/expenses', icon: Receipt, label: 'Expenses' },
        { to: '/finance/investments', icon: PiggyBank, label: 'Investments' },
      ],
    },
    {
      label: 'Manage',
      items: [
        { to: '/family', icon: Users, label: 'Family' },
        { to: '/vault', icon: FolderOpen, label: 'Vault' },
        { to: '/activity', icon: Activity, label: 'Activity' },
      ],
    },
    {
      label: 'Account',
      items: [
        { to: '/settings', icon: Settings, label: 'Settings' },
      ],
    },
  );

  return groups;
};

// ── NavGroup ──

const NavGroup = ({ label, children, isCollapsed }) => (
  <div className="py-1" role="group" aria-label={label}>
    {!isCollapsed && (
      <p
        className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider select-none"
        style={{ color: 'var(--sidebar-group-label)' }}
      >
        {label}
      </p>
    )}
    <ul className="space-y-0.5" role="list">{children}</ul>
  </div>
);

// ── NavItem ──

const NavItem = ({ to, icon: Icon, label, badge, isCollapsed, onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  let tooltipTimer = null;

  const handleMouseEnter = () => {
    if (isCollapsed) {
      tooltipTimer = setTimeout(() => setShowTooltip(true), 200);
    }
  };

  const handleMouseLeave = () => {
    clearTimeout(tooltipTimer);
    setShowTooltip(false);
  };

  return (
    <li className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <NavLink
        to={to}
        onClick={onClick}
        end={to === '/dashboard'}
        className={({ isActive }) =>
          `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 ${
            isCollapsed ? 'justify-center' : ''
          } ${
            isActive
              ? 'font-semibold'
              : 'font-medium'
          }`
        }
        style={({ isActive }) => ({
          backgroundColor: isActive
            ? 'var(--sidebar-item-active-bg)'
            : undefined,
          color: isActive
            ? 'var(--sidebar-item-active-text)'
            : 'var(--sidebar-item-text)',
        })}
        onMouseOver={(e) => {
          if (!e.currentTarget.classList.contains('active-nav')) {
            e.currentTarget.style.backgroundColor = 'var(--sidebar-item-hover-bg)';
          }
        }}
        onMouseOut={(e) => {
          // Let NavLink's style callback handle active state
          const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
          if (!isActive) {
            e.currentTarget.style.backgroundColor = '';
          }
        }}
        aria-label={isCollapsed ? label : undefined}
      >
        <Icon className="h-[18px] w-[18px] flex-shrink-0" />
        {!isCollapsed && <span className="truncate">{label}</span>}
        {!isCollapsed && badge != null && (
          <span
            className="ml-auto inline-flex items-center justify-center rounded-full text-[10px] font-bold leading-none"
            style={{
              minWidth: '18px',
              height: '18px',
              padding: '0 5px',
              backgroundColor: 'var(--notification-badge-bg)',
              color: 'var(--notification-badge-text)',
            }}
          >
            {typeof badge === 'string' ? badge : badge > 9 ? '9+' : badge}
          </span>
        )}
      </NavLink>

      {/* Collapsed tooltip */}
      {isCollapsed && showTooltip && (
        <div
          className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap shadow-md pointer-events-none"
          style={{
            zIndex: 60,
            backgroundColor: 'var(--brand-black)',
            color: 'var(--text-white)',
          }}
        >
          {label}
        </div>
      )}
    </li>
  );
};

// ── Sidebar ──

const Sidebar = ({ isCollapsed, onToggle, isMobile, isOpenMobile, onClose }) => {
  const handleNavClick = () => {
    if (isMobile && onClose) onClose();
  };

  // Fetch filings for Post-Filing section and progress badge
  const { data: filings = [] } = useQuery({
    queryKey: ['filings'],
    queryFn: async () => {
      const res = await api.get('/filings');
      return res.data?.data || [];
    },
    staleTime: 30000,
  });

  const submittedFilings = filings
    .filter(f => ['submitted_to_eri', 'eri_in_progress', 'eri_success'].includes(f.lifecycleState))
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  const draftFiling = filings.find(f => f.lifecycleState === 'draft');
  const progressBadge = draftFiling ? `${computeFilingProgress(draftFiling).percent}%` : null;

  const navGroups = buildNavGroups(submittedFilings, progressBadge);

  const sidebarClasses = `
    fixed left-0 bottom-0 z-40 flex flex-col top-14
    transition-all duration-300 ease-in-out
    ${
      isMobile
        ? isOpenMobile
          ? 'w-56 translate-x-0 shadow-2xl'
          : 'w-56 -translate-x-full'
        : isCollapsed
        ? 'w-14'
        : 'w-56'
    }
  `;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={sidebarClasses}
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Collapse/expand toggle — desktop only */}
        {!isMobile && (
          <div className="flex justify-end px-2 pt-2 pb-1">
            <button
              onClick={onToggle}
              className="p-1.5 rounded-md transition-colors duration-150"
              style={{ color: 'var(--text-muted)' }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--sidebar-item-hover-bg)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '';
              }}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>
        )}

        {/* Navigation groups */}
        <nav className="flex-1 overflow-y-auto px-2 py-1" onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const items = Array.from(e.currentTarget.querySelectorAll('a[href]'));
            const idx = items.indexOf(document.activeElement);
            if (e.key === 'ArrowDown') {
              const next = idx < items.length - 1 ? idx + 1 : 0;
              items[next]?.focus();
            } else {
              const prev = idx > 0 ? idx - 1 : items.length - 1;
              items[prev]?.focus();
            }
          }
        }}>
          {navGroups.map((group, groupIdx) => (
            <React.Fragment key={group.label}>
              {groupIdx > 0 && (
                <div
                  className="my-2 mx-2"
                  style={{ borderTop: '1px solid var(--sidebar-border)' }}
                />
              )}
              <NavGroup label={group.label} isCollapsed={isCollapsed}>
                {group.items
                  .filter((item) => !item.conditional)
                  .map((item) => (
                    <NavItem
                      key={item.to}
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      badge={item.badge}
                      isCollapsed={isCollapsed}
                      onClick={handleNavClick}
                    />
                  ))}
              </NavGroup>
            </React.Fragment>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
