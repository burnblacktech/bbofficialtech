import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Auth Layout Template
 *
 * Standalone layout for authentication pages (login, signup, forgot password)
 * Does NOT include AppShell, Sidebar, or Header - completely independent
 * Brand colors: Dark background with golden yellow gradients
 */
export const AuthLayout = ({
    title,
    subtitle,
    children,
    showLogo = true,
    showFooter = true,
}) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex flex-col">
            {/* Header with Logo */}
            {showLogo && (
                <header className="w-full py-6 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <Link to="/" className="flex items-center space-x-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-gold-500/50 transition-shadow">
                                <img
                                    src="/bb-logo.svg"
                                    alt="BurnBlack"
                                    className="w-full h-full object-contain p-2"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block';
                                    }}
                                />
                                <span className="text-slate-900 font-bold text-lg hidden">BB</span>
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent group-hover:from-gold-300 group-hover:to-gold-500 transition-all">
                                BurnBlack
                            </span>
                        </Link>

                        {/* Optional: Add a "Back to Home" link */}
                        <Link
                            to="/"
                            className="text-sm font-medium text-slate-400 hover:text-gold-400 transition-colors"
                        >
                            ← Back to Home
                        </Link>
                    </div>
                </header>
            )}

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                <div className="w-full max-w-md">
                    {/* Title and Subtitle */}
                    {(title || subtitle) && (
                        <div className="text-center mb-8">
                            {title && (
                                <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 bg-clip-text text-transparent mb-3 tracking-tight">
                                    {title}
                                </h1>
                            )}
                            {subtitle && (
                                <p className="text-base text-slate-400 font-medium leading-relaxed">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Content Card */}
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gold-500/20 p-8 sm:p-10">
                        {children}
                    </div>
                </div>
            </main>

            {/* Footer */}
            {showFooter && (
                <footer className="w-full py-6 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                            <p>© {new Date().getFullYear()} BurnBlack. All rights reserved.</p>
                            <div className="flex items-center gap-6">
                                <Link to="/privacy" className="hover:text-gold-400 transition-colors">
                                    Privacy Policy
                                </Link>
                                <Link to="/terms" className="hover:text-gold-400 transition-colors">
                                    Terms of Service
                                </Link>
                                <Link to="/help" className="hover:text-gold-400 transition-colors">
                                    Help
                                </Link>
                            </div>
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
};
