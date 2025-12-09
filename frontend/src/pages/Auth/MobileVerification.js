// =====================================================
// MOBILE VERIFICATION PAGE
// Verify mobile number with OTP
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../services';
import { Phone, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const MobileVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const phone = searchParams.get('phone');

  const [status, setStatus] = useState('pending'); // pending, verifying, success, error
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    // Auto-send OTP when component mounts
    if (phone) {
      handleSendOTP();
    }
  }, [phone]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async () => {
    setIsLoading(true);
    setError('');

    try {
      // TODO: Implement API call to send OTP
      // const response = await authService.sendMobileOTP(phone);

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCountdown(60);
      toast.success('OTP sent to your mobile number');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to send OTP. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setStatus('verifying');

    try {
      // TODO: Implement API call to verify OTP
      // const response = await authService.verifyMobileOTP(phone, otp);

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1500));

      setStatus('success');
      toast.success('Mobile number verified successfully!');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setStatus('error');
      const errorMessage = error.response?.data?.error || 'Invalid OTP. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    setError('');

    try {
      await handleSendOTP();
    } catch (error) {
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (phoneNumber) => {
    if (!phoneNumber) return '';
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phoneNumber;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gold-100 mb-4">
            <Phone className="h-8 w-8 text-gold-600" />
          </div>
          <h2 className="text-heading-xl text-gray-900">
            Verify Your Mobile
          </h2>
          <p className="mt-2 text-body-md text-gray-600">
            {phone ? `We've sent a verification code to ${formatPhone(phone)}` : 'Please verify your mobile number'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Pending/Verifying State */}
          {(status === 'pending' || status === 'verifying') && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-md bg-error-50 border border-error-200 text-error-600 flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Error</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="otp" className="block text-label-md text-gray-700 mb-1">
                  Enter Verification Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 text-center text-2xl tracking-widest focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={isLoading || status === 'verifying'}
                />
                {phone && (
                  <p className="mt-2 text-center text-body-sm text-gray-600">
                    Code sent to {formatPhone(phone)}
                  </p>
                )}
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || isLoading || status === 'verifying'}
                  className="text-body-sm text-gold-600 hover:text-gold-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6 || status === 'verifying'}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
              >
                {status === 'verifying' ? (
                  <span className="flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  'Verify OTP'
                )}
              </button>
            </form>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100">
                <CheckCircle className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <h3 className="text-heading-md text-gray-900 mb-2">
                  Mobile Verified!
                </h3>
                <p className="text-body-sm text-gray-600 mb-4">
                  Your mobile number has been successfully verified. Redirecting to dashboard...
                </p>
              </div>
              <Link
                to="/dashboard"
                className="block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
              >
                Go to Dashboard
              </Link>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error-100">
                <AlertCircle className="h-6 w-6 text-error-600" />
              </div>
              <div>
                <h3 className="text-heading-md text-gray-900 mb-2">
                  Verification Failed
                </h3>
                <p className="text-body-sm text-gray-600 mb-4">
                  {error || 'Invalid OTP. Please try again.'}
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setStatus('pending');
                    setOtp('');
                    setError('');
                    handleSendOTP();
                  }}
                  disabled={isLoading}
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
                >
                  Try Again
                </button>
                <Link
                  to="/login"
                  className="block w-full py-2 px-4 text-center text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-body-sm text-gray-600">
            Need help?{' '}
            <Link to="/help/contact" className="font-medium text-gold-600 hover:text-gold-500">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileVerification;

