// =====================================================
// AUTHENTICATION ROUTES - JWT-BASED AUTHENTICATION
// Enterprise-grade authentication endpoints
// =====================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('../config/passport');
const { v4: uuidv4 } = require('uuid');
const { User, UserSession, AuditLog, PasswordResetToken, CAFirm } = require('../models');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');
const emailService = require('../services/integration/EmailService');
const { authenticateToken, authRateLimit } = require('../middleware/auth');
const { setRefreshTokenCookie, clearRefreshTokenCookie, handleTokenRefresh } = require('../middleware/cookieAuth');
const { auditAuthEvents, auditFailedAuth } = require('../middleware/auditLogger');
const { progressiveRateLimit, recordFailedAttempt, clearFailedAttempts, strictRateLimit } = require('../middleware/progressiveRateLimit');
const { requireRole, requirePermission } = require('../middleware/rbac');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Google OAuth specific rate limiter (stricter to avoid hitting Google's limits)
// Rate limit for initiation route only (callback comes from Google, not user)
const googleOAuthInitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit to 20 initiation attempts per IP per 15 minutes (accounts for ~10 login attempts)
  message: {
    error: 'Too many Google OAuth requests from this IP. Please wait a few minutes before trying again.',
    retryAfter: 15 * 60, // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts to avoid blocking legitimate users
  handler: (req, res) => {
    enterpriseLogger.warn('Google OAuth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.headers['user-agent'],
    });
    res.status(429).json({
      success: false,
      error: 'Too many Google OAuth requests from this IP. Please wait 15 minutes before trying again.',
      retryAfter: 15 * 60,
    });
  },
});

// Lighter rate limiter for callback route (only to prevent abuse, not strict)
const googleOAuthCallbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Higher limit since callbacks come from Google, not direct user action
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed callbacks
});

// =====================================================
// REGISTRATION ROUTES
// =====================================================

