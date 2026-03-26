import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

/**
 * AppShell — Header (h-14) + Sidebar + Content area.
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

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
            <div className="flex flex-1 relative">
                <Sidebar
                    isCollapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    isMobile={isMobile}
                    onClose={() => setIsMobileMenuOpen(false)}
                    isOpenMobile={isMobileMenuOpen}
                />
                <main className={`flex-1 transition-all duration-300 ${isMobile ? 'w-full' : sidebarCollapsed ? 'pl-14' : 'pl-56'}`}>
                    <div className="p-4 sm:p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
