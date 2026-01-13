// =====================================================
// MOBILE OTP SIGNUP PAGE
// Signup using mobile OTP verification
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services';
import { AlertCircle, CheckCircle, Phone, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const MobileOTPSignup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(1); // 1: Enter mobile, 2: Verify OTP, 3: Complete profile
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [formData, setFormData] = useState({
    phone: '',
    otp: '',
    fullName: '',
    email: '',
    pan: '',
    acceptTerms: false,
  });

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.phone || !/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement API call to send OTP
      // const response = await authService.sendMobileOTP(formData.phone);

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));

      setOtpSent(true);
      setStep(2);
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

    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement API call to verify OTP
      // const response = await authService.verifyMobileOTP(formData.phone, formData.otp);

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));

      setStep(3);
      toast.success('Mobile number verified');
    } catch (error) {
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
    try {
      // TODO: Implement API call to resend OTP
      await new Promise(resolve => setTimeout(resolve, 500));

      setCountdown(60);
      toast.success('OTP resent successfully');
    } catch (error) {
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Valid email is required');
      return;
    }
    if (!formData.pan.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.toUpperCase())) {
      setError('Valid PAN is required');
      return;
    }
    if (!formData.acceptTerms) {
      setError('Please accept the terms and conditions');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement API call to complete mobile OTP signup
      const response = await authService.register({
        fullName: formData.fullName,
        email: formData.email.toLowerCase(),
        phone: formData.phone.replace(/\D/g, ''),
        pan: formData.pan.toUpperCase(),
        authMethod: 'MOBILE_OTP',
      });

      if (response.success) {
        toast.success('Account created successfully!');
        navigate('/login', {
          state: { message: 'Account created. Please login to continue.' },
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Signup failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <button
            onClick={() => navigate('/signup')}
            className="flex items-center text-body-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to signup
          </button>
          <h2 className="text-center text-heading-xl text-slate-900">
            Sign up with Mobile
          </h2>
          <p className="mt-2 text-center text-body-md text-slate-600">
            We'll send you a verification code
          </p>
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={
            step === 1 ? handleSendOTP :
            step === 2 ? handleVerifyOTP :
            handleCompleteSignup
          }
        >
          {error && (
            <div className="px-4 py-3 rounded-xl bg-error-50 border border-error-200 text-error-600 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Error</p>
                <p className="text-body-regular mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Enter Mobile Number */}
          {step === 1 && (
            <div>
              <label htmlFor="phone" className="block text-label-md text-slate-700 mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-body-regular"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>
              <p className="mt-1 text-body-small text-slate-500">
                We'll send a 6-digit verification code to this number
              </p>
            </div>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-label-md text-slate-700 mb-1">
                  Enter Verification Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-xl placeholder-gray-400 text-slate-900 text-center text-heading-2 tracking-widest focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-body-regular"
                  placeholder="000000"
                  value={formData.otp}
                  onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <p className="mt-2 text-center text-body-sm text-slate-600">
                  Code sent to +91 {formData.phone}
                </p>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || isLoading}
                  className="text-body-sm text-gold-600 hover:text-gold-500 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Complete Profile */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-success-50 rounded-full p-3">
                  <CheckCircle className="w-8 h-8 text-success-600" />
                </div>
              </div>
              <p className="text-center text-body-md text-slate-700 mb-6">
                Mobile verified! Please complete your profile
              </p>

              <div>
                <label htmlFor="fullName" className="block text-label-md text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-xl placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-body-regular"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-label-md text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-xl placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-body-regular"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="pan" className="block text-label-md text-slate-700 mb-1">
                  PAN Number
                </label>
                <input
                  id="pan"
                  name="pan"
                  type="text"
                  required
                  maxLength={10}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-xl placeholder-gray-400 text-slate-900 uppercase focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-body-regular"
                  placeholder="ABCDE1234F"
                  value={formData.pan}
                  onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                />
              </div>

              <div className="flex items-start">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-gold-500 focus:ring-gold-500 border-slate-300 rounded mt-1"
                  checked={formData.acceptTerms}
                  onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                />
                <label htmlFor="acceptTerms" className="ml-2 block text-body-sm text-slate-700">
                  I accept the{' '}
                  <Link to="/terms" className="text-gold-600 hover:text-gold-500">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-gold-600 hover:text-gold-500">
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            {step > 1 && step < 3 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 py-2 px-4 border border-slate-300 rounded-xl shadow-elevation-1 text-body-regular font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 border border-transparent rounded-xl shadow-elevation-1 text-body-regular font-medium text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
            >
              {isLoading
                ? 'Processing...'
                : step === 1
                ? 'Send OTP'
                : step === 2
                ? 'Verify OTP'
                : 'Create Account'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-body-sm text-slate-600">
              Already have an account?{' '}
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

export default MobileOTPSignup;

