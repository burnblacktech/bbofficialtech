// =====================================================
// COOKIE AUTHENTICATION MIDDLEWARE
// =====================================================

const jwt = require('jsonwebtoken');
const { User, UserSession } = require('../models');
const enterpriseLogger = require('../utils/logger');

/**
 * Middleware to authenticate using HttpOnly cookies
 */
const authenticateWithCookies = async (req, res, next) => {
  try {
    // Get refresh token from HttpOnly cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'No refresh token provided',
      });
    }

    // O(1) lookup by sessionId cookie, fallback to bcrypt scan
    let validSession = null;
    const sessionId = req.cookies.sessionId;
    if (sessionId) {
      const session = await UserSession.findByPk(sessionId);
      if (session && !session.revoked && session.expiresAt > new Date()) {
        const bcrypt = require('bcryptjs');
        if (await bcrypt.compare(refreshToken, session.refreshTokenHash)) {
          validSession = session;
        }
      }
    }
    if (!validSession) {
      // Fallback: scan user's sessions only (requires JWT hint)
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(req.headers.authorization?.replace('Bearer ', '') || '');
      if (decoded?.userId) {
        const { Op } = require('sequelize');
        const sessions = await UserSession.findAll({
          where: { userId: decoded.userId, revoked: false, expiresAt: { [Op.gt]: new Date() } },
        });
        const bcrypt = require('bcryptjs');
        for (const s of sessions) {
          if (await bcrypt.compare(refreshToken, s.refreshTokenHash)) { validSession = s; break; }
        }
      }
    }

    if (!validSession) {
      return res.status(401).json({
        error: 'Invalid refresh token',
      });
    }

    // Get user
    const user = await User.findByPk(validSession.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        error: 'User not found or inactive',
      });
    }

    // Generate new access token (canonical payload only)
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        caFirmId: user.caFirmId || null,
      },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '15m' },
    );

    // Update session last active
    await validSession.update({ lastActive: new Date() });

    // Attach user info to request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      caFirmId: user.caFirmId || null,
    };

    // Set new access token in response header
    res.setHeader('X-Access-Token', accessToken);

    next();
  } catch (error) {
    enterpriseLogger.error('Cookie authentication failed', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      error: 'Authentication failed',
    });
  }
};

/**
 * Middleware to set HttpOnly cookies for refresh tokens
 * Enterprise-grade security: HttpOnly, Secure, SameSite protection
 */
const setRefreshTokenCookie = (res, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, // Prevents XSS attacks - JavaScript cannot access
    secure: isProduction, // HTTPS only in production
    sameSite: 'strict', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
    // Additional security headers
    domain: process.env.COOKIE_DOMAIN || undefined,
  });
};

/**
 * Middleware to clear refresh token cookie
 */
const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
};

/**
 * Token refresh endpoint handler
 * Exchanges valid refresh token for new access token
 */
const handleTokenRefresh = async (req, res) => {
  try {
    // Try to get refresh token from cookie first, then from body
    let refreshToken = req.cookies.refreshToken;

    if (!refreshToken && req.body && req.body.refreshToken) {
      refreshToken = req.body.refreshToken;
    }

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'No refresh token provided',
      });
    }

    // O(1) lookup by sessionId cookie, fallback to bcrypt scan
    let validSession = null;
    const sessionId = req.cookies.sessionId;
    if (sessionId) {
      const session = await UserSession.findByPk(sessionId);
      if (session && !session.revoked && session.expiresAt > new Date()) {
        const bcrypt = require('bcryptjs');
        if (await bcrypt.compare(refreshToken, session.refreshTokenHash)) {
          validSession = session;
        }
      }
    }
    if (!validSession) {
      // Fallback: scan user's sessions only (requires JWT hint)
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(req.headers.authorization?.replace('Bearer ', '') || '');
      if (decoded?.userId) {
        const { Op } = require('sequelize');
        const sessions = await UserSession.findAll({
          where: { userId: decoded.userId, revoked: false, expiresAt: { [Op.gt]: new Date() } },
        });
        const bcrypt = require('bcryptjs');
        for (const s of sessions) {
          if (await bcrypt.compare(refreshToken, s.refreshTokenHash)) { validSession = s; break; }
        }
      }
    }

    if (!validSession) {
      // Clear invalid cookie
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
      });
    }

    // Get user
    const user = await User.findByPk(validSession.userId);
    if (!user || user.status !== 'active') {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
      });
    }

    // Generate new access token (canonical payload only)
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        caFirmId: user.caFirmId || null,
      },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '15m' },
    );

    // Update session last active
    await validSession.update({ lastActive: new Date() });

    enterpriseLogger.info('Token refreshed successfully', {
      userId: user.id,
      email: user.email,
    });

    res.json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,

      },
    });

  } catch (error) {
    enterpriseLogger.error('Token refresh failed', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
    });
  }
};

module.exports = {
  authenticateWithCookies,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  handleTokenRefresh,
};
