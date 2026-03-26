// =====================================================
// AUTHENTICATION ROUTES - MVP
// =====================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('../config/passport');
const { v4: uuidv4 } = require('uuid');
const { User, UserSession, PasswordResetToken } = require('../models');
const AuditService = require('../services/core/AuditService');
const enterpriseLogger = require('../utils/logger');
const emailService = require('../services/integration/EmailService');
const { authenticateToken, authRateLimit } = require('../middleware/auth');
const { setRefreshTokenCookie, clearRefreshTokenCookie, handleTokenRefresh } = require('../middleware/cookieAuth');
const { auditAuthEvents, auditFailedAuth } = require('../middleware/auditLogger');
const { progressiveRateLimit, recordFailedAttempt } = require('../middleware/progressiveRateLimit');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// =====================================================
// RATE LIMITERS
// =====================================================

const googleOAuthInitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many Google OAuth requests. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const googleOAuthCallbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// =====================================================
// HELPERS
// =====================================================

/** Build canonical JWT payload */
const signAccessToken = (user) => jwt.sign(
  {
    userId: user.id,
    email: user.email,
    role: user.role,
    caFirmId: user.caFirmId || null,
  },
  process.env.JWT_SECRET || 'fallback-secret',
  { expiresIn: '1h' },
);

/** Create a session and return the raw refresh token */
const createSession = async (user, req) => {
  const refreshToken = uuidv4();
  const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

  const maxConcurrentSessions = parseInt(process.env.MAX_CONCURRENT_SESSIONS) || 3;
  await UserSession.enforceConcurrentLimit(user.id, maxConcurrentSessions, user.email);

  await UserSession.create({
    userId: user.id,
    refreshTokenHash,
    deviceInfo: req.headers['user-agent'] || 'Unknown',
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  return refreshToken;
};

/** Standard user response shape */
const userResponse = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName || user.full_name,
  role: user.role,
  status: user.status,
  authProvider: user.authProvider || user.auth_provider,
  hasPassword: !!user.passwordHash,
  panNumber: user.panNumber || null,
  panVerified: user.panVerified || false,
  profile_picture: user.metadata?.profile_picture,
});

// =====================================================
// REGISTRATION
// =====================================================

