// =====================================================
// AUTH LAYOUT COMPONENT - CONSISTENT AUTH PAGE DESIGN
// Provides consistent layout for all authentication pages
// =====================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-heading-2 font-bold text-slate-900">BurnBlack</h1>
              <p className="text-body-regular text-slate-600">Enterprise Tax Platform</p>
            </div>
          </Link>
        </div>

        {title && (
          <div className="mt-6 text-center">
            <h2 className="text-heading-1 font-bold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="mt-2 text-body-regular text-slate-600">{subtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-elevation-4 sm:rounded-xl sm:px-10 border border-gray-100">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-body-small text-slate-500">
          &copy; {new Date().getFullYear()} BurnBlack. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
