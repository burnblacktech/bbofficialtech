import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

/**
 * AppShell - The structural wrapper that provides global navigation
 */
export const AppShell = ({ children }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setIsMobileMenuOpen(false);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Navigation */}
            <Header
                onMenuClick={toggleMobileMenu}
                sidebarOpen={!sidebarCollapsed}
            />

            <div className="flex flex-1 relative">
                {/* Vertical Navigation */}
                <Sidebar
                    isCollapsed={sidebarCollapsed}
                    onToggle={toggleSidebar}
                    isMobile={isMobile}
                    onClose={closeMobileMenu}
                    isOpenMobile={isMobileMenuOpen}
                />

                {/* Main Content Area */}
                <main className={`flex-1 transition-all duration-300 ease-in-out ${isMobile ? 'w-full' : sidebarCollapsed ? 'pl-16' : 'pl-64'
                    }`}>
                    <div className="p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