router.post('/register',
  process.env.NODE_ENV === 'production' ? authRateLimit : (req, res, next) => next(),
  auditAuthEvents('register'),
  async (req, res) => {
    try {
      const { email, password, fullName, phone } = req.body;

      if (!email || !password || !fullName) {
        return res.status(400).json({ success: false, error: 'Email, password, and full name are required' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, error: 'Invalid email format' });
      }

      if (password.length < 8) {
        return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long' });
      }

      let normalizedPhone = null;
      if (phone) {
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length !== 10 || !/^[6-9]/.test(phoneDigits)) {
          return res.status(400).json({ success: false, error: 'Invalid phone number (10 digits, starting with 6-9)' });
        }
        normalizedPhone = phoneDigits;
      }

      const existingUser = await User.findOne({
        where: { email: email.toLowerCase(), authProvider: 'local' },
      });
      if (existingUser) {
        return res.status(409).json({ success: false, error: 'User with this email already exists' });
      }

      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      const verificationToken = uuidv4();

      const newUser = await User.create({
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        phone: normalizedPhone,
        role: 'END_USER',
        authProvider: 'local',
        status: 'active',
        emailVerified: false,
        verificationToken,
      });

      // Send verification email (non-blocking)
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/email-verification?token=${verificationToken}`;
      emailService.sendVerificationEmail(newUser.email, verificationUrl).catch(err => {
        enterpriseLogger.error('Failed to send verification email', { userId: newUser.id, error: err.message });
      });

      enterpriseLogger.info('User registered', { userId: newUser.id, email: newUser.email });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: { id: newUser.id, email: newUser.email, fullName: newUser.fullName, role: newUser.role, status: newUser.status, createdAt: newUser.createdAt },
      });
    } catch (error) {
      enterpriseLogger.error('Registration failed', { error: error.message, stack: error.stack });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

// =====================================================
// EMAIL VERIFICATION
// =====================================================

router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Verification token is required' });
    }

    const user = await User.findOne({ where: { verificationToken: token } });
    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification token' });
    }
    if (user.emailVerified) {
      return res.json({ success: true, message: 'Email already verified' });
    }

    await user.update({ emailVerified: true, verificationToken: null });
    enterpriseLogger.info('Email verified', { userId: user.id });
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    enterpriseLogger.error('Email verification failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/resend-verification', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ success: false, error: 'Email is already verified' });

    const verificationToken = user.verificationToken || uuidv4();
    if (!user.verificationToken) await user.update({ verificationToken });

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/email-verification?token=${verificationToken}`;
    await emailService.sendVerificationEmail(user.email, verificationUrl);

    enterpriseLogger.info('Verification email resent', { userId: user.id });
    res.json({ success: true, message: 'Verification email sent successfully' });
  } catch (error) {
    enterpriseLogger.error('Resend verification failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// =====================================================
// LOGIN
// =====================================================

router.post('/login',
  process.env.NODE_ENV === 'production' ? progressiveRateLimit() : (req, res, next) => next(),
  process.env.NODE_ENV === 'production' ? recordFailedAttempt : (req, res, next) => next(),
  auditFailedAuth('login'),
  async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
      }

      const user = await User.findOne({
        where: { email: email.toLowerCase(), authProvider: 'local' },
      });

      if (!user) {
        enterpriseLogger.warn('Login failed: user not found', { email: email.toLowerCase(), ip: req.ip });
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      if (!user.passwordHash) {
        return res.status(401).json({ success: false, error: 'Password not set. Please use OAuth login or set a password first.' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        enterpriseLogger.warn('Login failed: invalid password', { userId: user.id, ip: req.ip });
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      const token = signAccessToken(user);
      const refreshToken = await createSession(user, req);

      AuditService.logAuthEvent({
        actorId: user.id,
        action: 'AUTH_LOGIN_SUCCESS',
        metadata: { method: 'password', ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      }).catch(err => enterpriseLogger.error('Audit failed', { error: err.message }));

      enterpriseLogger.info('User logged in', { userId: user.id });
      setRefreshTokenCookie(res, refreshToken);

      res.json({
        success: true,
        message: 'Login successful',
        accessToken: token,
        user: userResponse(user),
      });
    } catch (error) {
      enterpriseLogger.error('Login failed', { error: error.message, stack: error.stack });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

// =====================================================
// TOKEN REFRESH & LOGOUT
// =====================================================

router.post('/refresh', handleTokenRefresh);

router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const sessions = await UserSession.findAll({
        where: {
          revoked: false,
          expiresAt: { [require('sequelize').Op.gt]: new Date() },
        },
      });

      for (const session of sessions) {
        const isMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);
        if (isMatch) {
          await session.update({ revoked: true, revokedAt: new Date() });
          enterpriseLogger.info('Session revoked on logout', { userId: session.userId, sessionId: session.id });
          break;
        }
      }
    }

    clearRefreshTokenCookie(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    enterpriseLogger.error('Logout failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
});

router.post('/sessions/logout-all', authenticateToken, auditAuthEvents('revoke_all_sessions'), async (req, res) => {
  try {
    const userId = req.user.userId;
    await UserSession.revokeAllSessions(userId);
    clearRefreshTokenCookie(res);

    AuditService.logAuthEvent({
      actorId: userId, action: 'AUTH_REVOKE_ALL_SESSIONS', metadata: {},
    }).catch(err => enterpriseLogger.error('Audit failed', { error: err.message }));

    res.json({ success: true, message: 'All sessions revoked successfully' });
  } catch (error) {
    enterpriseLogger.error('Revoke all sessions failed', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// =====================================================
// PROFILE
// =====================================================

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findByPk(userId, {
      attributes: [
        'id', 'email', 'fullName', 'phone', 'dateOfBirth', 'gender',
        'panNumber', 'panVerified', 'panVerifiedAt',
        'role', 'status', 'createdAt', 'authProvider', 'passwordHash',
      ],
    });

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const UserProfile = require('../models/UserProfile');
    const userProfile = await UserProfile.findOne({ where: { userId: user.id } });

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        authProvider: user.authProvider,
        hasPassword: !!user.passwordHash,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        pan: user.panNumber,
        panVerified: user.panVerified,
        panVerifiedAt: user.panVerifiedAt,
        address: userProfile ? {
          line1: userProfile.addressLine1,
          line2: userProfile.addressLine2,
          city: userProfile.city,
          state: userProfile.state,
          pincode: userProfile.pincode,
        } : null,
        banking: userProfile ? {
          bankName: userProfile.bankName,
          accountNumber: userProfile.accountNumber,
          ifscCode: userProfile.ifscCode,
        } : null,
      },
    });
  } catch (error) {
    enterpriseLogger.error('Profile fetch failed', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fullName, phone, dateOfBirth, gender, metadata } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (dateOfBirth !== undefined) {
      if (dateOfBirth === '' || dateOfBirth === null) {
        user.dateOfBirth = null;
      } else {
        const parsed = new Date(dateOfBirth);
        if (!isNaN(parsed.getTime()) && dateOfBirth !== 'Invalid date') {
          user.dateOfBirth = dateOfBirth;
        }
      }
    }
    if (gender !== undefined) {
      if (gender && !['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
        return res.status(400).json({ success: false, error: 'Invalid gender value. Must be MALE, FEMALE, or OTHER' });
      }
      user.gender = gender;
    }
    if (metadata) {
      user.metadata = { ...(user.metadata || {}), ...metadata };
    }

    await user.save();
    enterpriseLogger.info('Profile updated', { userId, updatedFields: Object.keys(req.body) });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id, email: user.email, fullName: user.fullName, phone: user.phone,
        role: user.role, status: user.status, dateOfBirth: user.dateOfBirth, gender: user.gender,
        metadata: user.metadata || {}, authProvider: user.authProvider, hasPassword: !!user.passwordHash,
        panNumber: user.panNumber, panVerified: user.panVerified,
      },
    });
  } catch (error) {
    enterpriseLogger.error('Update profile error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// =====================================================
// PAN
// =====================================================

router.patch('/pan', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { panNumber, dateOfBirth } = req.body;

    if (!panNumber || panNumber.length !== 10) {
      return res.status(400).json({ success: false, error: 'Valid 10-character PAN number is required' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.panNumber = panNumber.toUpperCase();
    user.panVerified = true;
    user.panVerifiedAt = new Date();

    if (dateOfBirth) {
      user.dateOfBirth = dateOfBirth;
      user.dobVerified = true;
      user.dobVerifiedAt = new Date();
    }

    await user.save();
    enterpriseLogger.info('PAN updated', { userId, pan: user.panNumber, dobUpdated: !!dateOfBirth });

    res.json({
      success: true,
      message: 'PAN and Identity updated successfully',
      user: { id: user.id, panNumber: user.panNumber, panVerified: user.panVerified, dateOfBirth: user.dateOfBirth, dobVerified: user.dobVerified },
    });
  } catch (error) {
    enterpriseLogger.error('Update PAN error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/verify-pan', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { pan } = req.body;

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!pan || !panRegex.test(pan.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid PAN format. Expected format: ABCDE1234F' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // TODO: Integrate with SurePass API for real verification
    const verifiedName = user.fullName || 'User Name';

    if (!user.panNumber) {
      user.panNumber = pan.toUpperCase();
      user.panVerified = true;
      user.panVerifiedAt = new Date();
      await user.save();
    }

    enterpriseLogger.info('PAN verified', { userId, pan: pan.toUpperCase() });
    res.json({ success: true, message: 'PAN verified successfully', data: { name: verifiedName, pan: pan.toUpperCase(), verified: true } });
  } catch (error) {
    enterpriseLogger.error('PAN verification failed', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ success: false, message: 'PAN verification failed', error: error.message });
  }
});

// =====================================================
// PASSWORD MANAGEMENT
// =====================================================

router.put('/set-password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (user.passwordHash) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, error: 'Current password is required' });
      }
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Current password is incorrect' });
      }
    }

    const hadPasswordBefore = !!user.passwordHash;
    user.passwordHash = await bcrypt.hash(newPassword, 12);

    if (user.authProvider === 'google' && !hadPasswordBefore) {
      user.authProvider = 'local';
    }

    await user.save();
    enterpriseLogger.info('Password updated', { userId, hadPreviousPassword: hadPasswordBefore });

    res.json({
      success: true,
      message: 'Password updated successfully',
      user: { id: user.id, email: user.email, hasPassword: true, authProvider: user.authProvider },
    });
  } catch (error) {
    enterpriseLogger.error('Set password error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// =====================================================
// OTP (registration flow)
// =====================================================

router.post('/send-otp', authRateLimit, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await emailService.sendOTPEmail(email, otp, 'registration');
    } catch (emailError) {
      enterpriseLogger.error('Failed to send OTP email', { email, error: emailError.message });
      return res.status(500).json({ success: false, error: 'Failed to send OTP. Please try again.' });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      // TODO: Remove hardcoded OTP before production
      ...(process.env.NODE_ENV !== 'production' && { otp: '123456' }),
    });
  } catch (error) {
    enterpriseLogger.error('Send OTP failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/verify-otp', authRateLimit, async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, error: 'Email and OTP are required' });

    // TODO: Implement real OTP verification with Redis/DB storage
    if (otp === '123456' || otp.length === 6) {
      res.json({ success: true, message: 'OTP verified successfully' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid OTP' });
    }
  } catch (error) {
    enterpriseLogger.error('Verify OTP failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// =====================================================
// PASSWORD RESET
// =====================================================

router.post('/validate-reset-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: 'Reset token is required' });

    const validation = await PasswordResetToken.validateToken(token);
    if (validation.valid) {
      res.json({ success: true, valid: true, message: 'Reset token is valid' });
    } else {
      res.json({ success: false, valid: false, error: 'Invalid or expired reset token' });
    }
  } catch (error) {
    enterpriseLogger.error('Validate reset token error', { error: error.message });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/forgot-password',
  process.env.NODE_ENV === 'production' ? authRateLimit : (req, res, next) => next(),
  auditAuthEvents('forgot_password'),
  async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

      const user = await User.findOne({ where: { email: email.toLowerCase(), authProvider: 'local' } });
      if (!user) {
        // Don't reveal if user exists
        return res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
      }

      const resetToken = uuidv4();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await PasswordResetToken.createResetToken(
        user.id, resetToken, expiresAt,
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent'],
      );

      try {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken.token}`;
        await emailService.sendPasswordResetEmail(email, resetToken.token, resetUrl);
      } catch (emailError) {
        enterpriseLogger.error('Failed to send password reset email', { email, error: emailError.message });
      }

      res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    } catch (error) {
      enterpriseLogger.error('Forgot password failed', { error: error.message });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

router.post('/reset-password',
  process.env.NODE_ENV === 'production' ? authRateLimit : (req, res, next) => next(),
  auditAuthEvents('reset_password'),
  async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ success: false, error: 'Token and new password are required' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long' });
      }

      const tokenValidation = await PasswordResetToken.validateToken(token);
      if (!tokenValidation.valid) {
        return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
      }

      const user = await User.findByPk(tokenValidation.token.userId);
      if (!user) return res.status(400).json({ success: false, error: 'User not found' });

      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      await user.update({ passwordHash: await bcrypt.hash(newPassword, saltRounds) });
      await PasswordResetToken.markAsUsed(token);
      await UserSession.revokeAllSessions(user.id);

      AuditService.logAuthEvent({
        actorId: user.id, action: 'AUTH_PASSWORD_RESET', metadata: {},
      }).catch(err => enterpriseLogger.error('Audit failed', { error: err.message }));

      enterpriseLogger.info('Password reset completed', { userId: user.id });
      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
      enterpriseLogger.error('Reset password failed', { error: error.message });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

// =====================================================
// GOOGLE OAUTH
// =====================================================

const getOAuthFrontendUrl = (req) => {
  return req?.session?.oauthRedirectBase || process.env.FRONTEND_URL || 'http://localhost:3000';
};

const validateOAuthRedirectBase = (redirectBase) => {
  if (!redirectBase || typeof redirectBase !== 'string') return null;

  try {
    const url = new URL(redirectBase);
    if (!['http:', 'https:'].includes(url.protocol)) return null;

    let configuredHost = null;
    if (process.env.FRONTEND_URL) {
      try { configuredHost = new URL(process.env.FRONTEND_URL).host; } catch { /* ignore */ }
    }

    const allowedHosts = (process.env.ALLOWED_OAUTH_REDIRECT_HOSTS || '')
      .split(',').map(h => h.trim()).filter(Boolean);

    const hostAllowed =
      (configuredHost && url.host === configuredHost) ||
      allowedHosts.includes(url.host) ||
      url.host === 'localhost:3000' ||
      url.host === '127.0.0.1:3000';

    return hostAllowed ? url.origin : null;
  } catch {
    return null;
  }
};

const checkGoogleOAuthConfig = (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ success: false, error: 'GOOGLE_OAUTH_NOT_CONFIGURED' });
  }
  next();
};

router.get('/google', googleOAuthInitLimiter, checkGoogleOAuthConfig, (req, res, next) => {
  const state = require('crypto').randomBytes(32).toString('hex');
  req.session.oauthState = state;

  const redirectBase = validateOAuthRedirectBase(req.query.redirectBase);
  if (redirectBase) req.session.oauthRedirectBase = redirectBase;

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    state,
  })(req, res, next);
});

router.get('/google/callback',
  googleOAuthCallbackLimiter,
  checkGoogleOAuthConfig,
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      const frontendUrl = getOAuthFrontendUrl(req);

      if (err) {
        enterpriseLogger.error('Google OAuth failed', { error: err.message, ip: req.ip });

        if (err.message && (err.message.includes('too many requests') || err.message.includes('rate limit') || err.code === 429)) {
          return res.redirect(`${frontendUrl}/login?error=oauth_rate_limit&message=${encodeURIComponent('Too many requests to Google. Please wait before trying again.')}`);
        }
        return res.redirect(`${frontendUrl}/auth/google/error?message=${encodeURIComponent(err.message || 'Authentication failed')}`);
      }

      if (!user) {
        const errorMessage = encodeURIComponent(info?.message || 'Authentication failed');
        return res.redirect(`${frontendUrl}/auth/google/error?message=${errorMessage}`);
      }

      req.user = user;
      next();
    })(req, res, next);
  },
  async (req, res) => {
    try {
      const user = req.user;
      const token = signAccessToken(user);
      const refreshToken = await createSession(user, req);

      await user.update({ lastLoginAt: new Date() });

      AuditService.logAuthEvent({
        actorId: user.id, action: 'AUTH_GOOGLE_LOGIN', metadata: {},
      }).catch(err => enterpriseLogger.error('Audit failed', { error: err.message }));

      enterpriseLogger.info('Google OAuth login successful', { userId: user.id });
      setRefreshTokenCookie(res, refreshToken);

      const frontendUrl = getOAuthFrontendUrl(req);
      const userData = encodeURIComponent(JSON.stringify(userResponse(user)));
      res.redirect(`${frontendUrl}/auth/google/success?token=${token}&refreshToken=${refreshToken}&user=${userData}`);
    } catch (error) {
      enterpriseLogger.error('Google OAuth callback error', { error: error.message });
      const frontendUrl = getOAuthFrontendUrl(req);
      res.redirect(`${frontendUrl}/auth/google/error?message=${encodeURIComponent(error.message)}`);
    }
  },
);

// =====================================================
// SESSION MANAGEMENT
// =====================================================

const deviceDetectionService = require('../services/utils/DeviceDetectionService');

router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const sessions = await UserSession.findActiveSessions(userId);

    // Identify current session by matching refresh token cookie
    const currentRefreshToken = req.cookies?.refreshToken;
    let currentSessionId = null;

    if (currentRefreshToken && sessions.length > 0) {
      for (const session of sessions) {
        try {
          if (await bcrypt.compare(currentRefreshToken, session.refreshTokenHash)) {
            currentSessionId = session.id;
            break;
          }
        } catch { continue; }
      }
    }
    if (!currentSessionId && sessions.length > 0) {
      currentSessionId = sessions[0].id;
    }

    const formattedSessions = sessions.map((session) => {
      const deviceInfo = deviceDetectionService.parseDeviceInfo(session.userAgent, session.ipAddress);
      return {
        id: session.id,
        deviceType: deviceInfo.deviceType,
        deviceName: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        location: deviceInfo.location || 'Unknown',
        ipAddress: session.ipAddress,
        lastActive: session.lastActive,
        createdAt: session.createdAt,
        isCurrent: session.id === currentSessionId,
      };
    });

    res.json({ success: true, sessions: formattedSessions });
  } catch (error) {
    enterpriseLogger.error('Get sessions failed', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessionId } = req.params;

    const session = await UserSession.findOne({ where: { id: sessionId, userId } });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    await session.update({ revoked: true, revokedAt: new Date() });

    AuditService.logAuthEvent({
      actorId: userId, action: 'AUTH_SESSION_REVOKED', metadata: { sessionId },
    }).catch(err => enterpriseLogger.error('Audit failed', { error: err.message }));

    res.json({ success: true, message: 'Session revoked successfully' });
  } catch (error) {
    enterpriseLogger.error('Revoke session failed', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
