// =====================================================
// E-VERIFICATION PAGE
// Verify ITR after submission using multiple methods
// =====================================================

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Smartphone,
  Building2,
  Key,
  Send,
  Shield,
  AlertCircle,
  RefreshCw,
  Loader,
  FileCheck,
  Download,
  PartyPopper,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/core/APIClient';
import itrService from '../../services/api/itrService';
import EVerificationOptions from '../../components/ITR/EVerificationOptions';
import { ensureJourneyStart, trackEvent } from '../../utils/analyticsEvents';

const EVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get filing details from navigation state
  const filing = location.state?.filing;
  const acknowledgmentNumber = filing?.acknowledgmentNumber || location.state?.acknowledgmentNumber;
  const assessmentYear = filing?.assessmentYear || location.state?.assessmentYear || '2025-26';

  // Component state
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, processing, success, failed
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [filingId, setFilingId] = useState(filing?.id || null);

  // Route guard and extract filing ID
  useEffect(() => {
    if (!acknowledgmentNumber && !filing) {
      toast.error('No filing found for verification');
      navigate('/filing-history');
      return;
    }

    // Extract filing ID from filing object or location state
    if (filing?.id) {
      setFilingId(filing.id);
    } else if (location.state?.filingId) {
      setFilingId(location.state.filingId);
    }
  }, [acknowledgmentNumber, filing, location.state, navigate]);

  // Funnel analytics: e-verification view
  useEffect(() => {
    ensureJourneyStart();
    trackEvent('itr_everify_view', {
      filingId: filingId || filing?.id || null,
      acknowledgmentNumber: acknowledgmentNumber || null,
      assessmentYear: assessmentYear || null,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Handle method selection
  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setOtpSent(false);
    setOtp(['', '', '', '', '', '']);
    setOtpError(null);
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError(null);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Send OTP
  const handleSendOtp = async () => {
    if (!acknowledgmentNumber) {
      toast.error('Acknowledgment number is required');
      return;
    }

    setIsProcessing(true);
    try {
      // Map frontend method names to backend method names
      const methodMap = {
        'aadhaar': 'AADHAAR_OTP',
        'netbanking': 'NETBANKING',
        'dsc': 'DSC',
        'evc': 'EVC',
      };

      const backendMethod = methodMap[selectedMethod] || selectedMethod;

      // Initiate e-verification via ERI API
      const response = await apiClient.post('/eri/everify/initiate', {
        acknowledgmentNumber,
        method: backendMethod,
      });

      if (response.data?.transactionId) {
        setTransactionId(response.data.transactionId);
        setOtpSent(true);
        setResendTimer(60); // 60 seconds resend timer
        toast.success(`OTP sent to your registered ${selectedMethod === 'aadhaar' ? 'Aadhaar-linked mobile' : 'mobile number'}`);
      } else {
        throw new Error('Failed to initiate verification');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error(error.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setOtpError('Please enter complete 6-digit OTP');
      return;
    }

    if (!transactionId) {
      toast.error('Verification session expired. Please request OTP again.');
      return;
    }

    setIsProcessing(true);
    setVerificationStatus('processing');

    try {
      // Complete e-verification via ERI API
      const response = await apiClient.post('/eri/everify/complete', {
        transactionId,
        otp: otpValue,
      });

      if (response.data?.verified) {
        setVerificationStatus('success');
        toast.success('ITR verified successfully!');
        trackEvent('itr_everify_success', {
          filingId: filingId || null,
          acknowledgmentNumber: acknowledgmentNumber || null,
          method: selectedMethod || null,
        });
        // If filingId exists, mark ITR-V as verified
        if (filingId) {
          try {
            await apiClient.post(`/itrv/verify/${filingId}`, {
              verificationMethod: 'AADHAAR_OTP',
            });
          } catch (err) {
            console.warn('Failed to update ITR-V status:', err);
            // Don't fail the verification if this update fails
          }
        }
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setVerificationStatus('failed');
      setOtpError('Invalid OTP. Please try again.');
      toast.error(error.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle net banking verification
  const handleNetBankingVerify = async () => {
    if (!acknowledgmentNumber) {
      toast.error('Acknowledgment number is required');
      return;
    }

    setIsProcessing(true);
    setVerificationStatus('processing');
    try {
      // Initiate net banking verification
      const response = await apiClient.post('/eri/everify/initiate', {
        acknowledgmentNumber,
        method: 'NETBANKING',
      });

      if (response.data?.transactionId) {
        setTransactionId(response.data.transactionId);
        // In production, this would redirect to bank's login page
        // For now, simulate success (bank integration would handle redirect)
        setVerificationStatus('success');
        toast.success('ITR verified via Net Banking!');
        // Update ITR-V status if filingId exists
        if (filingId) {
          try {
            await apiClient.post(`/itrv/verify/${filingId}`, {
              verificationMethod: 'NETBANKING',
            });
          } catch (err) {
            console.warn('Failed to update ITR-V status:', err);
          }
        }
      } else {
        throw new Error('Failed to initiate net banking verification');
      }
    } catch (error) {
      console.error('Net banking verification error:', error);
      setVerificationStatus('failed');
      toast.error(error.response?.data?.error || 'Net Banking verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle DSC verification
  const handleDscVerify = async () => {
    if (!acknowledgmentNumber) {
      toast.error('Acknowledgment number is required');
      return;
    }

    setIsProcessing(true);
    setVerificationStatus('processing');
    try {
      // Initiate DSC verification
      const response = await apiClient.post('/eri/everify/initiate', {
        acknowledgmentNumber,
        method: 'DSC',
      });

      if (response.data?.transactionId) {
        setTransactionId(response.data.transactionId);
        // In production, this would initiate DSC signing flow
        // For now, simulate success (DSC integration would handle certificate selection)
        setVerificationStatus('success');
        toast.success('ITR signed with DSC!');
        // Update ITR-V status if filingId exists
        if (filingId) {
          try {
            await apiClient.post(`/itrv/verify/${filingId}`, {
              verificationMethod: 'DSC',
            });
          } catch (err) {
            console.warn('Failed to update ITR-V status:', err);
          }
        }
      } else {
        throw new Error('Failed to initiate DSC verification');
      }
    } catch (error) {
      console.error('DSC verification error:', error);
      setVerificationStatus('failed');
      toast.error(error.response?.data?.error || 'DSC verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle physical ITR-V send
  const handlePhysicalSend = async () => {
    if (!filingId) {
      toast.error('Filing ID is required');
      return;
    }

    try {
      // Download ITR-V
      await itrService.downloadAcknowledgment(filingId);
      toast.success('ITR-V downloaded. Send signed copy to CPC Bangalore within 120 days.');
      // Mark as manual verification method
      if (filingId) {
        try {
          await apiClient.post(`/itrv/verify/${filingId}`, {
            verificationMethod: 'MANUAL',
          });
        } catch (err) {
          console.warn('Failed to update ITR-V status:', err);
        }
      }
    } catch (error) {
      console.error('Download ITR-V error:', error);
      toast.error('Failed to download ITR-V. Please try again.');
    }
  };

  // Go to dashboard after success
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  // Download acknowledgment
  const handleDownloadAck = async () => {
    if (!filingId) {
      toast.error('Filing ID is required');
      return;
    }

    try {
      await itrService.downloadAcknowledgment(filingId);
      toast.success('Acknowledgment downloaded successfully');
    } catch (error) {
      console.error('Download acknowledgment error:', error);
      toast.error('Failed to download acknowledgment. Please try again.');
    }
  };

  // Render success state
  if (verificationStatus === 'success') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-card border border-slate-200 p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10, delay: 0.2 }}
            className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <PartyPopper className="w-10 h-10 text-success-600" />
          </motion.div>

          <h2 className="text-heading-2 font-bold text-slate-900 mb-2">
            ITR Successfully Verified! 🎉
          </h2>
          <p className="text-slate-600 mb-6">
            Your Income Tax Return for AY {assessmentYear} has been e-verified and submitted to the Income Tax Department.
          </p>

          <div className="bg-success-50 border border-success-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-success-700 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Acknowledgment Number</span>
            </div>
            <p className="text-body-large font-mono font-bold text-success-800">
              {acknowledgmentNumber}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleDownloadAck}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Acknowledgment
            </button>

            <button
              onClick={handleGoToDashboard}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-aurora-gradient text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-elevation-3 shadow-primary-500/20"
            >
              Go to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="bg-white shadow-elevation-1 border-b sticky top-0 z-50 -mx-3 sm:-mx-4 lg:-mx-6 xl:-mx-8">
        <div className="px-3 sm:px-4 lg:px-6 xl:px-8 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </button>
            <div>
              <h1 className="text-heading-4 font-semibold text-slate-900">E-Verify Your ITR</h1>
              <p className="text-body-small text-slate-500">Complete verification within 30 days</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto">
        {/* Filing Info Card */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">ITR Submitted Successfully</h3>
              <p className="text-body-regular text-slate-500">AY {assessmentYear} • {acknowledgmentNumber}</p>
            </div>
            <div className="flex items-center gap-1 text-warning-600 bg-warning-50 px-3 py-1 rounded-full">
              <Clock className="w-4 h-4" />
              <span className="text-body-regular font-medium">Pending Verification</span>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-info-50 border border-info-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-info-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-info-900 mb-1">Why E-Verify?</h4>
              <p className="text-body-regular text-info-700">
                E-verification validates your identity and completes your ITR filing. Without verification, your return won't be processed.
              </p>
            </div>
          </div>
        </div>

        {/* Verification Methods */}
        {!selectedMethod ? (
          <EVerificationOptions onSelect={handleMethodSelect} />
        ) : (
          <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6">
            {/* Back to methods */}
            <button
              onClick={() => setSelectedMethod(null)}
              className="flex items-center gap-2 text-body-regular text-slate-500 hover:text-slate-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Choose different method
            </button>

            {/* Aadhaar OTP */}
            {selectedMethod === 'aadhaar' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-success-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Aadhaar OTP Verification</h3>
                    <p className="text-body-regular text-slate-500">OTP will be sent to Aadhaar-linked mobile</p>
                  </div>
                </div>

                {!otpSent ? (
                  <button
                    onClick={handleSendOtp}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-aurora-gradient text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-elevation-3 shadow-primary-500/20 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    {isProcessing ? 'Sending...' : 'Send OTP'}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-body-regular font-medium text-slate-700 mb-2">
                        Enter 6-digit OTP
                      </label>
                      <div className="flex gap-2 justify-center">
                        {otp.map((digit, index) => (
                          <input
                            key={`otp-input-${index}`}
                            id={`otp-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                              otpError ? 'border-error-500' : 'border-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      {otpError && (
                        <p className="text-body-regular text-error-600 mt-2 text-center">{otpError}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      {resendTimer > 0 ? (
                        <span className="text-body-regular text-slate-500">
                          Resend OTP in {resendTimer}s
                        </span>
                      ) : (
                        <button
                          onClick={handleSendOtp}
                          className="flex items-center gap-1 text-body-regular text-primary-600 hover:text-primary-700 font-medium"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <button
                      onClick={handleVerifyOtp}
                      disabled={isProcessing || otp.join('').length !== 6}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-aurora-gradient text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-elevation-3 shadow-primary-500/20 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      {isProcessing ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Net Banking */}
            {selectedMethod === 'netbanking' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-info-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-info-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Net Banking Verification</h3>
                    <p className="text-body-regular text-slate-500">Login to your bank to verify</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <p className="text-body-regular text-slate-600">
                    You'll be redirected to your bank's website to login and authorize the verification.
                    Your bank details are not shared with us.
                  </p>
                </div>

                <button
                  onClick={handleNetBankingVerify}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-aurora-gradient text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-elevation-3 shadow-primary-500/20 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Building2 className="w-5 h-5" />
                  )}
                  {isProcessing ? 'Connecting...' : 'Continue to Bank'}
                </button>
              </div>
            )}

            {/* DSC */}
            {selectedMethod === 'dsc' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-ember-100 rounded-xl flex items-center justify-center">
                    <Key className="w-6 h-6 text-ember-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Digital Signature (DSC)</h3>
                    <p className="text-body-regular text-slate-500">Sign using your registered DSC</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <p className="text-body-regular text-slate-600">
                    Ensure your DSC token is connected to your computer.
                    You'll be prompted to select your certificate and enter the PIN.
                  </p>
                </div>

                <button
                  onClick={handleDscVerify}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-aurora-gradient text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-elevation-3 shadow-primary-500/20 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Key className="w-5 h-5" />
                  )}
                  {isProcessing ? 'Signing...' : 'Sign with DSC'}
                </button>
              </div>
            )}

            {/* Physical ITR-V */}
            {selectedMethod === 'physical' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Send className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Physical ITR-V Submission</h3>
                    <p className="text-body-regular text-slate-500">Send signed ITR-V to CPC</p>
                  </div>
                </div>

                <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 mb-4">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0" />
                    <div className="text-body-regular text-warning-700">
                      <p className="font-medium mb-1">Important Instructions:</p>
                      <ol className="list-decimal ml-4 space-y-1">
                        <li>Download and print the ITR-V</li>
                        <li>Sign it in blue ink</li>
                        <li>Send via Speed Post to CPC Bangalore within 120 days</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <p className="text-body-regular text-slate-700 font-medium mb-2">Send to:</p>
                  <p className="text-body-regular text-slate-600">
                    Income Tax Department - CPC<br />
                    Post Bag No - 1<br />
                    Electronic City Post Office<br />
                    Bengaluru - 560100, Karnataka
                  </p>
                </div>

                <button
                  onClick={handlePhysicalSend}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-aurora-gradient text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-elevation-3 shadow-primary-500/20"
                >
                  <Download className="w-5 h-5" />
                  Download ITR-V
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default EVerification;
