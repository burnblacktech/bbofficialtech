// =====================================================
// DATA SOURCE SKELETON
// Skeleton screen for data source selection page
// =====================================================

import React from 'react';
import { Skeleton } from '../Skeleton/Skeleton';

const DataSourceSkeleton = () => {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="h-6 w-48" />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="mb-6 text-center">
            <Skeleton className="h-8 w-64 mx-auto mb-2" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-neutral-200 p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Skeleton className="w-12 h-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/6" />
                </div>
                <Skeleton className="h-10 w-full rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSourceSkeleton;

