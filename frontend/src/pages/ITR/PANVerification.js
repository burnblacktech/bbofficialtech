// =====================================================
// PAN VERIFICATION SCREEN - ITR FILING JOURNEY
// Mobile-first PAN verification with SurePass integration
// =====================================================

import { useState, useEffect } from 'react';
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
import apiClient from '../../services/core/APIClient';

const PANVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [panNumber, setPanNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  const selectedPerson = location.state?.selectedPerson;
  const selectedMember = selectedPerson || location.state?.selectedMember;

  // Check PAN verification status on mount
  useEffect(() => {
    const checkPANStatus = async () => {
      if (!selectedPerson?.panNumber) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        setIsCheckingStatus(true);
        const response = await apiClient.get(`/itr/pan/status/${selectedPerson.panNumber}`);

        if (response.data.success && response.data.data.verified) {
          // PAN already verified, skip verification
          setAlreadyVerified(true);
          setPanNumber(selectedPerson.panNumber);
          setVerificationResult({
            isValid: true,
            pan: selectedPerson.panNumber,
            name: selectedPerson.name,
            status: 'Active',
            verifiedAt: response.data.data.verifiedAt,
          });

          // Auto-proceed after a short delay
          setTimeout(() => {
            navigate('/itr/recommend-form', {
              state: {
                selectedPerson,
                verificationResult: {
                  isValid: true,
                  pan: selectedPerson.panNumber,
                  name: selectedPerson.name,
                  status: 'Active',
                },
                skipPANVerification: true,
              },
            });
          }, 2000);
        } else {
          // PAN not verified, show verification form
          setPanNumber(selectedPerson.panNumber || '');
        }
      } catch (error) {
        // If status check fails, proceed with verification form
        if (selectedPerson?.panNumber) {
          setPanNumber(selectedPerson.panNumber);
        }
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkPANStatus();
  }, [selectedPerson, navigate]);

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
      memberId: selectedPerson?.type === 'family' ? selectedPerson.id : (selectedMember?.type === 'family' ? selectedMember.id : null),
      memberType: selectedPerson?.type || selectedMember?.type || 'self',
    });
  };

  const handleRetry = () => {
    setVerificationResult(null);
    setError(null);
    setPanNumber('');
  };

  const handleProceedToITRSelection = () => {
    if (!verificationResult?.isValid) return;

    navigate('/itr/recommend-form', {
      state: {
        selectedPerson: selectedPerson || selectedMember,
        verificationResult,
      },
    });
  };

  const formatPAN = (pan) => {
    if (!pan) return '';
    return pan.substring(0, 5) + '*****';
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/itr/start')}
                className="p-2 rounded-lg hover:bg-neutral-100 active:scale-95 transition-transform"
              >
                <ArrowLeft className="h-5 w-5 text-neutral-700" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-neutral-900">PAN Verification</h1>
                <p className="text-xs text-neutral-500">Step 2: Verify PAN details</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success-50 text-success-600 text-xs">
                <Shield className="h-3 w-3" />
                <span>Secure</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
            <span>Step 2 of 4</span>
            <span>50% Complete</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div className="bg-gold-500 h-2 rounded-full transition-all duration-300" style={{ width: '50%' }}></div>
          </div>
          <div className="flex justify-between text-xs text-neutral-600 mt-2">
            <span>Select Member</span>
            <span className="font-medium text-gold-600">Verify PAN</span>
            <span>Select ITR</span>
            <span>Start Filing</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10 space-y-6">
        {/* Loading State */}
        {isCheckingStatus && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-gold-500 mb-4" />
            <p className="text-sm text-neutral-600">Checking PAN verification status...</p>
          </div>
        )}

        {/* Already Verified State */}
        {!isCheckingStatus && alreadyVerified && verificationResult && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-success-50">
                <CheckCircle className="h-8 w-8 text-success-500" />
              </div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                PAN Already Verified
              </h2>
              <p className="text-sm text-neutral-600">
                Your PAN was verified previously. Proceeding to ITR form selection...
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-600">PAN Number</span>
                <span className="text-sm font-mono font-semibold text-neutral-900">
                  {formatPAN(panNumber)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-600">Name</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {verificationResult.name}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Selected Person Info */}
        {!isCheckingStatus && !alreadyVerified && (selectedPerson || selectedMember) && (
          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gold-50">
                <User className="h-5 w-5 text-gold-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-900">
                  {selectedPerson?.name || selectedMember?.name}
                </h3>
                <p className="text-sm text-neutral-500">
                  {(selectedPerson?.type || selectedMember?.type) === 'self' ? 'Self' : selectedPerson?.member?.relationship || selectedMember?.relationship}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PAN Verification Form */}
        {!verificationResult && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Enter PAN Number</h2>
              <p className="text-sm text-neutral-600">
                We'll verify your PAN details with the Income Tax Department
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm space-y-4">
              <label className="text-xs font-medium text-neutral-700 uppercase tracking-wide">PAN Number</label>
              <input
                type="text"
                value={panNumber}
                onChange={handlePANChange}
                placeholder="ABCDE1234F"
                maxLength={10}
                className="w-full p-4 border border-neutral-300 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
                disabled={isVerifying}
              />
              <p className="text-xs text-neutral-500 text-center">
                Enter your 10-character PAN number
              </p>
            </div>

            {error && (
              <div className="bg-error-50 rounded-xl p-4 border border-error-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-error-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-error-900 mb-1">Verification Failed</h4>
                    <p className="text-xs text-error-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleVerifyPAN}
              disabled={!panNumber || panNumber.length !== 10 || isVerifying}
              className="w-full bg-gold-500 text-white py-3 px-4 rounded-xl hover:bg-gold-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gold-500/20 font-semibold"
            >
              {isVerifying ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Verifying PAN...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Verify PAN</span>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <div className="space-y-6">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                verificationResult.isValid ? 'bg-success-50' : 'bg-error-50'
              }`}>
                {verificationResult.isValid ? (
                  <CheckCircle className="h-8 w-8 text-success-500" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-error-500" />
                )}
              </div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                {verificationResult.isValid ? 'PAN Verified Successfully' : 'PAN Verification Failed'}
              </h2>
            </div>

            {verificationResult.isValid && (
              <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Verified Details</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <span className="text-sm text-neutral-600">PAN Number</span>
                    <span className="text-sm font-mono font-semibold text-neutral-900">
                      {formatPAN(panNumber)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <span className="text-sm text-neutral-600">Name</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {verificationResult.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <span className="text-sm text-neutral-600">Date of Birth</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {new Date(verificationResult.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <span className="text-sm text-neutral-600">Status</span>
                    <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                      verificationResult.status === 'Active'
                        ? 'bg-success-100 text-success-700'
                        : 'bg-error-100 text-error-700'
                    }`}>
                      {verificationResult.status}
                    </span>
                  </div>
                </div>

                {/* Discrepancy Warning */}
                {verificationResult.discrepancies && verificationResult.discrepancies.length > 0 && (
                  <div className="bg-warning-50 rounded-xl p-4 border border-warning-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-warning-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-warning-900 mb-1">Data Discrepancy</h4>
                        <p className="text-xs text-warning-700">
                          Please verify the details match your records before proceeding
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Badge */}
                <div className="bg-success-50 rounded-xl p-4 border border-success-200">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-success-600 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-900 mb-1">Data Verified</h4>
                      <p className="text-xs text-neutral-700">
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
                  className="w-full bg-gold-500 text-white py-3 px-4 rounded-xl hover:bg-gold-600 active:scale-95 transition-transform shadow-lg shadow-gold-500/20 font-semibold"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>Proceed to ITR Selection</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>
              ) : (
                <button
                  onClick={handleRetry}
                  className="w-full bg-neutral-600 text-white py-3 px-4 rounded-xl hover:bg-neutral-700 active:scale-95 transition-transform font-semibold"
                >
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    <span>Try Again</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Microcopy */}
        <div className="text-center pt-4">
          <p className="text-xs text-neutral-500">
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
