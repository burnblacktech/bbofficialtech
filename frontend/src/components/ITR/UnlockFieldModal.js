// =====================================================
// UNLOCK FIELD MODAL
// Confirmation modal for unlocking verified fields
// =====================================================

import React, { useState } from 'react';
import { X, AlertTriangle, Lock, Unlock } from 'lucide-react';
import fieldLockService, { VERIFICATION_STATUS } from '../../services/FieldLockService';

const UnlockFieldModal = ({
  isOpen,
  onClose,
  section,
  field,
  fieldLabel,
  onConfirm,
  currentValue,
}) => {
  const [reason, setReason] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  if (!isOpen) return null;

  const verificationStatus = fieldLockService.getFieldVerificationStatus(section, field);
  const lockStatus = fieldLockService.shouldLockField(section, field, verificationStatus.status);
  const unlockRequest = fieldLockService.requestUnlock(section, field, reason);

  const handleUnlock = async () => {
    if (!unlockRequest.canUnlock) return;

    setIsUnlocking(true);
    try {
      // Unlock the field
      const unlocked = fieldLockService.unlockField(section, field, true);
      
      if (unlocked && onConfirm) {
        await onConfirm(section, field, reason);
      }

      onClose();
      setReason('');
    } catch (error) {
      console.error('Failed to unlock field:', error);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleCancel = () => {
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Unlock Verified Field</h3>
              <p className="text-sm text-gray-500">This field has been verified</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Field Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Field:</span>
              <span className="text-sm text-gray-900">{fieldLabel || `${section}.${field}`}</span>
            </div>
            {currentValue && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">Current Value:</span>
                <p className="text-sm text-gray-900 mt-1 font-mono">{currentValue}</p>
              </div>
            )}
            {lockStatus.reason && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">Lock Reason:</span>
                <p className="text-sm text-gray-700 mt-1">{lockStatus.reason}</p>
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Warning: Unlocking Verified Field
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  This field was verified from a trusted source. Unlocking it will allow you to edit,
                  but the verification status will be lost. Are you sure you want to continue?
                </p>
              </div>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Unlocking <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for unlocking this field..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 resize-none"
              rows={3}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This reason will be logged for audit purposes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleCancel}
            disabled={isUnlocking}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUnlock}
            disabled={!reason.trim() || isUnlocking || !unlockRequest.canUnlock}
            className="px-4 py-2 text-sm font-medium text-white bg-gold-500 rounded-lg hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isUnlocking ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Unlocking...
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                Unlock Field
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnlockFieldModal;

