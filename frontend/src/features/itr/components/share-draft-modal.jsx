// =====================================================
// SHARE DRAFT MODAL COMPONENT
// UI component for sharing draft with CA or other users for review
// Complies with UI.md specifications
// =====================================================

import React, { useState, useEffect, useRef } from 'react';
import { X, Share2, Mail, User, MessageSquare, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { draftService } from '../services/draft.service';
import toast from 'react-hot-toast';

const ShareDraftModal = ({ filingId, isOpen, onClose, onSuccess }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);
  const previousActiveElement = useRef(null);

  const handleShare = async (e) => {
    e.preventDefault();
    
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSharing(true);
    try {
      const result = await draftService.shareDraft(filingId, recipientEmail, message);
      
      if (result.success) {
        setShareLink(result.shareLink);
        toast.success('Draft shared successfully!');
        if (onSuccess) {
          onSuccess(result);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to share draft');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setRecipientEmail('');
    setMessage('');
    setShareLink(null);
    setCopied(false);
    onClose();
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setRecipientEmail('');
        setMessage('');
        setShareLink(null);
        setCopied(false);
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Handle focus management and focus trap
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      
      // Focus on first input when modal opens
      setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        } else if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          firstFocusable?.focus();
        }
      }, 100);
    } else {
      // Restore focus when modal closes
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen]);

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay - UI.md: black-950 at 50% opacity */}
        <div
          className="fixed inset-0 transition-opacity duration-200 bg-black bg-opacity-50"
          onClick={handleClose}
          aria-hidden="true"
        />

        {/* Modal panel - UI.md: scale 0.95 → 1, opacity 0 → 1, duration 200ms, border-radius 20px */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-draft-title"
          className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-overlay transform sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-scale-in"
        >
          
          {/* UI.md: Padding exactly 24px all around */}
          <div className="bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Share2 className="h-5 w-5 text-gold-600 mr-2" />
                <h3 id="share-draft-title" className="text-heading-lg text-gray-800 font-semibold">
                  Share Draft for Review
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

            {!shareLink ? (
              <form onSubmit={handleShare} className="space-y-4">
                <div>
                  <label htmlFor="recipientEmail" className="block text-body-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Recipient Email
                  </label>
                  <input
                    ref={firstInputRef}
                    type="email"
                    id="recipientEmail"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="ca@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    required
                    disabled={isSharing}
                  />
                  <p className="mt-1 text-body-xs text-gray-500">
                    Enter the email address of the CA or reviewer
                  </p>
                </div>

                <div>
                  <label htmlFor="message" className="block text-body-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="h-4 w-4 inline mr-1" />
                    Optional Message
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please review this draft and provide feedback..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    disabled={isSharing}
                  />
                </div>

                <div className="bg-info-50 border border-info-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-info-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-body-xs text-info-800">
                      <p className="font-medium mb-1">What happens next?</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>An email with a secure link will be sent to the recipient</li>
                        <li>The link will expire in 7 days for security</li>
                        <li>The recipient can review and provide feedback</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* UI.md: Actions right-aligned, 12px gap between buttons, primary on right, secondary on left */}
                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-body-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isSharing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-body-sm font-medium text-white bg-gold-500 rounded-lg hover:bg-gold-600 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSharing || !recipientEmail}
                  >
                    {isSharing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sharing...
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Draft
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-success-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-heading-sm font-semibold text-success-900 mb-1">
                        Draft Shared Successfully!
                      </h4>
                      <p className="text-body-sm text-success-800">
                        An email has been sent to <strong>{recipientEmail}</strong> with a link to review the draft.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-gray-700 mb-2">
                    Share Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-body-sm"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                      title="Copy link"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-success-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-body-xs text-gray-500">
                    You can also copy and share this link directly
                  </p>
                </div>

                <div className="flex items-center justify-end pt-4">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-body-sm font-medium text-white bg-gold-500 rounded-lg hover:bg-gold-600 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareDraftModal;

