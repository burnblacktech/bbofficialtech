// =====================================================
// COMPUTATION SIDEBAR COMPONENT
// Fixed sidebar navigation with section list and status indicators
// Mobile: Drawer/bottom sheet
// =====================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  IndianRupee,
  Calculator,
  CreditCard,
  Building2,
  Globe,
  Wheat,
  FileText,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  X,
  Menu,
  Lock,
  Database,
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Section navigation item component
const SectionNavItem = ({
  section,
  isActive,
  status,
  statusCount,
  onClick,
}) => {
  const Icon = section.icon;

  const statusConfig = {
    complete: {
      color: 'text-success-600',
      bg: 'bg-success-50',
      icon: CheckCircle,
    },
    warning: {
      color: 'text-warning-600',
      bg: 'bg-warning-50',
      icon: AlertTriangle,
    },
    error: {
      color: 'text-error-600',
      bg: 'bg-error-50',
      icon: AlertCircle,
    },
    pending: {
      color: 'text-neutral-400',
      bg: 'bg-neutral-50',
      icon: null,
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-2 rounded-xl transition-all text-left',
        'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-1',
        isActive
          ? 'bg-gold-50 border-l-2 border-gold-500 text-gold-900 font-medium'
          : 'text-neutral-700 hover:text-neutral-900',
      )}
      whileHover={{ x: 1 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
        isActive ? 'bg-gold-100 text-gold-700' : 'bg-neutral-100 text-neutral-600',
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-body-small font-medium truncate">{section.title}</div>
        {section.description && (
          <div className="text-[10px] text-neutral-500 truncate mt-0.5">
            {section.description}
          </div>
        )}
      </div>
      {StatusIcon && (
        <div className={cn('w-4 h-4 flex-shrink-0', config.color)}>
          <StatusIcon className="w-4 h-4" />
        </div>
      )}
      {statusCount > 0 && (
        <div className={cn(
          'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
          config.bg,
          config.color,
        )}>
          {statusCount}
        </div>
      )}
    </motion.button>
  );
};

const ComputationSidebar = ({
  sections = [],
  activeSectionId,
  onSectionSelect,
  getSectionStatus,
  autoFilledFields = {},
  fieldVerificationStatuses = {},
  className = '',
  isMobile = false,
  isOpen = false,
  onClose = () => {},
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(isOpen);

  useEffect(() => {
    setIsMobileOpen(isOpen);
  }, [isOpen]);

  // Handle Escape key to close drawer
  useEffect(() => {
    if (!isMobile || !isMobileOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobile, isMobileOpen, onClose]);

  const handleSectionClick = (sectionId) => {
    onSectionSelect(sectionId);
    if (isMobile) {
      setIsMobileOpen(false);
      onClose();
    }
  };

  const sidebarContent = (
    <div id="computation-sidebar" className="h-full flex flex-col bg-white border-r border-neutral-200">
      {/* Sidebar Header - Compact */}
      <div className="px-2 py-2 border-b border-neutral-200 flex items-center justify-between">
        <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
          Sections
        </h2>
        {isMobile && (
          <button
            onClick={() => {
              setIsMobileOpen(false);
              onClose();
            }}
            className="p-1 rounded-xl hover:bg-neutral-100 transition-colors touch-manipulation"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label="Close sidebar"
            aria-controls="computation-sidebar"
          >
            <X className="w-4 h-4 text-neutral-600" />
          </button>
        )}
      </div>

      {/* Section List - Compact */}
      <div className="flex-1 overflow-y-auto py-1">
        <div className="px-1 space-y-0.5">
          {sections.map((section) => {
            const status = getSectionStatus?.(section.id) || 'pending';
            const statusCount = getSectionStatus?.(section.id, 'count') || 0;
            const autoFilledCount = autoFilledFields[section.id]?.length || 0;
            const hasLockedFields = fieldVerificationStatuses[section.id] &&
              Object.values(fieldVerificationStatuses[section.id]).some(
                status => status === 'verified',
              );

            return (
              <div key={section.id} className="relative group">
                <SectionNavItem
                  section={section}
                  isActive={activeSectionId === section.id}
                  status={status}
                  statusCount={statusCount}
                  onClick={() => handleSectionClick(section.id)}
                />
                {/* Status indicators overlay */}
                {(autoFilledCount > 0 || hasLockedFields) && (
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    {autoFilledCount > 0 && (
                      <div className="relative" title={`${autoFilledCount} auto-filled fields`}>
                        <Database className="w-3.5 h-3.5 text-blue-500" />
                        {autoFilledCount > 1 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                            {autoFilledCount}
                          </span>
                        )}
                      </div>
                    )}
                    {hasLockedFields && (
                      <div title="Has verified/locked fields">
                        <Lock className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Desktop: Fixed sidebar
  if (!isMobile) {
    return (
      <aside className={cn('w-[280px] flex-shrink-0 h-full', className)}>
        {sidebarContent}
      </aside>
    );
  }

  // Mobile: Drawer
  return (
    <>
      {/* Mobile Menu Button - Positioned to avoid conflicts with other floating elements */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-gold-500 text-white shadow-elevation-3 flex items-center justify-center hover:bg-gold-600 transition-colors touch-manipulation"
        style={{
          // Account for safe-area-inset on iOS devices
          bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
          right: 'calc(1rem + env(safe-area-inset-right, 0px))',
        }}
        aria-label="Open sections menu"
        aria-expanded={isMobileOpen}
        aria-controls="computation-sidebar"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsMobileOpen(false);
                onClose();
              }}
              className="fixed inset-0 bg-black/50 z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-[320px] max-w-[85vw] z-[60]"
              style={{
                // Account for safe-area-inset on iOS devices
                paddingTop: 'env(safe-area-inset-top, 0px)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ComputationSidebar;

