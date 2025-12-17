// =====================================================
// AADHAAR LINKING COMPONENT
// Link/unlink Aadhaar to user profile using SurePass verification
// =====================================================

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, Loader, AlertCircle, Link2, Unlink, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/core/APIClient';
import { enterpriseLogger } from '../../utils/logger';

const AadhaarLinking = ({ userId, onLinked, onUnlinked }) => {
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [aadhaarStatus, setAadhaarStatus] = useState(null);
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAadhaarStatus();
  }, [userId]);

  const loadAadhaarStatus = async () => {
    try {
      const response = await apiClient.get('/users/aadhaar/status');
      if (response.data.success) {
        setAadhaarStatus(response.data.data);
      }
    } catch (error) {
      enterpriseLogger.error('Failed to load Aadhaar status', { error });
    }
  };

  const validateAadhaar = (aadhaar) => {
    // Remove spaces and validate 12 digits
    const cleanAadhaar = aadhaar.replace(/\s/g, '');
    const aadhaarRegex = /^\d{12}$/;
    return aadhaarRegex.test(cleanAadhaar);
  };

  const formatAadhaar = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Format as XXXX XXXX XXXX
    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
  };

  const handleAadhaarChange = (e) => {
    const formatted = formatAadhaar(e.target.value);
    setAadhaarNumber(formatted);
    setError('');
    setVerificationResult(null);
  };

  const handleVerify = async () => {
    if (!aadhaarNumber) {
      setError('Please enter Aadhaar number');
      return;
    }

    if (!validateAadhaar(aadhaarNumber)) {
      setError('Invalid Aadhaar format. Please enter 12 digits');
      return;
    }

    setIsVerifying(true);
    setError('');
    setVerificationResult(null);

    try {
      const cleanAadhaar = aadhaarNumber.replace(/\s/g, '');
      const response = await apiClient.post('/users/aadhaar/verify', {
        aadhaarNumber: cleanAadhaar,
      });

      if (response.data.success) {
        setVerificationResult(response.data.data);
        toast.success('Aadhaar verified successfully');
      } else {
        throw new Error(response.data.error || 'Aadhaar verification failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Aadhaar verification failed';
      setError(errorMessage);
      toast.error(errorMessage);
      enterpriseLogger.error('Aadhaar verification error', { error: errorMessage });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLink = async () => {
    if (!verificationResult || !verificationResult.verified) {
      setError('Please verify Aadhaar first');
      return;
    }

    setIsLinking(true);
    setError('');

    try {
      const cleanAadhaar = aadhaarNumber.replace(/\s/g, '');
      const response = await apiClient.post('/users/aadhaar/link', {
        aadhaarNumber: cleanAadhaar,
        verificationData: verificationResult,
      });

      if (response.data.success) {
        toast.success('Aadhaar linked successfully');
        setAadhaarStatus({
          aadhaarLinked: true,
          aadhaarNumber: response.data.data.aadhaarNumber,
          verifiedAt: response.data.data.verifiedAt,
        });
        setAadhaarNumber('');
        setVerificationResult(null);
        if (onLinked) onLinked();
        loadAadhaarStatus();
      } else {
        throw new Error(response.data.error || 'Aadhaar linking failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Aadhaar linking failed';
      setError(errorMessage);
      toast.error(errorMessage);
      enterpriseLogger.error('Aadhaar linking error', { error: errorMessage });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to unlink your Aadhaar? This action cannot be undone.')) {
      return;
    }

    setIsUnlinking(true);
    setError('');

    try {
      const response = await apiClient.delete('/users/aadhaar/unlink');

      if (response.data.success) {
        toast.success('Aadhaar unlinked successfully');
        setAadhaarStatus({
          aadhaarLinked: false,
          aadhaarNumber: null,
          verifiedAt: null,
        });
        if (onUnlinked) onUnlinked();
        loadAadhaarStatus();
      } else {
        throw new Error(response.data.error || 'Aadhaar unlinking failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Aadhaar unlinking failed';
      setError(errorMessage);
      toast.error(errorMessage);
      enterpriseLogger.error('Aadhaar unlinking error', { error: errorMessage });
    } finally {
      setIsUnlinking(false);
    }
  };

  const maskAadhaar = (aadhaar) => {
    if (!aadhaar) return '';
    return `${aadhaar.substring(0, 4)}****${aadhaar.substring(8)}`;
  };

  return (
    <div className="space-y-4">
      {/* Current Status */}
      {aadhaarStatus?.aadhaarLinked && (
        <div className="bg-success-50 border border-success-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-success-600 mt-0.5" />
              <div>
                <h3 className="text-heading-sm font-medium text-success-900">Aadhaar Linked</h3>
                <p className="text-body-sm text-success-700 mt-1">
                  Your Aadhaar is linked to your account
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-body-sm text-success-600 font-mono">
                    {showAadhaar ? aadhaarStatus.aadhaarNumber : maskAadhaar(aadhaarStatus.aadhaarNumber)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAadhaar(!showAadhaar)}
                    className="text-success-600 hover:text-success-700"
                  >
                    {showAadhaar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {aadhaarStatus.verifiedAt && (
                  <p className="text-body-xs text-success-600 mt-1">
                    Verified on {new Date(aadhaarStatus.verifiedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleUnlink}
              disabled={isUnlinking}
              className="flex items-center space-x-2 px-3 py-2 text-body-regular font-medium text-error-600 hover:text-error-700 hover:bg-error-50 rounded-xl transition-colors disabled:opacity-50"
            >
              {isUnlinking ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Unlink className="w-4 h-4" />
              )}
              <span>{isUnlinking ? 'Unlinking...' : 'Unlink'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Link New Aadhaar */}
      {!aadhaarStatus?.aadhaarLinked && (
        <div className="space-y-4">
          <div>
            <label className="block text-body-sm font-medium text-slate-700 mb-2">
              Aadhaar Number
            </label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={aadhaarNumber}
                  onChange={handleAadhaarChange}
                  placeholder="XXXX XXXX XXXX"
                  maxLength={14} // 12 digits + 2 spaces
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                />
              </div>
              <button
                type="button"
                onClick={handleVerify}
                disabled={isVerifying || !aadhaarNumber}
                className="px-4 py-2 bg-gold-600 text-white rounded-xl hover:bg-gold-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isVerifying ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify</span>
                )}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-body-sm text-error-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </p>
            )}
            <p className="mt-2 text-body-xs text-slate-500">
              Enter your 12-digit Aadhaar number. We'll verify it using SurePass API.
            </p>
          </div>

          {/* Verification Result */}
          {verificationResult && verificationResult.verified && (
            <div className="bg-info-50 border border-info-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-info-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-heading-sm font-medium text-info-900">Verification Successful</h3>
                  {verificationResult.name && (
                    <p className="text-body-sm text-info-700 mt-1">
                      Name: {verificationResult.name}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleLink}
                    disabled={isLinking}
                    className="mt-3 flex items-center space-x-2 px-4 py-2 bg-info-600 text-white rounded-xl hover:bg-info-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLinking ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Linking...</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        <span>Link Aadhaar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Message */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <div className="text-body-xs text-slate-600">
            <p className="font-medium mb-1">Why link Aadhaar?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Faster ITR filing with pre-filled data</li>
              <li>Easier e-verification of ITR</li>
              <li>Enhanced security and account verification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AadhaarLinking;

