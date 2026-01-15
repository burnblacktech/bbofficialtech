/**
 * Login Page - Premium Compact Design
 * Tight spacing, professional appearance
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services';
import { useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, Clock, Eye, EyeOff, Shield } from 'lucide-react';
import { sanitizeEmail, sanitizePassword } from '../../utils/sanitize';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import FormField from '../../components/molecules/FormField';
import Card from '../../components/atoms/Card';
import { tokens } from '../../styles/tokens';

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

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    if (errorParam === 'oauth_rate_limit' || messageParam?.includes('too many requests')) {
      setError('Google OAuth rate limit exceeded. Please wait 15-30 minutes.');
    } else if (errorParam === 'oauth_failed') {
      setError(messageParam || 'Google OAuth failed. Please try again.');
    } else if (messageParam) {
      setError(decodeURIComponent(messageParam));
    }
  }, [searchParams]);

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
      setEmailError('Please enter a valid email');
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
    if (sanitized) validateEmail(sanitized);
    else setEmailError('');
  };

  const handlePasswordChange = (e) => {
    const sanitized = sanitizePassword(e.target.value);
    setPassword(sanitized);
    setError('');
    if (sanitized) validatePassword(sanitized);
    else setPasswordError('');
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) return;

    setIsLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      const result = await login({ email, password });
      if (!result.success) {
        setError("Email or password doesn't match.");
      }
    } catch (error) {
      setError(error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    authService.googleLoginRedirect();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.colors.neutral[50],
      padding: tokens.spacing.md,
    }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing.sm,
          marginBottom: tokens.spacing.md,
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: `linear-gradient(135deg, ${tokens.colors.accent[600]}, ${tokens.colors.accent[700]})`,
            borderRadius: tokens.borderRadius.lg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Shield size={18} color={tokens.colors.neutral.white} />
          </div>
          <h1 style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.neutral[900],
            margin: 0,
          }}>
            BurnBlack
          </h1>
        </div>

        {/* Card */}
        <Card padding="lg" style={{ backgroundColor: tokens.colors.neutral.white }}>
          {/* Title */}
          <div style={{ marginBottom: tokens.spacing.md }}>
            <h2 style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.neutral[900],
              marginBottom: tokens.spacing.xs,
            }}>
              Welcome back
            </h2>
            <p style={{
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.neutral[600],
            }}>
              Sign in to your account
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: tokens.spacing.sm,
              borderRadius: tokens.borderRadius.md,
              backgroundColor: error.includes('rate limit') ? tokens.colors.warning[50] : tokens.colors.error[50],
              border: `1px solid ${error.includes('rate limit') ? tokens.colors.warning[200] : tokens.colors.error[200]}`,
              marginBottom: tokens.spacing.sm,
              display: 'flex',
              gap: tokens.spacing.xs,
            }}>
              {error.includes('rate limit') ? (
                <Clock size={16} color={tokens.colors.warning[600]} style={{ flexShrink: 0 }} />
              ) : (
                <AlertCircle size={16} color={tokens.colors.error[600]} style={{ flexShrink: 0 }} />
              )}
              <p style={{
                fontSize: tokens.typography.fontSize.xs,
                color: error.includes('rate limit') ? tokens.colors.warning[700] : tokens.colors.error[700],
                margin: 0,
              }}>
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleManualLogin} style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.sm }}>
            <FormField label="Email" required error={emailError}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => validateEmail(email)}
                error={!!emailError}
                fullWidth
              />
            </FormField>

            <FormField label="Password" required error={passwordError}>
              <div style={{ position: 'relative' }}>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => validatePassword(password)}
                  error={!!passwordError}
                  fullWidth
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={16} color={tokens.colors.neutral[400]} />
                  ) : (
                    <Eye size={16} color={tokens.colors.neutral[400]} />
                  )}
                </button>
              </div>
            </FormField>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: tokens.spacing.xs,
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>
                  Remember me
                </span>
              </label>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: tokens.colors.accent[600],
                  textDecoration: 'none',
                  fontWeight: tokens.typography.fontWeight.medium,
                }}
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={isLoading}
              style={{ marginTop: tokens.spacing.xs }}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>

            <div style={{ position: 'relative', textAlign: 'center', margin: `${tokens.spacing.xs} 0` }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '1px',
                backgroundColor: tokens.colors.neutral[200],
              }} />
              <span style={{
                position: 'relative',
                backgroundColor: tokens.colors.neutral.white,
                padding: `0 ${tokens.spacing.xs}`,
                fontSize: tokens.typography.fontSize.xs,
                color: tokens.colors.neutral[500],
              }}>
                Or
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              onClick={handleGoogleLogin}
            >
              <svg style={{ width: '16px', height: '16px', marginRight: '6px' }} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </Button>

            <div style={{ textAlign: 'center', marginTop: tokens.spacing.xs }}>
              <p style={{
                fontSize: tokens.typography.fontSize.xs,
                color: tokens.colors.neutral[600],
                margin: 0,
              }}>
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  style={{
                    color: tokens.colors.accent[600],
                    textDecoration: 'none',
                    fontWeight: tokens.typography.fontWeight.semibold,
                  }}
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </Card>

        <div style={{ marginTop: tokens.spacing.sm, textAlign: 'center' }}>
          <p style={{
            fontSize: tokens.typography.fontSize.xs,
            color: tokens.colors.neutral[400],
            margin: 0,
          }}>
            © 2024 BurnBlack
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