// Register new user
router.post('/register',
  process.env.NODE_ENV === 'production' ? authRateLimit : (req, res, next) => next(),
  auditAuthEvents('register'),
  async (req, res) => {
    try {
      const {
        email,
        password,
        fullName,
        phone,
      } = req.body;

      // Validate required fields
      if (!email || !password || !fullName) {
        return res.status(400).json({
          success: false,
          error: 'Email, password, and full name are required',
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
        });
      }

      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long',
        });
      }

      // Validate phone format if provided
      if (phone) {
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length !== 10 || !/^[6-9]/.test(phoneDigits)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid phone number (10 digits, starting with 6-9)',
          });
        }
        // Normalize phone to digits only
        req.body.phone = phoneDigits;
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          email: email.toLowerCase(),
          authProvider: 'LOCAL',
        },
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists',
        });
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const newUser = await User.create({
        email: email.toLowerCase(),
        passwordHash: passwordHash,
        fullName: fullName,
        phone: req.body.phone || null, // Use normalized phone
        role: 'END_USER', // Default role for all public signups
        authProvider: 'LOCAL',
        status: 'active',
        emailVerified: true,
      });

      enterpriseLogger.info('User registered successfully', {
        userId: newUser.id,
        email: newUser.email,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
          status: newUser.status,
          createdAt: newUser.createdAt,
        },
      });
    } catch (error) {
      enterpriseLogger.error('Registration failed', {
        error: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

// =====================================================
// LOGIN ROUTES
// =====================================================

// User login
router.post('/login',
  process.env.NODE_ENV === 'production' ? progressiveRateLimit() : (req, res, next) => next(),
  process.env.NODE_ENV === 'production' ? recordFailedAttempt : (req, res, next) => next(),
  auditFailedAuth('login'),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Debug logging (remove in production)
      enterpriseLogger.info('Login attempt', {
        email: email ? email.toLowerCase() : null,
        passwordLength: password ? password.length : 0,
        hasPassword: !!password,
        ip: req.ip,
      });

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
      }

      // Find user by email (regardless of authProvider)
      // Use raw query to avoid schema mismatch issues
      // Explicitly use public.users schema for clarity
      // Note: sequelize.query returns [results, metadata] when not using QueryTypes
      const queryResponse = await sequelize.query(
        `SELECT id, email, password_hash, role, status, auth_provider, full_name, 
         email_verified, phone_verified, token_version, last_login_at, onboarding_completed
         FROM public.users WHERE email = :email LIMIT 1`,
        {
          replacements: { email: email.toLowerCase() },
        }
      );

      // Handle both [results, metadata] and direct results array formats
      const queryResult = Array.isArray(queryResponse) && queryResponse.length > 0 
        ? (Array.isArray(queryResponse[0]) ? queryResponse[0] : queryResponse)
        : [];
      
      // queryResult should be the results array
      const user = Array.isArray(queryResult) && queryResult.length > 0 ? queryResult[0] : null;

      // Debug logging
      enterpriseLogger.info('User lookup result', {
        email: email.toLowerCase(),
        searchEmail: email,
        found: !!user,
        resultLength: queryResult ? queryResult.length : 0,
        queryResponseType: Array.isArray(queryResponse) ? 'array' : typeof queryResponse,
        queryResponseLength: Array.isArray(queryResponse) ? queryResponse.length : 'N/A',
        userId: user ? user.id : null,
        ip: req.ip,
      });

      // Convert to User model instance format
      if (user) {
        user.passwordHash = user.password_hash;
        user.authProvider = user.auth_provider;
        user.fullName = user.full_name;
        user.emailVerified = user.email_verified;
        user.phoneVerified = user.phone_verified;
        user.tokenVersion = user.token_version;
        user.lastLoginAt = user.last_login_at;
        user.onboardingCompleted = user.onboarding_completed;
      }

      if (!user) {
        enterpriseLogger.warn('Login failed: User not found', {
          email: email.toLowerCase(),
          searchEmail: email,
          ip: req.ip,
        });
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Check if user has a password set
      if (!user.passwordHash) {
        enterpriseLogger.warn('Login failed: No password set', {
          userId: user.id,
          email: user.email,
          authProvider: user.authProvider,
          ip: req.ip,
        });
        return res.status(401).json({
          success: false,
          error: 'Password not set. Please use OAuth login or set a password first.',
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        enterpriseLogger.warn('Login failed: Invalid password', {
          userId: user.id,
          email: user.email,
          passwordLength: password ? password.length : 0,
          ip: req.ip,
        });
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          tokenVersion: user.tokenVersion,
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '1h' },
      );

      // Generate refresh token
      const refreshToken = uuidv4();
      const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

      // Check concurrent session limit BEFORE creating new session
      const maxConcurrentSessions = parseInt(process.env.MAX_CONCURRENT_SESSIONS) || 3;
      await UserSession.enforceConcurrentLimit(user.id, maxConcurrentSessions, user.email);

      // Create session
      await UserSession.create({
        userId: user.id,
        refreshTokenHash,
        deviceInfo: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      // Update last login using raw query - explicitly use public.users schema
      await sequelize.query(
        `UPDATE public.users SET last_login_at = NOW(), updated_at = NOW() WHERE id = :userId`,
        {
          replacements: { userId: user.id },
        }
      );

      // Log audit event
      await AuditLog.logAuthEvent({
        userId: user.id,
        action: 'login_success',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        success: true,
      });

      enterpriseLogger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
      });

      // Set refresh token in HttpOnly cookie
      setRefreshTokenCookie(res, refreshToken);

      res.json({
        success: true,
        message: 'Login successful',
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName || user.full_name,
          role: user.role,
          status: user.status,
          onboardingCompleted: user.onboardingCompleted || user.onboarding_completed || false,
          authProvider: user.authProvider || user.auth_provider,
          hasPassword: !!user.passwordHash,
        },
      });
    } catch (error) {
      enterpriseLogger.error('Login failed', {
        error: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

// =====================================================
// TOKEN REFRESH ROUTES
// =====================================================

// Refresh access token using refresh token from HttpOnly cookie
router.post('/refresh', handleTokenRefresh);

// Logout - invalidate refresh token
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Find and revoke the specific session
      const sessions = await UserSession.findAll({
        where: {
          revoked: false,
          expiresAt: {
            [require('sequelize').Op.gt]: new Date(),
          },
        },
      });

      for (const session of sessions) {
        const bcrypt = require('bcryptjs');
        const isValid = await bcrypt.compare(refreshToken, session.refreshTokenHash);
        if (isValid) {
          await session.update({
            revoked: true,
            revokedAt: new Date(),
          });

          enterpriseLogger.info('User session revoked on logout', {
            userId: session.userId,
            sessionId: session.id,
          });
          break;
        }
      }
    }

    // Clear refresh token cookie
    clearRefreshTokenCookie(res);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    enterpriseLogger.error('Logout failed', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
});

// =====================================================
// PROFILE ROUTES
// =====================================================

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'fullName', 'phone', 'role', 'status', 'createdAt', 'dateOfBirth', 'metadata', 'authProvider', 'passwordHash', 'panNumber', 'panVerified', 'panVerifiedAt'],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get UserProfile with address fields
    const UserProfile = require('../models/UserProfile');
    const userProfile = await UserProfile.findOne({
      where: { userId: user.id },
      attributes: ['addressLine1', 'addressLine2', 'city', 'state', 'pincode'],
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        dateOfBirth: user.dateOfBirth,
        metadata: user.metadata || {},
        authProvider: user.authProvider,
        hasPassword: !!user.passwordHash,
        panNumber: user.panNumber,
        panVerified: user.panVerified || false,
        panVerifiedAt: user.panVerifiedAt,
        address: userProfile ? {
          addressLine1: userProfile.addressLine1 || null,
          addressLine2: userProfile.addressLine2 || null,
          city: userProfile.city || null,
          state: userProfile.state || null,
          pincode: userProfile.pincode || null,
        } : null,
      },
    });
  } catch (error) {
    enterpriseLogger.error('Profile fetch failed', {
      error: error.message,
      userId: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fullName, phone, dateOfBirth, metadata } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Update user fields
    if (fullName) {user.fullName = fullName;}
    if (phone) {user.phone = phone;}
    if (dateOfBirth !== undefined) {user.dateOfBirth = dateOfBirth;}
    if (metadata) {
      // Merge metadata with existing metadata
      user.metadata = { ...(user.metadata || {}), ...metadata };
    }

    await user.save();

    enterpriseLogger.info('User profile updated', {
      userId,
      updatedFields: Object.keys(req.body),
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status,
        dateOfBirth: user.dateOfBirth,
        metadata: user.metadata || {},
        authProvider: user.authProvider,
        hasPassword: !!user.passwordHash,
      },
    });
  } catch (error) {
    enterpriseLogger.error('Profile update failed', {
      error: error.message,
      userId: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// =====================================================
// LOGOUT ROUTE
// =====================================================

// User logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  enterpriseLogger.info('User logged out', {
    userId: req.user.userId,
  });

  res.json({
    message: 'Logout successful',
  });
});

