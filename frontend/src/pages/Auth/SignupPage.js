/**
 * Signup Page - Premium Compact Design
 * Tight spacing matching login page
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services';
import { AlertCircle, Shield, User, Mail, Phone, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import FormField from '../../components/molecules/FormField';
import Card from '../../components/atoms/Card';
import { tokens } from '../../styles/tokens';

const SignupPage = () => {
  const navigate = useNavigate();
  const { loginWithOAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });

  const calculatePasswordStrength = (password) => {
    let score = 0;
    const feedback = [];
    if (password.length >= 8) score += 1;
    else feedback.push('8+ chars');
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    else feedback.push('Upper+lower');
    if (/\d/.test(password)) score += 1;
    else feedback.push('Number');
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Special char');
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
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Valid email is required');
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))) {
      setError('Valid 10-digit phone number required');
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
      setError('Password is too weak');
      return false;
    }
    if (!formData.acceptTerms) {
      setError('Please accept terms and conditions');
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
        toast.success('Account created! Please verify your email.');
        try {
          const loginResponse = await authService.login({
            email: formData.email.toLowerCase(),
            password: formData.password,
          });
          if (loginResponse.success) {
            await loginWithOAuth(loginResponse.user, loginResponse.accessToken, loginResponse.refreshToken);
            navigate('/email-verification');
          }
        } catch (loginError) {
          navigate('/login', { state: { message: 'Account created. Please login.' } });
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Signup failed.';
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
    if (passwordStrength.score === 0) return tokens.colors.neutral[200];
    if (passwordStrength.score === 1) return tokens.colors.error[500];
    if (passwordStrength.score === 2) return tokens.colors.warning[500];
    if (passwordStrength.score === 3) return tokens.colors.info[500];
    return tokens.colors.success[500];
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
              Create your account
            </h2>
            <p style={{
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.neutral[600],
            }}>
              Start filing your taxes in minutes
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: tokens.spacing.sm,
              borderRadius: tokens.borderRadius.md,
              backgroundColor: tokens.colors.error[50],
              border: `1px solid ${tokens.colors.error[200]}`,
              marginBottom: tokens.spacing.sm,
              display: 'flex',
              gap: tokens.spacing.xs,
            }}>
              <AlertCircle size={16} color={tokens.colors.error[600]} style={{ flexShrink: 0 }} />
              <p style={{
                fontSize: tokens.typography.fontSize.xs,
                color: tokens.colors.error[700],
                margin: 0,
              }}>
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.sm }}>
            <FormField label="Full Name" required>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                fullWidth
              />
            </FormField>

            <FormField label="Email" required>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                fullWidth
              />
            </FormField>

            <FormField label="Mobile" required>
              <Input
                id="phone"
                type="tel"
                placeholder="10-digit number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                fullWidth
              />
            </FormField>

            <FormField label="Password" required>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                fullWidth
              />
              {formData.password && (
                <div style={{ marginTop: tokens.spacing.xs }}>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '2px' }}>
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        style={{
                          height: '3px',
                          flex: 1,
                          borderRadius: tokens.borderRadius.sm,
                          backgroundColor: i < passwordStrength.score ? getPasswordStrengthColor() : tokens.colors.neutral[200],
                        }}
                      />
                    ))}
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <p style={{
                      fontSize: tokens.typography.fontSize.xs,
                      color: tokens.colors.neutral[500],
                      margin: 0,
                    }}>
                      {passwordStrength.feedback.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </FormField>

            <FormField label="Confirm Password" required>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                error={formData.confirmPassword && formData.password !== formData.confirmPassword}
                fullWidth
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: tokens.colors.error[600],
                  marginTop: tokens.spacing.xs,
                }}>
                  Passwords don't match
                </p>
              )}
            </FormField>

            <div style={{ marginTop: tokens.spacing.xs }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                  style={{ width: '14px', height: '14px', cursor: 'pointer', marginTop: '2px', flexShrink: 0 }}
                />
                <span style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>
                  I accept the{' '}
                  <Link to="/terms" style={{ color: tokens.colors.accent[600], textDecoration: 'none' }}>
                    Terms
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" style={{ color: tokens.colors.accent[600], textDecoration: 'none' }}>
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={isLoading}
              style={{ marginTop: tokens.spacing.xs }}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
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
              onClick={handleGoogleSignup}
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
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{
                    color: tokens.colors.accent[600],
                    textDecoration: 'none',
                    fontWeight: tokens.typography.fontWeight.semibold,
                  }}
                >
                  Sign in
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

export default SignupPage;
