// =====================================================
// FILING CARD SKELETON
// Skeleton for filing cards
// =====================================================

import React from 'react';
import { Skeleton } from '../../DesignSystem/Skeleton';

export const FilingCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Skeleton className="h-5 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-2 w-full mb-2" />
          <Skeleton className="h-2 w-3/4" />
        </div>
        <Skeleton className="h-8 w-24 rounded" />
      </div>
    </div>
  );
};

export default FilingCardSkeleton;

