// =====================================================
// ROUTE LOADER - Loading fallback for lazy-loaded routes
// =====================================================

import React from 'react';
import { Loader } from 'lucide-react';

const RouteLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
};

export default RouteLoader;

