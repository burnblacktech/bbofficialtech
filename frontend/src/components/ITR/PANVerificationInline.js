// =====================================================
// PAN VERIFICATION INLINE COMPONENT
// Reusable inline PAN verification component
// =====================================================

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle, AlertCircle, Shield, Loader, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import fieldLockService, { VERIFICATION_STATUS } from '../../services/FieldLockService';

const PANVerificationInline = ({
  panNumber: initialPAN = '',
  onVerified,
  onCancel,
  memberType = 'self', // 'self' | 'family'
  memberId = null,
  compact = false,
  onVerificationStart, // Callback when verification starts
}) => {
  const [panNumber, setPanNumber] = useState(initialPAN);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);
  const [isServiceUnavailable, setIsServiceUnavailable] = useState(false);

  const verifyPANMutation = useMutation({
    mutationFn: async (panData) => {
      const response = await api.post('/itr/pan/verify', panData);
      return response.data;
    },
    onSuccess: (data) => {
      setVerificationResult(data.data);
      setIsVerifying(false);
      toast.success('PAN verified successfully!');
      // Set field verification status to lock the PAN field
      fieldLockService.setFieldVerificationStatus('personalInfo', 'pan', VERIFICATION_STATUS.VERIFIED, 'pan_verification');
      // Also lock name and DOB if they were verified
      if (data.data?.name) {
        fieldLockService.setFieldVerificationStatus('personalInfo', 'name', VERIFICATION_STATUS.VERIFIED, 'pan_verification');
      }
      if (data.data?.dateOfBirth || data.data?.dob) {
        fieldLockService.setFieldVerificationStatus('personalInfo', 'dob', VERIFICATION_STATUS.VERIFIED, 'pan_verification');
      }

      if (onVerified) {
        // Include the PAN number in the verification result
        onVerified({
          ...data.data,
          pan: panNumber, // Include the PAN that was verified
        });
      }
    },
    onError: (error) => {
      const errorData = error.response?.data;
      const errorCode = errorData?.code;
      const isUnavailable = errorCode === 'SERVICE_UNAVAILABLE' || error.response?.status === 503;

      setIsServiceUnavailable(isUnavailable);
      setError(errorData?.error || errorData?.message || 'PAN verification failed');
      setIsVerifying(false);

      if (isUnavailable) {
        toast.error('Verification service unavailable. You can verify manually and continue.');
      } else {
        toast.error(errorData?.error || errorData?.message || 'PAN verification failed');
      }
    },
  });

  const handlePANChange = (e) => {
    const value = e.target.value.toUpperCase();
    // PAN format validation: 5 letters, 4 digits, 1 letter
    if (value.length <= 10 && /^[A-Z0-9]*$/.test(value)) {
      setPanNumber(value);
      setError(null);
      setVerificationResult(null);
    }
  };

  const handleVerifyPAN = async () => {
    if (!panNumber || panNumber.length !== 10) {
      setError('Please enter a valid 10-character PAN number');
      toast.error('Please enter a valid 10-character PAN number');
      return;
    }

    setIsVerifying(true);
    setError(null);

    // Notify parent component that verification has started
    if (onVerificationStart) {
      onVerificationStart();
    }

    verifyPANMutation.mutate({
      pan: panNumber,
      memberId: memberType === 'family' ? memberId : null,
      memberType,
    });
  };

  const handleReset = () => {
    setPanNumber(initialPAN);
    setVerificationResult(null);
    setError(null);
  };

  const formatPAN = (pan) => {
    if (!pan) return '';
    return pan.substring(0, 5) + '*****';
  };

  if (compact) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        {!verificationResult ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PAN Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={panNumber}
                  onChange={handlePANChange}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-center text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  disabled={isVerifying}
                />
                <button
                  onClick={handleVerifyPAN}
                  disabled={!panNumber || panNumber.length !== 10 || isVerifying}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isVerifying ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    'Verify'
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className={`flex flex-col space-y-2 text-sm ${isServiceUnavailable ? 'text-gold-600' : 'text-red-600'}`}>
                <div className="flex items-start space-x-2">
                  <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isServiceUnavailable ? 'text-gold-600' : 'text-red-600'}`} />
                  <span>{error}</span>
                </div>
                {isServiceUnavailable && (
                  <button
                    onClick={() => {
                      const manualResult = {
                        pan: panNumber,
                        isValid: true,
                        name: null,
                        status: 'Manual Verification',
                        source: 'MANUAL',
                        verifiedAt: new Date().toISOString(),
                        isManual: true,
                      };
                      setVerificationResult(manualResult);
                      setError(null);
                      setIsServiceUnavailable(false);
                      if (onVerified) {
                        onVerified(manualResult);
                      }
                      toast.success('Proceeding with manual verification');
                    }}
                    className="text-xs font-medium text-gold-700 hover:text-gold-900 underline text-left"
                  >
                    Verify Manually & Continue
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">
                  PAN Verified: {formatPAN(panNumber)}
                </p>
                <p className="text-gray-600">{verificationResult.name}</p>
              </div>
            </div>
            {onCancel && (
              <button
                onClick={handleReset}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">PAN Verification</h3>
            <p className="text-sm text-gray-600">Verify your PAN with Income Tax Department</p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {!verificationResult ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="panInput" className="block text-sm font-medium text-gray-700 mb-2">
              PAN Number
            </label>
            <input
              id="panInput"
              type="text"
              value={panNumber}
              onChange={handlePANChange}
              placeholder="ABCDE1234F"
              maxLength={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              disabled={isVerifying}
            />
            <p className="text-xs text-gray-500 text-center mt-2">
              Enter your 10-character PAN number
            </p>
          </div>

          {error && (
            <div className={`rounded-lg p-4 border ${isServiceUnavailable ? 'bg-gold-50 border-gold-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start space-x-3">
                <AlertCircle className={`h-5 w-5 ${isServiceUnavailable ? 'text-gold-600' : 'text-red-600'} mt-0.5 flex-shrink-0`} />
                <div className="flex-1">
                  <h4 className={`text-sm font-semibold mb-1 ${isServiceUnavailable ? 'text-gold-900' : 'text-red-900'}`}>
                    {isServiceUnavailable ? 'Service Unavailable' : 'Verification Failed'}
                  </h4>
                  <p className={`text-xs ${isServiceUnavailable ? 'text-gold-700' : 'text-red-700'} mb-3`}>
                    {error}
                  </p>
                  {isServiceUnavailable && (
                    <button
                      onClick={() => {
                        // Allow manual verification - mark as verified with user-entered PAN
                        const manualResult = {
                          pan: panNumber,
                          isValid: true,
                          name: null, // User will verify manually
                          status: 'Manual Verification',
                          source: 'MANUAL',
                          verifiedAt: new Date().toISOString(),
                          isManual: true,
                        };
                        setVerificationResult(manualResult);
                        setError(null);
                        setIsServiceUnavailable(false);
                        if (onVerified) {
                          onVerified(manualResult);
                        }
                        toast.success('You can proceed with manual verification');
                      }}
                      className="text-sm font-medium text-gold-700 hover:text-gold-900 underline"
                    >
                      Verify Manually & Continue
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleVerifyPAN}
            disabled={!panNumber || panNumber.length !== 10 || isVerifying}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isVerifying ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Verifying PAN...</span>
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                <span>Verify PAN</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">PAN Verified Successfully</h3>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">PAN Number</span>
              <span className="text-sm font-mono font-semibold text-gray-900">
                {formatPAN(panNumber)}
              </span>
            </div>
            {verificationResult.name && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Name</span>
                <span className="text-sm font-semibold text-gray-900">
                  {verificationResult.name}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                verificationResult.source === 'MANUAL'
                  ? 'bg-gold-100 text-gold-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {verificationResult.status || 'Active'}
              </span>
            </div>
          </div>

          {verificationResult.source === 'MANUAL' ? (
            <div className="bg-gold-50 rounded-lg p-4 border border-gold-200">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-gold-600" />
                <div>
                  <h4 className="text-sm font-semibold text-gold-900 mb-1">Manual Verification</h4>
                  <p className="text-xs text-gold-700">
                    Please verify your PAN details manually before proceeding with ITR filing
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">Data Verified</h4>
                  <p className="text-xs text-blue-700">
                    Information verified directly with Income Tax Department
                  </p>
                </div>
              </div>
            </div>
          )}

          {onCancel && (
            <button
              onClick={handleReset}
              className="w-full text-sm text-gray-600 hover:text-gray-900 py-2"
            >
              Verify Another PAN
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PANVerificationInline;

