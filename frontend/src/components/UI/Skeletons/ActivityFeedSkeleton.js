// =====================================================
// ACTIVITY FEED SKELETON
// Skeleton for activity feed
// =====================================================

import React from 'react';
import { Skeleton } from '../../DesignSystem/Skeleton';

export const ActivityFeedSkeleton = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeedSkeleton;

