// =====================================================
// E-VERIFICATION MODAL
// Modal component for E-verification before ITR submission
// Integrates VerificationForm with E-verification service
// =====================================================

import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import VerificationForm from '../Forms/VerificationForm';
import everificationService from '../../services/everificationService';
import Button from '../common/Button';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

const EVerificationModal = ({
  isOpen,
  onClose,
  draftId,
  filingId,
  onVerificationComplete,
  formData,
}) => {
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const modalRef = useRef(null);
  const firstFocusableRef = useRef(null);

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isProcessing) {
        handleClose();
      }
    };

    // Focus first element when modal opens
    if (firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isProcessing]);

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

  if (!isOpen) return null;

  const handleVerificationSubmit = async (data) => {
    setIsProcessing(true);
    try {
      let result;

      switch (data.verificationMethod || data.verification_method) {
        case 'AADHAAR_OTP':
          if (!otpSent) {
            // Send OTP first
            const aadhaar = formData?.personal_info?.aadhaar || formData?.personalInfo?.aadhaar || '';
            if (!aadhaar) {
              toast.error('Aadhaar number not found in filing data');
              setIsProcessing(false);
              return;
            }
            setAadhaarNumber(aadhaar);
            result = await everificationService.sendAadhaarOTP(draftId, aadhaar);
            if (result.success && result.otpSent) {
              setOtpSent(true);
              toast.success('OTP sent successfully to your registered mobile number');
              setIsProcessing(false);
              return;
            }
          } else {
            // Verify OTP
            result = await everificationService.verifyAadhaarOTP(
              draftId,
              aadhaarNumber,
              data.aadhaar_otp,
            );
          }
          break;

        case 'NETBANKING':
          result = await everificationService.verifyNetBanking(
            draftId,
            data.netbanking_details,
            {
              userId: data.netbanking_details.user_id,
              password: data.netbanking_details.password,
            },
          );
          break;

        case 'DSC':
          result = await everificationService.verifyDSC(draftId, data.dsc_details);
          break;

        default:
          throw new Error('Invalid verification method');
      }

      const verificationMethod = data.verificationMethod || data.verification_method;
      if (result.success && result.verified) {
        setVerificationStatus({
          success: true,
          method: verificationMethod,
          message: result.message || 'Verification successful',
        });

        toast.success('E-verification completed successfully');

        if (onVerificationComplete) {
          onVerificationComplete({
            method: verificationMethod,
            verified: true,
            verificationToken: result.verificationToken,
          });
        }
      } else {
        setVerificationStatus({
          success: false,
          method: verificationMethod,
          message: result.message || 'Verification failed',
        });
        toast.error(result.message || 'Verification failed');
      }
    } catch (error) {
      console.error('E-verification error:', error);
      setVerificationStatus({
        success: false,
        message: error.response?.data?.error || error.message || 'Verification failed',
      });
      toast.error(error.response?.data?.error || error.message || 'Verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendOTP = async () => {
    setIsProcessing(true);
    try {
      const aadhaar = formData?.personal_info?.aadhaar || formData?.personalInfo?.aadhaar || '';
      const result = await everificationService.sendAadhaarOTP(draftId, aadhaar);
      if (result.success && result.otpSent) {
        toast.success('OTP resent successfully');
      }
    } catch (error) {
      toast.error('Failed to resend OTP');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setVerificationStatus(null);
      setOtpSent(false);
      setAadhaarNumber('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-modal="true" role="dialog">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop - UI.md: black-950 at 50% opacity */}
        <div
          className="fixed inset-0 bg-black-950 bg-opacity-50 transition-opacity duration-200"
          onClick={handleClose}
          aria-hidden="true"
        />

        {/* Modal - UI.md: white background, shadow-overlay, border-radius 20px, width 560px, padding 24px */}
        <div
          ref={modalRef}
          className={cn(
            'relative w-full max-w-[560px] bg-white shadow-overlay rounded-3xl',
            'animate-scale-in',
          )}
          aria-labelledby="everification-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h2 id="everification-title" className="text-heading-lg text-gray-800">
              E-Verification
            </h2>
            <button
              ref={firstFocusableRef}
              onClick={handleClose}
              disabled={isProcessing}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 rounded"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {verificationStatus?.success ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-success-500 mb-4" aria-hidden="true" />
                <h3 className="text-heading-md text-gray-800 mb-2">
                  Verification Successful
                </h3>
                <p className="text-body-md text-gray-600 mb-6">{verificationStatus.message}</p>
                <Button
                  onClick={handleClose}
                  className="bg-gold-500 hover:bg-gold-600 text-white"
                >
                  Continue
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-body-md text-gray-600">
                    Please complete E-verification to proceed with ITR submission. Choose your
                    preferred verification method below.
                  </p>
                </div>

                {otpSent && (
                  <div className="mb-6 rounded-xl bg-info-50 border border-info-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-md font-medium text-info-900">
                          OTP sent successfully
                        </p>
                        <p className="text-body-sm text-info-700 mt-1">
                          Please enter the 6-digit OTP sent to your registered mobile number
                        </p>
                      </div>
                      <button
                        onClick={handleResendOTP}
                        disabled={isProcessing}
                        className="text-body-sm text-info-600 hover:text-info-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-info-500 rounded"
                        aria-label="Resend OTP"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                )}

                <VerificationForm
                  onSubmit={handleVerificationSubmit}
                  initialData={{
                    verificationMethod: 'AADHAAR_OTP',
                  }}
                  isReadOnly={isProcessing}
                />

                {verificationStatus && !verificationStatus.success && (
                  <div className="mt-6 rounded-xl bg-error-50 border border-error-200 p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-error-500 mt-0.5 mr-2" aria-hidden="true" />
                      <div>
                        <p className="text-body-md font-medium text-error-900">Verification Failed</p>
                        <p className="text-body-sm text-error-700 mt-1">{verificationStatus.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="mt-6 flex items-center justify-center py-4">
                    <Loader className="h-5 w-5 animate-spin text-gold-500 mr-2" aria-hidden="true" />
                    <span className="text-body-md text-gray-600">Processing verification...</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EVerificationModal;