// =====================================================
// OTP ROUTES (for registration)
// =====================================================

// Send OTP for registration
router.post('/send-otp', authRateLimit, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // Generate and send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await emailService.sendOTPEmail(email, otp, 'registration');
      enterpriseLogger.info('OTP email sent for registration', { email });
    } catch (emailError) {
      enterpriseLogger.error('Failed to send OTP email', {
        email,
        error: emailError.message,
      });
      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP. Please try again.',
      });
    }

    enterpriseLogger.info('OTP requested for registration', { email });

    res.json({
      success: true,
      message: 'OTP sent successfully',
      // In production, don't return the OTP
      otp: '123456', // Only for development
    });
  } catch (error) {
    enterpriseLogger.error('Send OTP failed', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Verify OTP for registration
router.post('/verify-otp', authRateLimit, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required',
      });
    }

    // For MVP, accept any 6-digit OTP
    if (otp === '123456' || otp.length === 6) {
      res.json({
        success: true,
        message: 'OTP verified successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid OTP',
      });
    }
  } catch (error) {
    enterpriseLogger.error('Verify OTP failed', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// =====================================================
// GOOGLE OAUTH ROUTES
// =====================================================

// Middleware to check if Google OAuth is configured
const checkGoogleOAuthConfig = (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    enterpriseLogger.warn('Google OAuth route accessed but not configured', {
      ip: req.ip,
      path: req.path,
    });
    return res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured. Please contact the administrator.',
      error: 'GOOGLE_OAUTH_NOT_CONFIGURED',
    });
  }
  next();
};

// Google OAuth login
// Google OAuth initiation with CSRF protection
router.get('/google', googleOAuthInitLimiter, checkGoogleOAuthConfig, (req, res, next) => {
  // Generate and store state parameter for CSRF protection
  const state = require('crypto').randomBytes(32).toString('hex');
  req.session.oauthState = state;

  enterpriseLogger.info('Google OAuth initiation', {
    state: state,
    sessionId: req.sessionID,
    ip: req.ip,
  });

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account', // Force account selection screen
    state: state, // Include state parameter
  })(req, res, next);
});

