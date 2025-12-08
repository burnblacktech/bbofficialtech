// =====================================================
// ITR COMPUTATION SKELETON
// Skeleton screen for ITR computation page
// =====================================================

import React from 'react';
import { Skeleton } from '../Skeleton/Skeleton';

const ITRComputationSkeleton = () => {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded" />
            <Skeleton className="h-8 w-20 rounded" />
            <Skeleton className="h-8 w-24 rounded" />
          </div>
        </div>
      </div>

      {/* Tax Computation Bar Skeleton */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <div className="flex items-center gap-6">
            <div className="text-center">
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="text-center">
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="text-center">
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Skeleton */}
        <div className="w-64 bg-white border-r border-neutral-200 p-4">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-6">
            {/* Section Title */}
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded" />
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Skeleton className="h-10 w-24 rounded" />
              <Skeleton className="h-10 w-24 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ITRComputationSkeleton;

