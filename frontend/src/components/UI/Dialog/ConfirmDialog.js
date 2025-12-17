// =====================================================
// CONFIRM DIALOG COMPONENT
// Confirmation dialog for critical actions
// =====================================================

import React, { useEffect, useRef } from 'react';
import Modal from '../../common/Modal';
import Button from '../../DesignSystem/components/Button';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default', // 'default' | 'danger'
  ...props
}) => {
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isOpen) {
      e.preventDefault();
      onConfirm();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onConfirm]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} {...props}>
      <div className="p-6">
        {variant === 'danger' && (
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-error-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-error-500" />
            </div>
          </div>
        )}

        {description && (
          <p className="text-body-md text-slate-700 mb-6 text-center" style={{ fontSize: '14px', lineHeight: '22px' }}>
            {description}
          </p>
        )}

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmButtonRef}
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;

