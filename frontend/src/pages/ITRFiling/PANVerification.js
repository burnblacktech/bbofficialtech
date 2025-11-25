import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import enterpriseDebugger from '../../services/EnterpriseDebugger';
import EnterpriseErrorBoundary from '../../components/EnterpriseErrorBoundary';
import surepassService from '../../services/surepassService';
import {
  Shield, CheckCircle, AlertTriangle, Building2,
  ArrowRight, Clock, RefreshCw,
} from 'lucide-react';
import {
  EnterpriseCard,
  EnterpriseButton,
  EnterpriseBadge,
  EnterpriseInput,
  EnterpriseProgress,
} from '../../components/DesignSystem/EnterpriseComponents';
import { getEnterpriseClasses } from '../../components/DesignSystem/EnterpriseDesignSystem';

// PAN Verification Screen - LYRA Flow Step 1
// Purpose: Verify PAN against ITD; optionally fetch pre-fill (AIS/26AS)

const PANVerification = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [panNumber, setPanNumber] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, verifying, success, error
  const [verificationResult, setVerificationResult] = useState(null);
  const [isCAFiling, setIsCAFiling] = useState(false);
  const [prefillData, setPrefillData] = useState(null);
  const [conflictData, setConflictData] = useState(null);
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Enterprise debugging
  useEffect(() => {
    enterpriseDebugger.trackLifecycle('PANVerification', 'MOUNT', {
      user: user?.email,
      role: user?.role,
      flowStep: 'PAN_VERIFICATION',
    });

    return () => {
      enterpriseDebugger.trackLifecycle('PANVerification', 'UNMOUNT');
    };
  }, [user?.email, user?.role]);

  // PAN format validation
  const validatePANFormat = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  // Handle PAN verification using SurePass
  const handleVerifyPAN = async () => {
    if (!validatePANFormat(panNumber)) {
      enterpriseDebugger.log('ERROR', 'PANVerification', 'Invalid PAN format', { pan: panNumber });
      setVerificationStatus('error');
      return;
    }

    setVerificationStatus('verifying');
    enterpriseDebugger.log('INFO', 'PANVerification', 'Starting PAN verification with SurePass', {
      pan: panNumber,
      isCAFiling,
      userRole: user?.role,
    });

    try {
      // Use SurePass service for verification
      const result = await surepassService.verifyPANWithRetry(panNumber);

      if (result.success) {
        setVerificationResult(result.data);

        // Check for name mismatch conflict (if user provided name)
        if (result.data.name && user?.name && result.data.name.toLowerCase() !== user.name.toLowerCase()) {
          setConflictData({
            itdName: result.data.name,
            providedName: user.name,
            pan: panNumber,
          });
        }

        setVerificationStatus('success');

        // Fetch additional details if available
        const detailsResult = await surepassService.getPANDetails(panNumber);
        if (detailsResult.success) {
          setPrefillData({
            ...result.data,
            ...detailsResult.data,
            verifiedBy: 'SurePass',
            verificationTimestamp: new Date().toISOString(),
          });
        } else {
          setPrefillData({
            ...result.data,
            verifiedBy: 'SurePass',
            verificationTimestamp: new Date().toISOString(),
          });
        }

        enterpriseDebugger.log('SUCCESS', 'PANVerification', 'PAN verification successful via SurePass', {
          pan: panNumber,
          name: result.data.name,
          status: result.data.status,
          category: result.data.category,
          aadhaarLinked: result.data.aadhaarLinked,
        });
      } else {
        setVerificationStatus('error');
        enterpriseDebugger.log('ERROR', 'PANVerification', 'PAN verification failed via SurePass', {
          pan: panNumber,
          error: result.error,
          code: result.code,
        });
      }
    } catch (error) {
      setVerificationStatus('error');
      enterpriseDebugger.log('ERROR', 'PANVerification', 'PAN verification API error', {
        pan: panNumber,
        error: error.message,
      });
    }
  };

  // Fetch prefill data (AIS/26AS)
  const fetchPrefillData = async () => {
    try {
      const response = await fetch(`/api/prefill?pan=${panNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setPrefillData(result.data);
        enterpriseDebugger.log('SUCCESS', 'PANVerification', 'Prefill data fetched', {
          pan: panNumber,
          hasAISData: !!result.data.ais,
          has26ASData: !!result.data.form26AS,
        });
      }
    } catch (error) {
      enterpriseDebugger.log('ERROR', 'PANVerification', 'Prefill data fetch failed', {
        pan: panNumber,
        error: error.message,
      });
    }
  };

  // Handle OTP verification
  const handleOTPVerification = async () => {
    if (!otpCode || otpCode.length !== 6) {
      return;
    }

    setVerificationStatus('verifying');

    try {
      const response = await fetch('/api/pan/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          pan: panNumber,
          otp: otpCode,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setVerificationStatus('success');
        setOtpRequired(false);
        await fetchPrefillData();
      } else {
        setVerificationStatus('otp_error');
      }
    } catch (error) {
      setVerificationStatus('otp_error');
    }
  };

  // Handle conflict resolution
  const handleConflictResolution = (acceptITDName) => {
    if (acceptITDName) {
      setConflictData(null);
      enterpriseDebugger.log('INFO', 'PANVerification', 'User accepted ITD name', {
        pan: panNumber,
        itdName: conflictData.itdName,
      });
    } else {
      // Navigate to CA assistance
      navigate('/ca-assistance', {
        state: {
          reason: 'name_mismatch',
          pan: panNumber,
          conflictData,
        },
      });
    }
  };

  // Proceed to ITR selection
  const proceedToITRSelection = () => {
    enterpriseDebugger.log('INFO', 'PANVerification', 'Proceeding to ITR selection', {
      pan: panNumber,
      hasPrefillData: !!prefillData,
      isCAFiling,
    });

    navigate('/interaction-mode-selection', {
      state: {
        pan: panNumber,
        verificationResult,
        prefillData,
        isCAFiling,
      },
    });
  };

  return (
    <EnterpriseErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
        {/* Progress Indicator - ENTERPRISE STANDARD */}
        <div className="bg-white border-b border-neutral-200">
          <div className="px-4 md:px-6 lg:px-8 py-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">ITR Filing Progress</span>
                <span className="text-sm text-neutral-500">Step 1 of 5</span>
              </div>
              <EnterpriseProgress value={20} max={100} variant="primary" />
              <div className="flex justify-between mt-2 text-xs text-neutral-500">
                <span className="text-primary-600 font-medium">PAN Verification</span>
                <span>Income Details</span>
                <span>Deductions</span>
                <span>Documents</span>
                <span>Review & Submit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="max-w-4xl mx-auto">

            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <span className="text-sm font-medium text-blue-600">PAN Verification</span>
                </div>
                <div className="w-16 h-0.5 bg-gray-300"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <span className="text-sm text-gray-500">ITR Selection</span>
                </div>
                <div className="w-16 h-0.5 bg-gray-300"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <span className="text-sm text-gray-500">Income Details</span>
                </div>
              </div>
            </div>

            {/* Main Card - ENTERPRISE STANDARD */}
            <EnterpriseCard className="p-6 md:p-8">

              {/* Title */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-primary-600 mr-3" />
                  <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">Verify Your PAN</h2>
                </div>
                <p className="text-base md:text-lg text-neutral-600 max-w-2xl mx-auto">
                  We'll verify your PAN with the Income Tax Department and fetch your pre-filled data to make filing easier.
                </p>
              </div>

              {/* CA Filing Toggle */}
              <div className="mb-8">
                <div className="bg-neutral-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Building2 className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">Filing Mode</div>
                        <div className="text-sm text-gray-600">
                          {isCAFiling ? 'CA filing for client' : 'Self/family filing'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsCAFiling(!isCAFiling)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isCAFiling ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isCAFiling ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* PAN Input - ENTERPRISE STANDARD */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  PAN Number
                </label>
                <div className="relative">
                  <EnterpriseInput
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className="w-full px-4 py-3 text-lg font-mono tracking-wider"
                    disabled={verificationStatus === 'verifying'}
                  />
                  {panNumber && validatePANFormat(panNumber) && (
                    <CheckCircle className="absolute right-3 top-3 w-6 h-6 text-success-500" />
                  )}
                </div>
                {panNumber && !validatePANFormat(panNumber) && (
                  <p className="mt-2 text-sm text-error-600">
                    Please enter a valid PAN number (e.g., ABCDE1234F)
                  </p>
                )}
              </div>

              {/* Verify Button - ENTERPRISE STANDARD */}
              <div className="text-center mb-8">
                <EnterpriseButton
                  variant="primary"
                  onClick={handleVerifyPAN}
                  disabled={!validatePANFormat(panNumber) || verificationStatus === 'verifying'}
                  className="w-full md:w-auto py-4 px-8 text-lg font-bold shadow-lg hover:shadow-xl"
                >
                  {verificationStatus === 'verifying' ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      <span>Verify PAN & Start</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </EnterpriseButton>
              </div>

              {/* OTP Verification - ENTERPRISE STANDARD */}
              {otpRequired && (
                <EnterpriseCard className="mb-8 p-6 bg-primary-50 border-primary-200">
                  <div className="text-center">
                    <Clock className="w-8 h-8 text-primary-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-primary-900 mb-2">OTP Verification Required</h3>
                    <p className="text-primary-700 mb-4">
                      An OTP has been sent to your registered mobile number. Please enter it below.
                    </p>
                    <div className="max-w-xs mx-auto">
                      <EnterpriseInput
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="text-center text-lg font-mono tracking-wider"
                      />
                    </div>
                    <EnterpriseButton
                      variant="primary"
                      onClick={handleOTPVerification}
                      disabled={otpCode.length !== 6 || verificationStatus === 'verifying'}
                      className="mt-4"
                    >
                      Verify OTP
                    </EnterpriseButton>
                  </div>
                </EnterpriseCard>
              )}

              {/* Name Conflict Resolution */}
              {conflictData && (
                <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-yellow-900 mb-2">Name Mismatch Detected</h3>
                      <p className="text-yellow-800 mb-4">
                        The name in ITD records doesn't match what you provided. Please verify:
                      </p>
                      <div className="bg-white p-4 rounded-lg mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium text-gray-600">ITD Record</div>
                            <div className="text-lg font-semibold text-gray-900">{conflictData.itdName}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-600">Your Record</div>
                            <div className="text-lg font-semibold text-gray-900">{conflictData.providedName}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => handleConflictResolution(true)}
                          className="flex-1 bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Accept ITD Name
                        </button>
                        <button
                          onClick={() => handleConflictResolution(false)}
                          className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Get CA Assistance
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Success State */}
              {verificationStatus === 'success' && (
                <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl">
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-green-900 mb-2">PAN Verified Successfully!</h3>
                    <p className="text-green-700 mb-4">
                      Your PAN has been verified via SurePass and pre-filled data has been fetched.
                    </p>

                    {/* Prefill Summary */}
                    {prefillData && (
                      <div className="bg-white p-4 rounded-lg mb-4 text-left">
                        <h4 className="font-semibold text-gray-900 mb-3">Pre-filled Data Available:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-green-600" />
                            <span>SurePass Verification</span>
                          </div>
                          {prefillData.name && (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                              <span>Name: {prefillData.name}</span>
                            </div>
                          )}
                          {prefillData.status && (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-purple-600" />
                              <span>Status: {prefillData.status}</span>
                            </div>
                          )}
                          {prefillData.category && (
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-4 h-4 text-orange-600" />
                              <span>Category: {prefillData.category}</span>
                            </div>
                          )}
                          {prefillData.aadhaarLinked && (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-indigo-600" />
                              <span>Aadhaar Linked</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={proceedToITRSelection}
                      className="bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl mx-auto"
                    >
                      <span>Continue to ITR Selection</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Error State */}
              {verificationStatus === 'error' && (
                <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl">
                  <div className="text-center">
                    <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Verification Failed</h3>
                    <p className="text-red-700 mb-4">
                      We couldn't verify your PAN. Please check the number and try again.
                    </p>
                    <button
                      onClick={() => setVerificationStatus('idle')}
                      className="bg-red-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="mt-8 p-4 bg-neutral-50 rounded-xl">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-neutral-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-neutral-900 mb-1">Secure & Compliant</h4>
                    <p className="text-sm text-neutral-600">
                      Your PAN verification is done through secure SurePass API integration.
                      All data is encrypted and handled according to government security standards.
                    </p>
                  </div>
                </div>
              </div>
            </EnterpriseCard>
          </div>
        </div>
      </div>
    </EnterpriseErrorBoundary>
  );
};

export default PANVerification;
