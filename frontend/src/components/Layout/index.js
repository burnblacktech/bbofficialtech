// =====================================================
// LAYOUT COMPONENT - MAIN APPLICATION LAYOUT
// Integrates Header, Sidebar, Footer with responsive design
// =====================================================

import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleMobileSidebarClose = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[var(--s29-bg-main)] flex flex-col">
      {/* Header */}
      <Header
        onMenuClick={handleMenuClick}
        sidebarOpen={mobileSidebarOpen}
      />

      {/* Main Container - flex-1 to push footer down */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
          isMobile={mobileSidebarOpen}
          onClose={handleMobileSidebarClose}
        />

        {/* Main Content Area - flex-1 to fill available space */}
        <main
          className={`
            flex-1 overflow-y-auto flex flex-col
            transition-all duration-300 ease-in-out
            ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
          `}
        >
          <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-5">
            {children}
          </div>
        </main>
      </div>

      {/* Footer - will be pushed to bottom by flex layout */}
      <Footer />
    </div>
  );
};

export default Layout;

