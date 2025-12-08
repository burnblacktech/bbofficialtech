// =====================================================
// FIELD VERIFICATION STATUS
// Displays verification status, lock/unlock logic, and add additional entry button
// =====================================================

import React from 'react';
import FieldLockIndicator from './FieldLockIndicator';
import DataSourceBadge from './DataSourceBadge';
import { VERIFICATION_STATUS } from '../../services/FieldLockService';
import fieldLockService from '../../services/FieldLockService';

const FieldVerificationStatus = ({
  section,
  field,
  verificationStatus,
  fieldSource = null,
  onAddClick = null,
  className = '',
}) => {
  // Get lock status
  const lockStatus = fieldLockService.shouldLockField(section, field, verificationStatus);

  // Determine if verified
  const isVerified = verificationStatus === VERIFICATION_STATUS.VERIFIED;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <FieldLockIndicator
        isLocked={lockStatus.locked}
        isVerified={isVerified}
        reason={lockStatus.reason}
        allowAdd={lockStatus.allowAdd}
        onAddClick={lockStatus.allowAdd && onAddClick ? onAddClick : null}
      />
      {fieldSource && (
        <DataSourceBadge
          source={fieldSource.source || fieldSource}
          size="sm"
        />
      )}
    </div>
  );
};

export default FieldVerificationStatus;