// Google OAuth callback
router.get('/google/callback',
  googleOAuthCallbackLimiter,
  checkGoogleOAuthConfig,
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        enterpriseLogger.error('Google OAuth authentication error', {
          error: err.message,
          errorStack: err.stack,
          query: req.query,
          ip: req.ip,
        });
        
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        
        // Handle specific error types
        if (err.message === 'ACCOUNT_LINKING_REQUIRED') {
          return res.redirect(`${frontendUrl}/auth/google/link-required?email=${encodeURIComponent(info?.email || '')}`);
        }
        
        // Handle Google rate limit errors
        if (err.message && (
          err.message.includes('too many requests') ||
          err.message.includes('rate limit') ||
          err.message.includes('quota') ||
          err.code === 429 ||
          err.status === 429
        )) {
          enterpriseLogger.warn('Google OAuth rate limit hit', {
            ip: req.ip,
            error: err.message,
          });
          return res.redirect(`${frontendUrl}/login?error=oauth_rate_limit&message=${encodeURIComponent('Too many requests to Google. Please wait 15-30 minutes before trying again.')}`);
        }
        
        // Redirect to error page with error message
        const errorMessage = encodeURIComponent(err.message || 'Authentication failed');
        return res.redirect(`${frontendUrl}/auth/google/error?message=${errorMessage}`);
      }
      
      if (!user) {
        enterpriseLogger.warn('Google OAuth authentication returned no user', {
          info: info,
          query: req.query,
          ip: req.ip,
        });
        
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const errorMessage = encodeURIComponent(info?.message || 'Authentication failed');
        return res.redirect(`${frontendUrl}/auth/google/error?message=${errorMessage}`);
      }
      
      // Attach user to request and continue
      req.user = user;
      req.authInfo = info;
      next();
    })(req, res, next);
  },
  async (req, res) => {
    try {
      // Check for account linking error
      if (req.authInfo && req.authInfo.message === 'ACCOUNT_LINKING_REQUIRED') {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/auth/google/link-required?email=${encodeURIComponent(req.authInfo.email)}`);
      }

      const user = req.user;

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          tokenVersion: user.tokenVersion,
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '1h' },
      );

      // Generate refresh token
      const refreshToken = uuidv4();
      const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

      // Check concurrent session limit BEFORE creating new session
      const maxConcurrentSessions = parseInt(process.env.MAX_CONCURRENT_SESSIONS) || 3;
      await UserSession.enforceConcurrentLimit(user.id, maxConcurrentSessions, user.email);

      // Create session
      await UserSession.create({
        userId: user.id,
        refreshTokenHash,
        deviceInfo: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      // Update last login
      await user.update({ lastLoginAt: new Date() });

      // Log audit event
      await AuditLog.logAuthEvent({
        userId: user.id,
        action: 'google_login_success',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        success: true,
      });

      enterpriseLogger.info('Google OAuth login successful', {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Set refresh token in HttpOnly cookie
      setRefreshTokenCookie(res, refreshToken);

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const userData = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        authProvider: user.authProvider,
        hasPassword: !!user.passwordHash,
      };
      const redirectUrl = `${frontendUrl}/auth/google/success?token=${token}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(userData))}`;

      // --- START DEBUGGING ---
      enterpriseLogger.info('Google OAuth redirect URL constructed', {
        frontendUrl,
        token: token ? `${token.substring(0, 20)}...` : 'null',
        refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null',
        userData,
        redirectUrl: redirectUrl.substring(0, 200) + '...',
      });
      // --- END DEBUGGING ---

      res.redirect(redirectUrl);

    } catch (error) {
      enterpriseLogger.error('Google OAuth callback error', {
        error: error.message,
        stack: error.stack,
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/google/error?message=${encodeURIComponent(error.message)}`);
    }
  },
);

// =====================================================
// PASSWORD RESET ROUTES
// =====================================================

