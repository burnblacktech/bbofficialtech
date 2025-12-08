// =====================================================
// SKELETON LOADER COMPONENT
// Loading placeholder component for better UX
// =====================================================

import React from 'react';

/**
 * Skeleton loader for dashboard stats
 */
export const DashboardStatsSkeleton = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton loader for filing cards
 */
export const FilingCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-2 bg-gray-200 rounded w-full mb-2" />
          <div className="h-2 bg-gray-200 rounded w-3/4" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-24" />
      </div>
    </div>
  );
};

/**
 * Skeleton loader for activity feed
 */
export const ActivityFeedSkeleton = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start space-x-3 animate-pulse">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Generic skeleton loader with customizable width and height
 */
export const Skeleton = ({ width = '100%', height = '1rem', className = '' }) => {
  return (
    <div
      className={`bg-gray-200 rounded animate-pulse ${className}`}
      style={{ width, height }}
    />
  );
};

/**
 * Skeleton loader for dashboard page
 */
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>

      {/* Stats skeleton */}
      <DashboardStatsSkeleton />

      {/* Filing cards skeleton */}
      <div className="space-y-3">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-3 animate-pulse" />
        <FilingCardSkeleton />
        <FilingCardSkeleton />
      </div>

      {/* Activity feed skeleton */}
      <div>
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-3 animate-pulse" />
        <ActivityFeedSkeleton />
      </div>
    </div>
  );
};

export default DashboardSkeleton;

