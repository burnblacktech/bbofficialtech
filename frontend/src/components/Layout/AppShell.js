/**
 * AppShell — Layout orchestrator.
 * Manages sidebar state, mobile detection, filing flow detection,
 * content padding, and page transitions via Framer Motion.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import CommandPalette from '../Shared/CommandPalette';
import KeyboardShortcutsHelp from '../Shared/KeyboardShortcutsHelp';
import OfflineBanner from '../Shared/OfflineBanner';
import useSidebarStore from '../../store/useSidebarStore';
import useSystemTheme from '../../hooks/useSystemTheme';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import useSequentialShortcut from '../../hooks/useSequentialShortcut';

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const pageTransition = {
  duration: 0.2,
  ease: [0, 0, 0.2, 1],
};

export const AppShell = ({ children }) => {
  useSystemTheme();
  useSequentialShortcut();
  const { isCollapsed, toggle, setCollapsed } = useSidebarStore();
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  const location = useLocation();

  // Global keyboard shortcuts
  const shortcuts = useMemo(
    () => [
      { key: 'k', meta: true, handler: () => setCommandPaletteOpen(true) },
      { key: 'Escape', handler: () => { setCommandPaletteOpen(false); setShortcutsHelpOpen(false); } },
      { key: '?', handler: () => setShortcutsHelpOpen((v) => !v) },
    ],
    [],
  );
  useKeyboardShortcuts(shortcuts);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filing flow detection: hide sidebar/bottom nav on /filing/:filingId/* (excluding /filing/start)
  const isFilingFlow =
    /^\/filing\/[^/]+/.test(location.pathname) &&
    location.pathname !== '/filing/start';

  const handleMenuClick = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const handleMobileClose = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Sidebar width for content padding on desktop
  const sidebarWidth = isCollapsed ? 56 : 224;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-page)' }}>
      {/* Header: 56px sticky */}
      <Header onMenuClick={handleMenuClick} />

      <div className="flex flex-1 relative">
        {/* Desktop Sidebar */}
        {!isMobile && !isFilingFlow && (
          <Sidebar
            isCollapsed={isCollapsed}
            onToggle={toggle}
            isMobile={false}
            isOpenMobile={false}
            onClose={() => {}}
          />
        )}

        {/* Mobile Sidebar slide-over */}
        {isMobile && !isFilingFlow && (
          <Sidebar
            isCollapsed={false}
            onToggle={() => {}}
            isMobile={true}
            isOpenMobile={isMobileMenuOpen}
            onClose={handleMobileClose}
          />
        )}

        {/* Main content area */}
        <main
          className="flex-1 transition-all duration-300 ease-in-out"
          style={{
            paddingLeft:
              !isMobile && !isFilingFlow ? `${sidebarWidth}px` : '0px',
          }}
        >
          <div
            className={`${isFilingFlow ? 'p-0' : isMobile ? 'p-4' : 'p-6'} ${
              isMobile && !isFilingFlow ? 'pb-24' : ''
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile BottomNav — hidden on filing flow and desktop */}
      {isMobile && !isFilingFlow && <BottomNav />}

      {/* Command Palette */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp isOpen={shortcutsHelpOpen} onClose={() => setShortcutsHelpOpen(false)} />

      {/* Offline Banner */}
      <OfflineBanner />
    </div>
  );
};

export default AppShell;
