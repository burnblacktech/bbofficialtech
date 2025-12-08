// =====================================================
// SIGNUP PAGE - Email/Password Registration
// Multi-step signup with PAN verification
// =====================================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services';
import { AlertCircle, CheckCircle, Mail, Lock, User, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import PANVerificationInline from '../../components/ITR/PANVerificationInline';

const SignupPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(1); // 1: Basic info, 2: PAN verification, 3: Terms
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    pan: '',
    acceptTerms: false,
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
  });

  // PAN verification state
  const [panVerified, setPanVerified] = useState(false);
  const [panVerificationResult, setPanVerificationResult] = useState(null);

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let score = 0;
    const feedback = [];

    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    else feedback.push('Mix of uppercase and lowercase');

    if (/\d/.test(password)) score += 1;
    else feedback.push('At least one number');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('At least one special character');

    return { score, feedback };
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');

    if (field === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    // Reset PAN verification if PAN is changed
    if (field === 'pan') {
      setPanVerified(false);
      setPanVerificationResult(null);
    }
  };

  const handlePANVerified = (result) => {
    setPanVerified(true);
    setPanVerificationResult(result);
    // Auto-populate DOB if available and empty
    if (result.dateOfBirth && !formData.dateOfBirth) {
      setFormData(prev => ({ ...prev, dateOfBirth: result.dateOfBirth }));
    }
    toast.success('PAN verified successfully!');
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email format');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))) {
      setError('Invalid phone number (10 digits, starting with 6-9)');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (passwordStrength.score < 2) {
      setError('Password is too weak. Please use a stronger password.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.pan.trim()) {
      setError('PAN is required');
      return false;
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.toUpperCase())) {
      setError('Invalid PAN format (e.g., ABCDE1234F)');
      return false;
    }
    if (!panVerified) {
      setError('Please verify your PAN before continuing');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
      // Reset PAN verification when going back from step 2
      if (step === 2) {
        setPanVerified(false);
        setPanVerificationResult(null);
      }
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.acceptTerms) {
      setError('Please accept the terms and conditions');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.register({
        fullName: formData.fullName,
        email: formData.email.toLowerCase(),
        phone: formData.phone.replace(/\D/g, ''),
        password: formData.password,
        pan: formData.pan.toUpperCase(),
      });

      if (response.success) {
        toast.success('Account created successfully! Please verify your email.');

        // Auto-login after successful signup
        try {
          const loginResponse = await authService.login({
            email: formData.email.toLowerCase(),
            password: formData.password,
          });

          if (loginResponse.success) {
            login(loginResponse.user, loginResponse.accessToken, loginResponse.refreshToken);
            navigate('/email-verification');
          }
        } catch (loginError) {
          // If auto-login fails, redirect to login
          navigate('/login', {
            state: { message: 'Account created. Please login to continue.' },
          });
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Signup failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    authService.googleLoginRedirect();
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score === 0) return 'bg-gray-200';
    if (passwordStrength.score === 1) return 'bg-error-500';
    if (passwordStrength.score === 2) return 'bg-warning-500';
    if (passwordStrength.score === 3) return 'bg-info-500';
    return 'bg-success-500';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-heading-xl text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-body-md text-gray-600">
            Start filing your ITR in minutes
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    step > s ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <form className="mt-8 space-y-6" onSubmit={step === 3 ? handleSignup : (e) => { e.preventDefault(); handleNext(); }}>
          {error && (
            <div className="px-4 py-3 rounded-md bg-error-50 border border-error-200 text-error-600 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-label-md text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                  />
                </div>
              </div>

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
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-label-md text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-label-md text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                </div>
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex space-x-1 mb-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded ${
                            i < passwordStrength.score
                              ? getPasswordStrengthColor()
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <p className="text-xs text-gray-600">
                        {passwordStrength.feedback.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-label-md text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  />
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-xs text-error-600">Passwords do not match</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: PAN Verification */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="pan" className="block text-label-md text-gray-700 mb-1">
                  PAN Number
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                  <input
                    id="pan"
                    name="pan"
                    type="text"
                    required
                    maxLength={10}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 uppercase focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    placeholder="ABCDE1234F"
                    value={formData.pan}
                    onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 mb-4">
                  We'll verify your PAN with the Income Tax Department
                </p>

                {/* PAN Verification Inline Component */}
                {formData.pan && formData.pan.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan) && (
                  <div className="mt-4">
                    <PANVerificationInline
                      panNumber={formData.pan}
                      onVerified={handlePANVerified}
                      onCancel={() => {
                        setPanVerified(false);
                        setPanVerificationResult(null);
                      }}
                      memberType="self"
                      compact={true}
                    />
                  </div>
                )}

                {/* Show verification status */}
                {panVerified && panVerificationResult && (
                  <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-md flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-success-800">PAN Verified Successfully</p>
                      {panVerificationResult.fullName && (
                        <p className="text-xs text-success-700 mt-1">
                          Name: {panVerificationResult.fullName}
                        </p>
                      )}
                      {panVerificationResult.dateOfBirth && (
                        <p className="text-xs text-success-700 mt-1">
                          Date of Birth: {new Date(panVerificationResult.dateOfBirth).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Terms & Conditions */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-64 overflow-y-auto">
                <h3 className="text-heading-sm text-gray-900 mb-2">Terms and Conditions</h3>
                <div className="text-body-sm text-gray-600 space-y-2">
                  <p>
                    By creating an account, you agree to our Terms of Service and Privacy Policy.
                    You understand that:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Your data will be securely stored and used only for ITR filing purposes</li>
                    <li>We comply with all applicable tax and data protection laws</li>
                    <li>You are responsible for the accuracy of information provided</li>
                    <li>We recommend consulting a CA for complex tax situations</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded mt-1"
                  checked={formData.acceptTerms}
                  onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                />
                <label htmlFor="acceptTerms" className="ml-2 block text-body-sm text-gray-700">
                  I accept the{' '}
                  <Link to="/terms" className="text-orange-600 hover:text-orange-500">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-orange-600 hover:text-orange-500">
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || (step === 2 && !panVerified)}
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              {isLoading
                ? 'Processing...'
                : step === 3
                ? 'Create Account'
                : step === 2 && !panVerified
                ? 'Verify PAN to Continue'
                : 'Continue'}
            </button>
          </div>

          {step === 1 && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">Or sign up with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="ml-2">Continue with Google</span>
                </button>
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-body-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-orange-600 hover:text-orange-500">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;