// Validate reset token
router.post('/validate-reset-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Reset token is required',
      });
    }

    const validation = await PasswordResetToken.validateToken(token);

    if (validation.valid) {
      res.json({
        success: true,
        valid: true,
        message: 'Reset token is valid',
      });
    } else {
      res.json({
        success: false,
        valid: false,
        error: 'Invalid or expired reset token',
      });
    }
  } catch (error) {
    enterpriseLogger.error('Validate reset token error', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Forgot password
router.post('/forgot-password',
  process.env.NODE_ENV === 'production' ? authRateLimit : (req, res, next) => next(),
  auditAuthEvents('forgot_password'),
  async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required',
        });
      }

      // Find user
      const user = await User.findOne({
        where: {
          email: email.toLowerCase(),
          authProvider: 'LOCAL',
        },
      });

      if (!user) {
      // Don't reveal if user exists or not
        return res.json({
          success: true,
          message: 'If the email exists, a reset link has been sent',
        });
      }

      // Generate reset token
      const resetToken = uuidv4();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Create reset token record
      await PasswordResetToken.createResetToken(
        user.id,
        resetToken,
        expiresAt,
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent'],
      );

      // Log audit event
      await AuditLog.logAuthEvent({
        userId: user.id,
        action: 'password_reset_requested',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        success: true,
      });

      // Send password reset email
      try {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken.token}`;
        await emailService.sendPasswordResetEmail(email, resetToken.token, resetUrl);
        enterpriseLogger.info('Password reset email sent', { email });
      } catch (emailError) {
        enterpriseLogger.error('Failed to send password reset email', {
          email,
          error: emailError.message,
        });
      // Don't fail the request if email fails
      }

      enterpriseLogger.info('Password reset token generated', {
        userId: user.id,
        email: user.email,
        resetToken, // Remove this in production
      });

      res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      });

    } catch (error) {
      enterpriseLogger.error('Forgot password failed', {
        error: error.message,
        email: req.body.email,
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

// Reset password
router.post('/reset-password',
  process.env.NODE_ENV === 'production' ? authRateLimit : (req, res, next) => next(),
  auditAuthEvents('reset_password'),
  async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Token and new password are required',
        });
      }

      // Validate password strength
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long',
        });
      }

      // Validate token
      const tokenValidation = await PasswordResetToken.validateToken(token);
      if (!tokenValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token',
        });
      }

      const resetTokenRecord = tokenValidation.token;
      const user = await User.findByPk(resetTokenRecord.userId);

      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'User not found',
        });
      }

      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update user password and increment token version
      await user.update({
        passwordHash,
        tokenVersion: user.tokenVersion + 1,
      });

      // Mark token as used
      await PasswordResetToken.markAsUsed(token);

      // Revoke all existing sessions
      await UserSession.revokeAllSessions(user.id);

      // Log audit event
      await AuditLog.logAuthEvent({
        userId: user.id,
        action: 'password_reset_completed',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        success: true,
      });

      enterpriseLogger.info('Password reset completed', {
        userId: user.id,
        email: user.email,
      });

      res.json({
        success: true,
        message: 'Password reset successfully',
      });

    } catch (error) {
      enterpriseLogger.error('Reset password failed', {
        error: error.message,
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

// Note: The /refresh endpoint is already registered above at line 284 using handleTokenRefresh middleware
// This handles cookie-based refresh tokens. For body-based refresh tokens, use the same endpoint
// but the handleTokenRefresh middleware will check cookies first, then fall back to body if needed.

// Logout
router.post('/logout', authenticateToken, auditAuthEvents('logout'), async (req, res) => {
  try {
    const userId = req.user.userId;

    // Revoke all sessions
    await UserSession.revokeAllSessions(userId);

    // Clear refresh token cookie
    clearRefreshTokenCookie(res);

    // Log audit event
    await AuditLog.logAuthEvent({
      userId,
      action: 'logout',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      success: true,
    });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    enterpriseLogger.error('Logout failed', {
      error: error.message,
      userId: req.user?.userId,
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Revoke all sessions
router.post('/revoke-all', authenticateToken, requirePermission('admin.user_sessions'), auditAuthEvents('revoke_all_sessions'), async (req, res) => {
  try {
    const userId = req.user.userId;

    // Revoke all sessions
    await UserSession.revokeAllSessions(userId);

    // Increment token version to invalidate all existing tokens
    const user = await User.findByPk(userId);
    await user.update({
      tokenVersion: user.tokenVersion + 1,
    });

    // Clear refresh token cookie
    clearRefreshTokenCookie(res);

    // Log audit event
    await AuditLog.logAuthEvent({
      userId,
      action: 'all_sessions_revoked',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      success: true,
    });

    res.json({
      success: true,
      message: 'All sessions revoked successfully',
    });

  } catch (error) {
    enterpriseLogger.error('Revoke all sessions failed', {
      error: error.message,
      userId: req.user?.userId,
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// =====================================================
// SESSION MANAGEMENT ROUTES
// =====================================================

// Get user sessions
router.get('/sessions', authenticateToken, requirePermission('admin.user_sessions'), async (req, res) => {
  try {
    const userId = req.user.userId;
    const sessions = await UserSession.findActiveSessions(userId);

    res.json({
      success: true,
      sessions: sessions.map(session => ({
        id: session.id,
        deviceInfo: session.deviceInfo,
        ipAddress: session.ipAddress,
        lastActive: session.lastActive,
        createdAt: session.createdAt,
      })),
    });

  } catch (error) {
    enterpriseLogger.error('Get sessions failed', {
      error: error.message,
      userId: req.user?.userId,
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Revoke specific session
router.delete('/sessions/:sessionId', authenticateToken, requirePermission('admin.user_sessions'), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessionId } = req.params;

    const session = await UserSession.findOne({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    await session.update({
      revoked: true,
      revokedAt: new Date(),
    });

    // Log audit event
    await AuditLog.logAuthEvent({
      userId,
      action: 'session_revoked',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      metadata: { sessionId },
      success: true,
    });

    res.json({
      success: true,
      message: 'Session revoked successfully',
    });

  } catch (error) {
    enterpriseLogger.error('Revoke session failed', {
      error: error.message,
      userId: req.user?.userId,
      sessionId: req.params.sessionId,
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// =====================================================
// UPGRADE TO PROFESSIONAL ROUTES
// =====================================================

// Upgrade END_USER to CA_FIRM_ADMIN
router.post('/upgrade-to-professional',
  authenticateToken,
  requireRole(['END_USER']),
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const {
        firmName,
        firmType,
        address,
        city,
        state,
        pincode,
        phone,
        website,
        description,
      } = req.body;

      // Validate required fields
      if (!firmName || !city || !state) {
        return res.status(400).json({
          success: false,
          error: 'Firm name, city, and state are required',
        });
      }

      // Get current user
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Check if user is already a professional
      if (user.role !== 'END_USER') {
        return res.status(400).json({
          success: false,
          error: 'User is already a professional',
        });
      }

      // Create CA Firm
      const caFirm = await CAFirm.create({
        name: firmName,
        type: firmType || 'CA_FIRM',
        address: address || '',
        city,
        state,
        pincode: pincode || '',
        phone: phone || '',
        website: website || '',
        description: description || '',
        status: 'active',
        adminUserId: userId,
      });

      // Update user role to CA_FIRM_ADMIN
      await user.update({
        role: 'CA_FIRM_ADMIN',
        firmId: caFirm.id,
      });

      // Log audit event
      await AuditLog.logAuthEvent({
        userId,
        event: 'upgrade_to_professional',
        details: {
          firmId: caFirm.id,
          firmName: firmName,
          previousRole: 'END_USER',
          newRole: 'CA_FIRM_ADMIN',
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      enterpriseLogger.info('User upgraded to professional', {
        userId,
        firmId: caFirm.id,
        firmName: firmName,
      });

      res.json({
        success: true,
        message: 'Successfully upgraded to professional account',
        data: {
          firmId: caFirm.id,
          firmName: caFirm.name,
          newRole: 'CA_FIRM_ADMIN',
        },
      });

    } catch (error) {
      enterpriseLogger.error('Upgrade to professional failed', {
        error: error.message,
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
);

// =====================================================
// ONBOARDING ROUTES
// =====================================================

// Complete onboarding
router.post('/complete-onboarding', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { onboardingCompleted } = req.body;

    // Get user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Update onboarding status
    await user.update({
      onboardingCompleted: onboardingCompleted || true,
    });

    // Log audit event
    await AuditLog.logAuthEvent({
      userId,
      event: 'onboarding_completed',
      details: {
        onboardingCompleted: onboardingCompleted || true,
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    enterpriseLogger.info('Onboarding completed', {
      userId,
      onboardingCompleted: onboardingCompleted || true,
    });

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        onboardingCompleted: user.onboardingCompleted,
      },
    });

  } catch (error) {
    enterpriseLogger.error('Complete onboarding failed', {
      error: error.message,
      userId: req.user?.userId,
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

module.exports = router;