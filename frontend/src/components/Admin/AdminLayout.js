// =====================================================
// ADMIN LAYOUT - SECURE ADMINISTRATIVE INTERFACE
// Categorized navigation with collapsible groups per admin-flows.md
// =====================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Typography } from '../DesignSystem/DesignSystem';
import { PageTransition } from '../DesignSystem/Animations';
import {
  Shield,
  Users,
  FileText,
  MessageSquare,
  IndianRupee,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  Building2,
  CheckCircle,
  Activity,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  HeadphonesIcon,
  Server,
  Bell,
  Search,
  TrendingUp,
  CreditCard,
  Tag,
  BookOpen,
  Ticket,
  PieChart,
} from 'lucide-react';

// Navigation group component with collapsible functionality
const NavGroup = ({ group, location, isOpen, onToggle, onNavClick }) => {
  const hasActiveItem = group.items.some(item =>
    item.current || location.pathname === item.href || location.pathname.startsWith(item.href + '/'),
  );

  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          hasActiveItem
            ? 'bg-secondary-50 text-secondary-700'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
        }`}
      >
        <div className="flex items-center space-x-3">
          <group.icon className="w-4 h-4" />
          <span>{group.name}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1 ml-4 pl-3 border-l border-neutral-200 space-y-1">
              {group.items.map((item) => {
                const isActive = item.current || location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onNavClick}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(['dashboard', 'users']);
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const toggleGroup = (groupId) => {
    setOpenGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId],
    );
  };

  // Auto-expand group containing current route
  useEffect(() => {
    const currentPath = location.pathname;
    navigationGroups.forEach(group => {
      const hasMatch = group.items.some(item =>
        currentPath === item.href || currentPath.startsWith(item.href + '/'),
      );
      if (hasMatch && !openGroups.includes(group.id)) {
        setOpenGroups(prev => [...prev, group.id]);
      }
    });
  }, [location.pathname]);

  // Categorized navigation groups matching admin-flows.md
  const navigationGroups = [
    {
      id: 'dashboard',
      name: 'Dashboard & Analytics',
      icon: BarChart3,
      items: [
        {
          name: 'Dashboard',
          href: '/admin/dashboard',
          icon: PieChart,
          current: location.pathname === '/admin/dashboard',
        },
        {
          name: 'Analytics',
          href: '/admin/analytics',
          icon: TrendingUp,
          current: location.pathname === '/admin/analytics',
        },
        {
          name: 'Reports',
          href: '/admin/reports',
          icon: FileText,
          current: location.pathname === '/admin/reports',
        },
      ],
    },
    {
      id: 'users',
      name: 'User Management',
      icon: Users,
      items: [
        {
          name: 'All Users',
          href: '/admin/users',
          icon: Users,
          current: location.pathname === '/admin/users',
        },
        {
          name: 'User Segments',
          href: '/admin/users/segments',
          icon: Tag,
          current: location.pathname === '/admin/users/segments',
        },
      ],
    },
    {
      id: 'cas',
      name: 'CA/Professional',
      icon: Building2,
      items: [
        {
          name: 'CA Firms',
          href: '/admin/ca-firms',
          icon: Building2,
          current: location.pathname === '/admin/ca-firms',
        },
        {
          name: 'Verification Queue',
          href: '/admin/cas/verification',
          icon: CheckCircle,
          current: location.pathname === '/admin/cas/verification',
        },
        {
          name: 'Performance',
          href: '/admin/cas/performance',
          icon: Activity,
          current: location.pathname === '/admin/cas/performance',
        },
        {
          name: 'Payouts',
          href: '/admin/cas/payouts',
          icon: IndianRupee,
          current: location.pathname === '/admin/cas/payouts',
        },
      ],
    },
    {
      id: 'filings',
      name: 'Filing Management',
      icon: FileText,
      items: [
        {
          name: 'ITR Filings',
          href: '/admin/filings',
          icon: FileText,
          current: location.pathname === '/admin/filings' || location.pathname.startsWith('/admin/filings/'),
        },
        {
          name: 'Documents',
          href: '/admin/documents',
          icon: FolderOpen,
          current: location.pathname === '/admin/documents',
        },
      ],
    },
    {
      id: 'finance',
      name: 'Financial',
      icon: IndianRupee,
      items: [
        {
          name: 'Transactions',
          href: '/admin/transactions',
          icon: CreditCard,
          current: location.pathname === '/admin/transactions',
        },
        {
          name: 'Refunds',
          href: '/admin/refunds',
          icon: IndianRupee,
          current: location.pathname === '/admin/refunds',
        },
        {
          name: 'Pricing Plans',
          href: '/admin/pricing',
          icon: Tag,
          current: location.pathname === '/admin/pricing',
        },
        {
          name: 'Coupons',
          href: '/admin/coupons',
          icon: Ticket,
          current: location.pathname === '/admin/coupons',
        },
      ],
    },
    {
      id: 'support',
      name: 'Support',
      icon: HeadphonesIcon,
      items: [
        {
          name: 'Service Tickets',
          href: '/admin/tickets',
          icon: MessageSquare,
          current: location.pathname === '/admin/tickets',
        },
        {
          name: 'Knowledge Base',
          href: '/admin/knowledge-base',
          icon: BookOpen,
          current: location.pathname === '/admin/knowledge-base',
        },
      ],
    },
    {
      id: 'system',
      name: 'System',
      icon: Server,
      items: [
        {
          name: 'System Health',
          href: '/admin/system/health',
          icon: Activity,
          current: location.pathname === '/admin/system/health',
        },
        {
          name: 'Control Panel',
          href: '/admin/control-panel',
          icon: Settings,
          current: location.pathname === '/admin/control-panel',
        },
        {
          name: 'Compliance',
          href: '/admin/compliance',
          icon: Shield,
          current: location.pathname === '/admin/compliance',
        },
        {
          name: 'Settings',
          href: '/admin/settings',
          icon: Settings,
          current: location.pathname === '/admin/settings',
        },
      ],
    },
  ];

  // Sidebar content component (reusable for mobile and desktop)
  const SidebarContent = ({ onNavClick }) => (
    <>
      {/* Logo/Header */}
      <div className="flex items-center space-x-3 p-4 border-b border-neutral-200">
        <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <Typography.Small className="font-semibold text-neutral-900">BurnBlack</Typography.Small>
          <Typography.Small className="text-xs text-neutral-500">Admin Panel</Typography.Small>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navigationGroups.map((group) => (
          <NavGroup
            key={group.id}
            group={group}
            location={location}
            isOpen={openGroups.includes(group.id)}
            onToggle={() => toggleGroup(group.id)}
            onNavClick={onNavClick}
          />
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
            <span className="text-secondary-600 font-semibold text-sm">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <Typography.Small className="font-medium text-neutral-900 truncate block">
              {user?.email || 'Admin'}
            </Typography.Small>
            <Typography.Small className="text-xs text-neutral-500">
              {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Platform Admin'}
            </Typography.Small>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-medium text-neutral-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <Typography.Body className="text-neutral-600">Loading admin panel...</Typography.Body>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Typography.Body className="text-neutral-600 mb-4">Access denied. Please log in.</Typography.Body>
          <a
            href="/admin/login"
            className="text-primary-600 hover:text-primary-700 underline"
          >
            Go to Admin Login
          </a>
        </div>
      </div>
    );
  }

  // Check if user is actually an admin
  const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'PLATFORM_ADMIN';
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Typography.Body className="text-neutral-600 mb-4">Access denied. Admin privileges required.</Typography.Body>
          <a
            href="/admin/login"
            className="text-primary-600 hover:text-primary-700 underline"
          >
            Go to Admin Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col lg:hidden"
            >
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent onNavClick={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-72 lg:bg-white lg:shadow-lg lg:flex lg:flex-col">
        <SidebarContent onNavClick={() => {}} />
      </div>

      {/* Main content area */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 text-neutral-600"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* System status indicator */}
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-success-50 rounded-full">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                <Typography.Small className="text-success-700 font-medium">System Online</Typography.Small>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Search (placeholder) */}
              <button className="hidden md:flex items-center space-x-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-500 transition-colors">
                <Search className="w-4 h-4" />
                <span className="text-sm">Search...</span>
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 bg-white rounded text-xs text-neutral-400 border border-neutral-200">⌘K</kbd>
              </button>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full" />
              </button>

              {/* User avatar (mobile only - desktop has it in sidebar) */}
              <div className="flex lg:hidden items-center space-x-2">
                <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center">
                  <span className="text-secondary-600 font-medium text-sm">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main>
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
