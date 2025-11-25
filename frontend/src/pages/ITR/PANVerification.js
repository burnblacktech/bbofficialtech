// =====================================================
// PAN VERIFICATION SCREEN - ITR FILING JOURNEY
// Mobile-first PAN verification with SurePass integration
// =====================================================

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Shield,
  User,
  ArrowRight,
  Loader,
} from 'lucide-react';
import api from '../../services/api';

const PANVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [panNumber, setPanNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);

  const selectedMember = location.state?.selectedMember;

  // PAN verification mutation
  const verifyPANMutation = useMutation({
    mutationFn: async (panData) => {
      const response = await api.post('/itr/pan/verify', panData);
      return response.data;
    },
    onSuccess: (data) => {
      setVerificationResult(data.data);
      setIsVerifying(false);
    },
    onError: (error) => {
      setError(error.response?.data?.error || 'PAN verification failed');
      setIsVerifying(false);
    },
  });

  const handlePANChange = (e) => {
    const value = e.target.value.toUpperCase();
    // PAN format validation: 5 letters, 4 digits, 1 letter
    if (value.length <= 10 && /^[A-Z0-9]*$/.test(value)) {
      setPanNumber(value);
      setError(null);
    }
  };

  const handleVerifyPAN = async () => {
    if (!panNumber || panNumber.length !== 10) {
      setError('Please enter a valid 10-character PAN number');
      return;
    }

    setIsVerifying(true);
    setError(null);

    verifyPANMutation.mutate({
      pan: panNumber,
      memberId: selectedMember?.type === 'self' ? null : selectedMember?.id,
      memberType: selectedMember?.type || 'self',
    });
  };

  const handleRetry = () => {
    setVerificationResult(null);
    setError(null);
    setPanNumber('');
  };

  const handleProceedToITRSelection = () => {
    if (!verificationResult?.isValid) return;

    navigate('/itr-selection', {
      state: {
        selectedMember,
        verificationResult,
        step: 3,
      },
    });
  };

  const formatPAN = (pan) => {
    if (!pan) return '';
    return pan.substring(0, 5) + '*****';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/itr/start')}
                className="p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition-transform"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">PAN Verification</h1>
                <p className="text-xs text-gray-500">Step 2: Verify PAN details</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                <Shield className="h-3 w-3" />
                <span>Secure</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Step 2 of 4</span>
          <span>50% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: '50%' }}></div>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <span>Select Member</span>
          <span className="font-medium text-blue-600">Verify PAN</span>
          <span>Select ITR</span>
          <span>Start Filing</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Selected Member Info */}
        {selectedMember && (
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{selectedMember.name}</h3>
                <p className="text-sm text-gray-500">
                  {selectedMember.type === 'self' ? 'Self' : selectedMember.relationship}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PAN Verification Form */}
        {!verificationResult && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Enter PAN Number</h2>
              <p className="text-sm text-gray-600">
                We'll verify your PAN details with the Income Tax Department
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">PAN Number</label>
              <input
                type="text"
                value={panNumber}
                onChange={handlePANChange}
                placeholder="ABCDE1234F"
                maxLength={10}
                className="w-full p-3 border border-gray-300 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isVerifying}
              />
              <p className="text-xs text-gray-500 text-center">
                Enter your 10-character PAN number
              </p>
            </div>

            {error && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-900 mb-1">Verification Failed</h4>
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleVerifyPAN}
              disabled={!panNumber || panNumber.length !== 10 || isVerifying}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Verifying PAN...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Verify PAN</span>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <div className="space-y-4">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                verificationResult.isValid ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {verificationResult.isValid ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-red-600" />
                )}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {verificationResult.isValid ? 'PAN Verified Successfully' : 'PAN Verification Failed'}
              </h2>
            </div>

            {verificationResult.isValid && (
              <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">Verified Details</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">PAN Number</span>
                    <span className="text-sm font-mono font-semibold text-gray-900">
                      {formatPAN(panNumber)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Name</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {verificationResult.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Date of Birth</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {new Date(verificationResult.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                      verificationResult.status === 'Active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {verificationResult.status}
                    </span>
                  </div>
                </div>

                {/* Discrepancy Warning */}
                {verificationResult.discrepancies && verificationResult.discrepancies.length > 0 && (
                  <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-900 mb-1">Data Discrepancy</h4>
                        <p className="text-xs text-yellow-700">
                          Please verify the details match your records before proceeding
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Badge */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
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
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {verificationResult.isValid ? (
                <button
                  onClick={handleProceedToITRSelection}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 active:scale-95 transition-transform"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span>Proceed to ITR Selection</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>
              ) : (
                <button
                  onClick={handleRetry}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-xl hover:bg-gray-700 active:scale-95 transition-transform"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="h-4 w-4" />
                    <span>Try Again</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Microcopy */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Your PAN details are verified securely with the Income Tax Department
          </p>
        </div>
      </main>

      {/* Bottom padding for mobile */}
      <div className="h-6"></div>
    </div>
  );
};

export default PANVerification;
