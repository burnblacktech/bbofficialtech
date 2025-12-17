// =====================================================
// EMAIL VERIFICATION PAGE
// Verify email address after signup
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../services';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const EmailVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('pending'); // pending, verifying, success, error, expired
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Get email from user context or localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setEmail(user.email || '');
      }
    } catch (error) {
      console.error('Error reading user data:', error);
    }

    // If token is present in URL, verify automatically
    if (token) {
      handleVerifyEmail(token);
    }
  }, [token]);

  const handleVerifyEmail = async (verificationToken) => {
    setIsLoading(true);
    setStatus('verifying');

    try {
      const response = await authService.verifyEmail(verificationToken || token);

      if (response.success) {
        setStatus('success');
        toast.success('Email verified successfully!');

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setStatus('error');
        toast.error(response.message || 'Email verification failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Email verification failed';

      if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
        setStatus('expired');
      } else {
        setStatus('error');
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to resend verification email
      // const response = await authService.resendVerificationEmail();

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      toast.error('Failed to resend verification email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gold-100 mb-4">
            <Mail className="h-8 w-8 text-gold-600" />
          </div>
          <h2 className="text-heading-xl text-slate-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-body-md text-slate-600">
            {email ? `We've sent a verification link to ${email}` : 'Please verify your email address to continue'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6">
          {/* Pending State */}
          {status === 'pending' && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-info-100">
                <Mail className="h-6 w-6 text-info-600" />
              </div>
              <div>
                <h3 className="text-heading-md text-slate-900 mb-2">
                  Check Your Email
                </h3>
                <p className="text-body-sm text-slate-600 mb-4">
                  We've sent a verification link to your email address. Click the link in the email to verify your account.
                </p>
                <p className="text-body-sm text-slate-600 mb-6">
                  Didn't receive the email? Check your spam folder or click below to resend.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="w-full py-2 px-4 border border-slate-300 rounded-xl shadow-elevation-1 text-body-regular font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    'Resend Verification Email'
                  )}
                </button>
                <Link
                  to="/login"
                  className="block w-full py-2 px-4 text-center text-body-regular font-medium text-gold-600 hover:text-gold-500"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}

          {/* Verifying State */}
          {status === 'verifying' && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-info-100">
                <RefreshCw className="h-6 w-6 text-info-600 animate-spin" />
              </div>
              <div>
                <h3 className="text-heading-md text-slate-900 mb-2">
                  Verifying Email...
                </h3>
                <p className="text-body-sm text-slate-600">
                  Please wait while we verify your email address.
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100">
                <CheckCircle className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <h3 className="text-heading-md text-slate-900 mb-2">
                  Email Verified!
                </h3>
                <p className="text-body-sm text-slate-600 mb-4">
                  Your email has been successfully verified. Redirecting to dashboard...
                </p>
              </div>
              <Link
                to="/dashboard"
                className="block w-full py-2 px-4 border border-transparent rounded-xl shadow-elevation-1 text-body-regular font-medium text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
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
                <h3 className="text-heading-md text-slate-900 mb-2">
                  Verification Failed
                </h3>
                <p className="text-body-sm text-slate-600 mb-4">
                  We couldn't verify your email. The link may be invalid or expired.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="w-full py-2 px-4 border border-slate-300 rounded-xl shadow-elevation-1 text-body-regular font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    'Resend Verification Email'
                  )}
                </button>
                <Link
                  to="/login"
                  className="block w-full py-2 px-4 text-center text-body-regular font-medium text-gold-600 hover:text-gold-500"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}

          {/* Expired State */}
          {status === 'expired' && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-warning-100">
                <AlertCircle className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <h3 className="text-heading-md text-slate-900 mb-2">
                  Link Expired
                </h3>
                <p className="text-body-sm text-slate-600 mb-4">
                  This verification link has expired. Please request a new one.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="w-full py-2 px-4 border border-transparent rounded-xl shadow-elevation-1 text-body-regular font-medium text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    'Resend Verification Email'
                  )}
                </button>
                <Link
                  to="/login"
                  className="block w-full py-2 px-4 text-center text-body-regular font-medium text-slate-600 hover:text-slate-900"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-body-sm text-slate-600">
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

export default EmailVerification;

