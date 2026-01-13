import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services';
import { useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { sanitizeEmail, sanitizePassword } from '../../utils/sanitize';
import { OrientationPage } from '../../components/templates';
import { Button } from '../../components/ui';
import { typography, components } from '../../styles/designTokens';

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

  // Check for error messages from URL params
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

  // Load remember me preference
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

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

  const handleEmailChange = (e) => {
    const sanitized = sanitizeEmail(e.target.value);
    setEmail(sanitized);
    setError('');
    if (sanitized) {
      validateEmail(sanitized);
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (e) => {
    const sanitized = sanitizePassword(e.target.value);
    setPassword(sanitized);
    setError('');
    if (sanitized) {
      validatePassword(sanitized);
    } else {
      setPasswordError('');
    }
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      const result = await login({ email, password });
      if (!result.success) {
        setError('Email or password doesn't match.Please try again.');
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
    <OrientationPage
      title="Sign in to your tax account"
      subtitle="Your data is encrypted and never shared without your permission."
    >
      <div className="max-w-md mx-auto">
        <form className="space-y-6" onSubmit={handleManualLogin}>
          {/* Error Banner */}
          {error && (
            <div className={`px-4 py-3 rounded-xl flex items-start space-x-3 ${error.includes('rate limit') || error.includes('too many requests')
                ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
              {error.includes('rate limit') || error.includes('too many requests') ? (
                <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-medium">
                  {error.includes('rate limit') || error.includes('too many requests')
                    ? 'Rate Limit Exceeded'
                    : 'Authentication Error'}
                </p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Email Input */}
          <div>
            <label htmlFor="email" className={typography.label}>
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={`${components.input} ${emailError ? 'border-red-300' : ''}`}
              placeholder="you@example.com"
              value={email}
              onChange={handleEmailChange}
              onBlur={() => validateEmail(email)}
            />
            {emailError && (
              <p className="mt-1 text-sm text-red-600">{emailError}</p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className={typography.label}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className={`${components.input} pr-10 ${passwordError ? 'border-red-300' : ''}`}
                placeholder="••••••••"
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
            </div>
            {passwordError && (
              <p className="mt-1 text-sm text-red-600">{passwordError}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-gold-600 focus:ring-gold-500 border-slate-300 rounded"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
              Remember me
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? 'Continuing...' : 'Continue'}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-50 text-slate-500">Or continue with</span>
            </div>
          </div>

          {/* Google Login */}
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={handleGoogleLogin}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          {/* Forgot Password Link */}
          <div className="flex items-center justify-center">
            <Link to="/forgot-password" className="text-sm font-medium text-gold-600 hover:text-gold-500">
              Forgot password?
            </Link>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-gold-600 hover:text-gold-500">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </OrientationPage>
  );
};

export default LoginPage;
