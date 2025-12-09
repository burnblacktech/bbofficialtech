// =====================================================
// CA INQUIRY MODAL COMPONENT
// Modal for sending inquiry to CA firm
// =====================================================

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, FileText, AlertCircle } from 'lucide-react';
import { useSendInquiry } from '../../features/ca-marketplace/hooks/use-ca-marketplace';
import toast from 'react-hot-toast';

const CAInquiryModal = ({ firmId, firmName, isOpen, onClose, onSubmit }) => {
  const [message, setMessage] = useState('');
  const [filingId, setFilingId] = useState('');
  const [inquiryType, setInquiryType] = useState('general');
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);
  const previousActiveElement = useRef(null);

  const sendInquiryMutation = useSendInquiry();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        } else if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          firstFocusable?.focus();
        }
      }, 100);
    } else {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTab);
    return () => modal.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  const handleClose = () => {
    setMessage('');
    setFilingId('');
    setInquiryType('general');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const inquiryData = {
      message: message.trim(),
      type: inquiryType,
      filingId: filingId || null,
    };

    if (onSubmit) {
      await onSubmit(inquiryData);
    } else {
      try {
        await sendInquiryMutation.mutateAsync({
          firmId,
          inquiryData,
        });
        handleClose();
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity duration-200 bg-black bg-opacity-50"
          onClick={handleClose}
          aria-hidden="true"
        />

        {/* Modal panel */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="inquiry-modal-title"
          className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-overlay transform sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-scale-in"
        >
          <div className="bg-white p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 text-gold-600 mr-2" />
                <h3 id="inquiry-modal-title" className="text-heading-lg text-gray-800 font-semibold">
                  Send Inquiry
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* CA Firm Name */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-body-sm text-gray-600">To:</p>
              <p className="text-body-md font-medium text-gray-900">{firmName}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Inquiry Type */}
              <div>
                <label htmlFor="inquiryType" className="block text-body-sm font-medium text-gray-700 mb-2">
                  Inquiry Type
                </label>
                <select
                  id="inquiryType"
                  ref={firstInputRef}
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                >
                  <option value="general">General Inquiry</option>
                  <option value="itr_filing">ITR Filing Help</option>
                  <option value="tax_planning">Tax Planning</option>
                  <option value="consultation">Consultation Request</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Filing ID (optional) */}
              {inquiryType === 'itr_filing' && (
                <div>
                  <label htmlFor="filingId" className="block text-body-sm font-medium text-gray-700 mb-2">
                    Filing ID (Optional)
                  </label>
                  <input
                    type="text"
                    id="filingId"
                    value={filingId}
                    onChange={(e) => setFilingId(e.target.value)}
                    placeholder="Enter filing ID if related to specific filing"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  />
                </div>
              )}

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-body-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-error-500">*</span>
                </label>
                <textarea
                  id="message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry or question..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  required
                />
                <p className="mt-1 text-body-xs text-gray-500">
                  {message.length}/1000 characters
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-info-50 border border-info-200 rounded-lg p-3">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-info-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-body-xs text-info-800">
                    <p className="font-medium mb-1">What happens next?</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>The CA will receive your inquiry via email</li>
                      <li>You'll be notified when they respond</li>
                      <li>Response time is typically within 24-48 hours</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-body-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendInquiryMutation.isPending || !message.trim()}
                  className="px-4 py-2 text-body-sm font-medium text-white bg-gold-500 rounded-lg hover:bg-gold-600 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendInquiryMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Inquiry
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CAInquiryModal;

