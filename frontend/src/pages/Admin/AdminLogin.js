// =====================================================
// ADMIN LOGIN - SECURE ADMINISTRATIVE ACCESS
// Secure login portal for platform administrators
// =====================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Typography } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, FadeInUp } from '../../components/DesignSystem/Animations';
import {
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Lock,
  User,
} from 'lucide-react';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    twoFactorCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is already logged in
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (isLocked) {
      setError('Account is temporarily locked due to too many failed attempts. Please try again later.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock authentication logic
      const validAdmins = [
        { email: 'admin@burnblack.com', password: 'AdminPass123!', role: 'super_admin' },
        { email: 'support@burnblack.com', password: 'SupportPass123!', role: 'platform_admin' },
        { email: 'billing@burnblack.com', password: 'BillingPass123!', role: 'platform_admin' },
      ];

      const admin = validAdmins.find(a =>
        a.email === formData.email && a.password === formData.password,
      );

      if (!admin) {
        setLoginAttempts(prev => prev + 1);
        if (loginAttempts >= 2) {
          setIsLocked(true);
          setError('Too many failed attempts. Account locked for 15 minutes.');
          setTimeout(() => {
            setIsLocked(false);
            setLoginAttempts(0);
          }, 15 * 60 * 1000); // 15 minutes
        } else {
          setError('Invalid email or password. Please try again.');
        }
        return;
      }

      // Check if 2FA is required (simulate)
      if (!showTwoFactor) {
        setShowTwoFactor(true);
        setError('');
        return;
      }

      // Verify 2FA code (mock)
      if (formData.twoFactorCode !== '123456') {
        setError('Invalid 2FA code. Please try again.');
        return;
      }

      // Successful login
      const adminToken = btoa(JSON.stringify({
        email: admin.email,
        role: admin.role,
        loginTime: new Date().toISOString(),
      }));

      localStorage.setItem('adminToken', adminToken);
      localStorage.setItem('adminUser', JSON.stringify(admin));

      // Redirect to admin dashboard
      navigate('/admin/dashboard');

    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMain = () => {
    navigate('/');
  };

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <FadeInUp>
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-primary-600" />
            </div>
            <Typography.H2 className="mb-2">Admin Portal</Typography.H2>
            <Typography.Body className="text-neutral-600">
              Secure administrative access to BurnBlack platform
            </Typography.Body>
          </div>
        </FadeInUp>

        {/* Login Form */}
        <FadeInUp delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-primary-600" />
                <span>Administrator Login</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="admin@burnblack.com"
                      disabled={loading || isLocked}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-10 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your password"
                      disabled={loading || isLocked}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      disabled={loading || isLocked}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                {showTwoFactor && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-2 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-primary-600" />
                      <Typography.Small className="text-primary-700">
                        Two-factor authentication required
                      </Typography.Small>
                    </div>
                    <div>
                      <label htmlFor="twoFactorCode" className="block text-sm font-medium text-neutral-700 mb-2">
                        2FA Code
                      </label>
                      <input
                        id="twoFactorCode"
                        name="twoFactorCode"
                        type="text"
                        required
                        value={formData.twoFactorCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        disabled={loading || isLocked}
                      />
                      <Typography.Small className="text-neutral-500 mt-1">
                        Enter the 6-digit code from your authenticator app
                      </Typography.Small>
                    </div>
                  </motion.div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 p-3 bg-error-50 border border-error-200 rounded-lg"
                  >
                    <AlertCircle className="w-4 h-4 text-error-600" />
                    <Typography.Small className="text-error-700">
                      {error}
                    </Typography.Small>
                  </motion.div>
                )}

                {/* Login Attempts Warning */}
                {loginAttempts > 0 && !isLocked && (
                  <div className="flex items-center space-x-2 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-warning-600" />
                    <Typography.Small className="text-warning-700">
                      {3 - loginAttempts} attempts remaining before account lock
                    </Typography.Small>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || isLocked}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            </CardContent>
          </Card>
        </FadeInUp>

        {/* Security Notice */}
        <FadeInUp delay={0.2}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-primary-600 mt-0.5" />
                <div>
                  <Typography.Small className="font-medium text-neutral-700 mb-1">
                    Security Notice
                  </Typography.Small>
                  <Typography.Small className="text-neutral-600">
                    This is a secure administrative portal. All login attempts are logged and monitored.
                    Unauthorized access is strictly prohibited.
                  </Typography.Small>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeInUp>

        {/* Back to Main Site */}
        <FadeInUp delay={0.3}>
          <div className="text-center">
            <button
              onClick={handleBackToMain}
              className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
            >
              ← Back to Main Site
            </button>
          </div>
        </FadeInUp>
      </div>
    </PageTransition>
  );
};

export default AdminLogin;
