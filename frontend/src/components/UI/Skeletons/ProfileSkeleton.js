// =====================================================
// PROFILE SKELETON
// Skeleton screen for profile settings page
// =====================================================

import React from 'react';
import { Skeleton } from '../../DesignSystem/Skeleton';

const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-6">
          {/* Profile Picture Section */}
          <div className="flex items-center gap-4 pb-6 border-b border-neutral-200">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-24 rounded" />
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded" />
              </div>
            ))}
          </div>

          {/* Address Section */}
          <div className="pt-6 border-t border-neutral-200 space-y-4">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-neutral-200">
            <Skeleton className="h-10 w-24 rounded" />
            <Skeleton className="h-10 w-24 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;

