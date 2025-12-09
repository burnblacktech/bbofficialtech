// =====================================================
// FORGOT PASSWORD PAGE
// Request password reset via email or mobile OTP
// =====================================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services';
import { Mail, Phone, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [method, setMethod] = useState('email'); // 'email' or 'mobile'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (method === 'email') {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setError('Please enter a valid email address');
          setIsLoading(false);
          return;
        }

        const response = await authService.requestPasswordReset(email.toLowerCase());

        if (response.success) {
          setSuccess(true);
          toast.success('Password reset link sent to your email!');
        }
      } else {
        if (!phone || !/^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''))) {
          setError('Please enter a valid 10-digit mobile number');
          setIsLoading(false);
          return;
        }

        // TODO: Implement mobile OTP password reset
        // const response = await authService.requestPasswordResetMobile(phone);

        // Simulate API call for now
        await new Promise(resolve => setTimeout(resolve, 1000));

        setSuccess(true);
        toast.success('OTP sent to your mobile number!');
        navigate('/reset-password', { state: { phone: phone.replace(/\D/g, ''), method: 'mobile' } });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to send reset link. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (success && method === 'email') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success-100 mb-4">
              <CheckCircle className="h-8 w-8 text-success-600" />
            </div>
            <h2 className="text-heading-xl text-gray-900">
              Check Your Email
            </h2>
            <p className="mt-2 text-body-md text-gray-600">
              We've sent a password reset link to {email}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <p className="text-body-sm text-gray-600">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
              <p className="text-body-sm text-gray-600">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => {
                  setSuccess(false);
                  setError('');
                }}
                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
              >
                Try Again
              </button>
              <Link
                to="/login"
                className="block w-full py-2 px-4 text-center border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center text-body-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to login
          </button>
          <h2 className="text-center text-heading-xl text-gray-900">
            Forgot Password?
          </h2>
          <p className="mt-2 text-center text-body-md text-gray-600">
            No worries! Enter your email or mobile to reset your password
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="px-4 py-3 rounded-md bg-error-50 border border-error-200 text-error-600 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Method Selection */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => {
                setMethod('email');
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                method === 'email'
                  ? 'bg-gold-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('mobile');
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                method === 'mobile'
                  ? 'bg-gold-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Phone className="w-4 h-4 inline mr-2" />
              Mobile
            </button>
          </div>

          {/* Email Input */}
          {method === 'email' && (
            <div>
              <label htmlFor="email" className="block text-label-md text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Mobile Input */}
          {method === 'mobile' && (
            <div>
              <label htmlFor="phone" className="block text-label-md text-gray-700 mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-body-sm text-gray-600">
              Remember your password?{' '}
              <Link to="/login" className="font-medium text-gold-600 hover:text-gold-500">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

