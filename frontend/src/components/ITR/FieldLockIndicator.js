// =====================================================
// FIELD LOCK INDICATOR
// Displays lock icon, verified badge, and tooltip for locked fields
// =====================================================

import React, { useState } from 'react';
import { Lock, CheckCircle, AlertCircle, Unlock } from 'lucide-react';
import { cn } from '../../lib/utils';
import UnlockFieldModal from './UnlockFieldModal';

const FieldLockIndicator = ({
  isLocked,
  isVerified = false,
  reason = null,
  allowAdd = false,
  onAddClick = null,
  className = '',
  section = null,
  field = null,
  fieldLabel = null,
  currentValue = null,
  onUnlock = null,
}) => {
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  if (!isLocked && !isVerified) {
    return null;
  }

  const handleUnlockClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (section && field) {
      setShowUnlockModal(true);
    }
  };

  const handleUnlockConfirm = async (unlockedSection, unlockedField, unlockReason) => {
    if (onUnlock) {
      await onUnlock(unlockedSection, unlockedField, unlockReason);
    }
    setShowUnlockModal(false);
  };

  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        {isLocked && (
          <div className="relative group">
            <Lock className="w-4 h-4 text-slate-400" />
            {reason && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                  {reason}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                </div>
              </div>
            )}
          </div>
        )}

        {isVerified && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            <span>Verified</span>
          </div>
        )}

        {allowAdd && onAddClick && (
          <button
            onClick={onAddClick}
            className="text-xs text-gold-600 hover:text-gold-700 font-medium underline"
          >
            Add Another
          </button>
        )}

        {isLocked && section && field && (
          <button
            onClick={handleUnlockClick}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium underline flex items-center gap-1"
            title="Unlock this field"
          >
            <Unlock className="w-3 h-3" />
            Unlock
          </button>
        )}
      </div>

      {showUnlockModal && (
        <UnlockFieldModal
          isOpen={showUnlockModal}
          onClose={() => setShowUnlockModal(false)}
          section={section}
          field={field}
          fieldLabel={fieldLabel}
          currentValue={currentValue}
          onConfirm={handleUnlockConfirm}
        />
      )}
    </>
  );
};

export default FieldLockIndicator;
