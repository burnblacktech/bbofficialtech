// =====================================================
// MODAL COMPONENT - CANONICAL DESIGN SYSTEM
// Unified modal component with consistent styling and behavior
// =====================================================

import React, { useEffect, useRef } from 'react';
// import { enterpriseLogger } from '../../utils/logger';

const Modal = ({
  isOpen,
  onClose,
  children,
  size = 'medium',
  variant = 'default',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  ...props
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, closeOnEscape, onClose]);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      if (modalRef.current) {
        modalRef.current.focus();
      }
    } else {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Base classes
  const baseClasses = 'modal';
  const sizeClass = `modal-${size}`;
  const variantClass = `modal-${variant}`;

  const modalClasses = [
    baseClasses,
    sizeClass,
    variantClass,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={modalClasses}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        {...props}
      >
        {showCloseButton && (
          <button
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <span className="modal-close-icon">×</span>
          </button>
        )}
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

// Modal Header Component
export const ModalHeader = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`modal-header ${className}`} {...props}>
      {children}
    </div>
  );
};

// Modal Body Component
export const ModalBody = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`modal-body ${className}`} {...props}>
      {children}
    </div>
  );
};

// Modal Footer Component
export const ModalFooter = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`modal-footer ${className}`} {...props}>
      {children}
    </div>
  );
};

// Modal Title Component
export const ModalTitle = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <h2 className={`modal-title ${className}`} {...props}>
      {children}
    </h2>
  );
};

// Modal Subtitle Component
export const ModalSubtitle = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p className={`modal-subtitle ${className}`} {...props}>
      {children}
    </p>
  );
};

// Modal Actions Component
export const ModalActions = ({
  children,
  className = '',
  align = 'right',
  ...props
}) => {
  const alignClass = `modal-actions-${align}`;
  return (
    <div className={`modal-actions ${alignClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

// Pre-built modal variants
export const PrimaryModal = (props) => <Modal variant="primary" {...props} />;
export const SuccessModal = (props) => <Modal variant="success" {...props} />;
export const DangerModal = (props) => <Modal variant="danger" {...props} />;
export const WarningModal = (props) => <Modal variant="warning" {...props} />;
export const InfoModal = (props) => <Modal variant="info" {...props} />;

// Pre-built modal sizes
export const SmallModal = (props) => <Modal size="small" {...props} />;
export const MediumModal = (props) => <Modal size="medium" {...props} />;
export const LargeModal = (props) => <Modal size="large" {...props} />;
export const XLargeModal = (props) => <Modal size="xlarge" {...props} />;
export const FullScreenModal = (props) => <Modal size="fullscreen" {...props} />;

// Confirmation modal
export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  ...props
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="small"
      variant={variant}
      {...props}
    >
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <p>{message}</p>
      </ModalBody>
      <ModalFooter>
        <ModalActions>
          <button className="btn btn-secondary" onClick={onClose}>
            {cancelText}
          </button>
          <button className={`btn btn-${variant}`} onClick={handleConfirm}>
            {confirmText}
          </button>
        </ModalActions>
      </ModalFooter>
    </Modal>
  );
};

// Alert modal
export const AlertModal = ({
  isOpen,
  onClose,
  title = 'Alert',
  message,
  variant = 'info',
  buttonText = 'OK',
  ...props
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="small"
      variant={variant}
      {...props}
    >
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <p>{message}</p>
      </ModalBody>
      <ModalFooter>
        <ModalActions>
          <button className={`btn btn-${variant}`} onClick={onClose}>
            {buttonText}
          </button>
        </ModalActions>
      </ModalFooter>
    </Modal>
  );
};

export default Modal;
