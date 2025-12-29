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
const SignupPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
  });

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
  };

  const validateForm = () => {
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
    if (!formData.acceptTerms) {
      setError('Please accept the terms and conditions');
      return false;
    }
    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setError('');
    setIsLoading(true);

    try {
      const response = await authService.register({
        fullName: formData.fullName,
        email: formData.email.toLowerCase(),
        phone: formData.phone.replace(/\D/g, ''),
        password: formData.password,
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
    if (passwordStrength.score === 0) return 'bg-slate-200';
    if (passwordStrength.score === 1) return 'bg-error-500';
    if (passwordStrength.score === 2) return 'bg-warning-500';
    if (passwordStrength.score === 3) return 'bg-info-500';
    return 'bg-success-500';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-heading-xl text-slate-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-body-md text-slate-600">
            Start filing your ITR in minutes
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && (
            <div className="px-4 py-3 rounded-xl bg-error-50 border border-error-200 text-error-600 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Error</p>
                <p className="text-body-regular mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-label-md text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-body-regular"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-label-md text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-body-regular"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-label-md text-slate-700 mb-1">
                Mobile Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-xl placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-body-regular"
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-label-md text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-body-regular"
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
                        className={`h-1 flex-1 rounded ${i < passwordStrength.score
                          ? getPasswordStrengthColor()
                          : 'bg-slate-200'
                          }`}
                      />
                    ))}
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <p className="text-body-small text-slate-600">
                      {passwordStrength.feedback.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-label-md text-slate-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-body-regular"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-body-small text-error-600">Passwords do not match</p>
              )}
            </div>

            <div className="pt-2">
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
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 border border-transparent rounded-xl shadow-elevation-1 text-body-regular font-medium text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-body-regular">
                <span className="px-2 bg-slate-50 text-slate-500">Or sign up with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignup}
                className="w-full inline-flex justify-center py-2 px-4 border border-slate-300 rounded-xl shadow-elevation-1 bg-white text-body-regular font-medium text-slate-500 hover:bg-slate-50"
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

export default SignupPage;

