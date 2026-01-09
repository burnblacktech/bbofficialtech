import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services';
import { useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { sanitizeEmail, sanitizePassword } from '../../utils/sanitize';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  // Check for error messages from URL params (e.g., OAuth errors)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');

    if (errorParam === 'oauth_rate_limit' || messageParam?.includes('too many requests')) {
      setError('Google OAuth rate limit exceeded. Please wait 15-30 minutes before trying again.');
    } else if (errorParam === 'oauth_failed') {
      setError(messageParam || 'Google OAuth authentication failed. Please try again.');
    } else if (messageParam) {
      setError(decodeURIComponent(messageParam));
    }
  }, [searchParams]);

  // Load remember me preference from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Validate email format
  const validateEmail = (emailValue) => {
    if (!emailValue) {
      setEmailError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Validate password
  const validatePassword = (passwordValue) => {
    if (!passwordValue) {
      setPasswordError('Password is required');
      return false;
    }
    if (passwordValue.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  // Handle email change with sanitization and validation
  const handleEmailChange = (e) => {
    const sanitized = sanitizeEmail(e.target.value);
    setEmail(sanitized);
    setError(''); // Clear general error when user types
    if (sanitized) {
      validateEmail(sanitized);
    } else {
      setEmailError('');
    }
  };

  // Handle password change with sanitization and validation
  const handlePasswordChange = (e) => {
    const sanitized = sanitizePassword(e.target.value);
    setPassword(sanitized);
    setError(''); // Clear general error when user types
    if (sanitized) {
      validatePassword(sanitized);
    } else {
      setPasswordError('');
    }
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    // Clear previous errors
    setError('');
    setEmailError('');
    setPasswordError('');

    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      // Save email to localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      const result = await login({ email, password });
      if (!result.success) {
        setError('Email or password doesn’t match. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    authService.googleLoginRedirect();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-heading-1 font-extrabold text-black">
            Sign in to your tax account
          </h2>
          <p className="mt-2 text-center text-body-md text-slate-600">
            Your data is encrypted and never shared without your permission.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleManualLogin}>
          {error && (
            <div className={`px-4 py-3 rounded-xl flex items-start space-x-3 ${error.includes('rate limit') || error.includes('too many requests')
                ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                : 'bg-error-50 border border-red-200 text-error-600'
              }`}>
              {error.includes('rate limit') || error.includes('too many requests') ? (
                <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-medium">{error.includes('rate limit') || error.includes('too many requests') ? 'Rate Limit Exceeded' : 'Authentication Error'}</p>
                <p className="text-body-regular mt-1">{error}</p>
              </div>
            </div>
          )}
          <div className="rounded-xl shadow-elevation-1 -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${emailError ? 'border-error-300' : 'border-slate-300'
                  } placeholder-gray-500 text-slate-900 rounded-t-md focus:outline-none focus:ring-gold-500 focus:border-gold-500 focus:z-10 sm:text-sm`}
                placeholder="Email address"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => validateEmail(email)}
              />
              {emailError && (
                <p className="mt-1 text-body-regular text-error-600">{emailError}</p>
              )}
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border ${passwordError ? 'border-error-300' : 'border-slate-300'
                  } placeholder-gray-500 text-slate-900 rounded-b-md focus:outline-none focus:ring-gold-500 focus:border-gold-500 focus:z-10 sm:text-sm`}
                placeholder="Password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => validatePassword(password)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-slate-400" />
                ) : (
                  <Eye className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {passwordError && (
                <p className="mt-1 text-body-regular text-error-600">{passwordError}</p>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-gold-600 focus:ring-gold-500 border-slate-300 rounded"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember-me" className="ml-2 block text-body-regular text-slate-900">
              Remember me
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-body-regular font-medium rounded-xl text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
            >
              {isLoading ? 'Continuing...' : 'Continue'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-body-regular">
                <span className="px-2 bg-slate-50 text-slate-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
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

          <div className="flex items-center justify-between">
            <div className="text-body-regular">
              <Link to="/forgot-password" className="font-medium text-gold-600 hover:text-gold-500">
                Forgot password?
              </Link>
            </div>
          </div>

          <div className="text-center">
            <p className="text-body-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-gold-600 hover:text-gold-500">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
