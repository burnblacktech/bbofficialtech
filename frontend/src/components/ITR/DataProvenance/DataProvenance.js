// =====================================================
// DATA PROVENANCE COMPONENT
// Display source and verification status for data points
// =====================================================

import React from 'react';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import SourceChip from '../../ui/SourceChip/SourceChip';
import { formatIndianDateTime } from '../../../lib/format';
import { cn } from '../../../utils';

const DataProvenance = ({
  source,
  verified = false,
  lastUpdated,
  editedBy,
  editHistory = [],
  className = '',
}) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <SourceChip source={source} verified={verified} size="sm" />

      {lastUpdated && (
        <div className="flex items-center space-x-1 text-body-sm text-slate-500" style={{ fontSize: '13px', lineHeight: '20px' }}>
          <Clock className="w-3 h-3" />
          <span>Updated {formatIndianDateTime(lastUpdated)}</span>
        </div>
      )}

      {verified && (
        <div className="flex items-center space-x-1 text-success-600">
          <CheckCircle className="w-3 h-3" />
          <span className="text-body-sm" style={{ fontSize: '13px', lineHeight: '20px' }}>Verified</span>
        </div>
      )}

      {editedBy && (
        <span className="text-body-sm text-slate-500" style={{ fontSize: '13px', lineHeight: '20px' }}>
          by {editedBy}
        </span>
      )}
    </div>
  );
};

export default DataProvenance;

