// =====================================================
// MFA SERVICE (OTP FOR ITR SUBMISSION)
// =====================================================

const crypto = require('crypto');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class MFAService {
  constructor() {
    this.otpExpiry = 5 * 60 * 1000; // 5 minutes
    this.maxAttempts = 3;
    this.otpLength = 6;
    
    // In production, this would be a database table
    this.mfaSessions = new Map();
    
    enterpriseLogger.info('MFAService initialized');
  }

  /**
   * Generate OTP for ITR submission
   * @param {string} userId - User ID
   * @param {string} filingId - Filing ID
   * @param {string} phone - Phone number for SMS
   * @param {string} email - Email for email OTP
   * @returns {Promise<object>} - MFA session data
   */
  async generateOTP(userId, filingId, phone = null, email = null) {
    try {
      // Generate 6-digit OTP
      const otp = this.generateRandomOTP();
      const sessionId = crypto.randomUUID();
      
      // Create MFA session
      const mfaSession = {
        sessionId,
        userId,
        filingId,
        otp,
        phone,
        email,
        attempts: 0,
        maxAttempts: this.maxAttempts,
        expiresAt: new Date(Date.now() + this.otpExpiry),
        createdAt: new Date(),
        status: 'pending'
      };

      // Store session
      this.mfaSessions.set(sessionId, mfaSession);

      // Send OTP via SMS and Email
      await this.sendOTP(mfaSession);

      enterpriseLogger.info('MFA OTP generated', {
        userId,
        filingId,
        sessionId,
        phone: phone ? 'provided' : 'not provided',
        email: email ? 'provided' : 'not provided'
      });

      return {
        sessionId,
        message: 'OTP sent successfully',
        expiresIn: this.otpExpiry / 1000, // seconds
        deliveryMethods: this.getDeliveryMethods(mfaSession)
      };

    } catch (error) {
      enterpriseLogger.error('Failed to generate MFA OTP', {
        error: error.message,
        userId,
        filingId
      });
      throw new AppError(`Failed to generate OTP: ${error.message}`, 500);
    }
  }

  /**
   * Verify OTP for ITR submission
   * @param {string} sessionId - MFA session ID
   * @param {string} otp - OTP to verify
   * @returns {Promise<object>} - Verification result
   */
  async verifyOTP(sessionId, otp) {
    try {
      const mfaSession = this.mfaSessions.get(sessionId);
      
      if (!mfaSession) {
        throw new AppError('Invalid or expired MFA session', 400);
      }

      // Check if session is expired
      if (new Date() > mfaSession.expiresAt) {
        this.mfaSessions.delete(sessionId);
        throw new AppError('MFA session expired', 400);
      }

      // Check if max attempts exceeded
      if (mfaSession.attempts >= mfaSession.maxAttempts) {
        this.mfaSessions.delete(sessionId);
        throw new AppError('Maximum OTP attempts exceeded', 400);
      }

      // Increment attempts
      mfaSession.attempts++;

      // Verify OTP
      if (mfaSession.otp !== otp) {
        enterpriseLogger.warn('MFA OTP verification failed', {
          sessionId,
          userId: mfaSession.userId,
          attempts: mfaSession.attempts,
          remainingAttempts: mfaSession.maxAttempts - mfaSession.attempts
        });

        if (mfaSession.attempts >= mfaSession.maxAttempts) {
          this.mfaSessions.delete(sessionId);
          throw new AppError('Maximum OTP attempts exceeded', 400);
        }

        throw new AppError(`Invalid OTP. ${mfaSession.maxAttempts - mfaSession.attempts} attempts remaining`, 400);
      }

      // OTP verified successfully
      mfaSession.status = 'verified';
      mfaSession.verifiedAt = new Date();

      enterpriseLogger.info('MFA OTP verified successfully', {
        sessionId,
        userId: mfaSession.userId,
        filingId: mfaSession.filingId,
        attempts: mfaSession.attempts
      });

      return {
        success: true,
        message: 'OTP verified successfully',
        sessionId,
        userId: mfaSession.userId,
        filingId: mfaSession.filingId
      };

    } catch (error) {
      enterpriseLogger.error('MFA OTP verification failed', {
        error: error.message,
        sessionId
      });
      throw error;
    }
  }

  /**
   * Resend OTP
   * @param {string} sessionId - MFA session ID
   * @returns {Promise<object>} - Resend result
   */
  async resendOTP(sessionId) {
    try {
      const mfaSession = this.mfaSessions.get(sessionId);
      
      if (!mfaSession) {
        throw new AppError('Invalid or expired MFA session', 400);
      }

      // Check if session is expired
      if (new Date() > mfaSession.expiresAt) {
        this.mfaSessions.delete(sessionId);
        throw new AppError('MFA session expired', 400);
      }

      // Generate new OTP
      const newOtp = this.generateRandomOTP();
      mfaSession.otp = newOtp;
      mfaSession.expiresAt = new Date(Date.now() + this.otpExpiry);
      mfaSession.attempts = 0; // Reset attempts

      // Send new OTP
      await this.sendOTP(mfaSession);

      enterpriseLogger.info('MFA OTP resent', {
        sessionId,
        userId: mfaSession.userId,
        filingId: mfaSession.filingId
      });

      return {
        success: true,
        message: 'OTP resent successfully',
        expiresIn: this.otpExpiry / 1000
      };

    } catch (error) {
      enterpriseLogger.error('Failed to resend MFA OTP', {
        error: error.message,
        sessionId
      });
      throw error;
    }
  }

  /**
   * Get MFA session status
   * @param {string} sessionId - MFA session ID
   * @returns {Promise<object>} - Session status
   */
  async getSessionStatus(sessionId) {
    try {
      const mfaSession = this.mfaSessions.get(sessionId);
      
      if (!mfaSession) {
        return { status: 'not_found' };
      }

      if (new Date() > mfaSession.expiresAt) {
        this.mfaSessions.delete(sessionId);
        return { status: 'expired' };
      }

      return {
        status: mfaSession.status,
        attempts: mfaSession.attempts,
        maxAttempts: mfaSession.maxAttempts,
        expiresAt: mfaSession.expiresAt,
        remainingTime: Math.max(0, mfaSession.expiresAt - new Date())
      };

    } catch (error) {
      enterpriseLogger.error('Failed to get MFA session status', {
        error: error.message,
        sessionId
      });
      throw error;
    }
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.mfaSessions.entries()) {
      if (now > session.expiresAt) {
        this.mfaSessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      enterpriseLogger.info('Cleaned up expired MFA sessions', { count: cleanedCount });
    }
  }

  /**
   * Generate random OTP
   * @returns {string} - 6-digit OTP
   */
  generateRandomOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP via SMS and Email
   * @param {object} mfaSession - MFA session data
   */
  async sendOTP(mfaSession) {
    try {
      // Mock SMS sending
      if (mfaSession.phone) {
        enterpriseLogger.info('SMS OTP sent', {
          phone: mfaSession.phone,
          otp: mfaSession.otp,
          sessionId: mfaSession.sessionId
        });
        
        // In production, integrate with SMS service (Twilio, etc.)
        // await smsService.sendOTP(mfaSession.phone, mfaSession.otp);
      }

      // Mock Email sending
      if (mfaSession.email) {
        enterpriseLogger.info('Email OTP sent', {
          email: mfaSession.email,
          otp: mfaSession.otp,
          sessionId: mfaSession.sessionId
        });
        
        // In production, integrate with email service (Resend, etc.)
        // await emailService.sendOTP(mfaSession.email, mfaSession.otp);
      }

    } catch (error) {
      enterpriseLogger.error('Failed to send OTP', {
        error: error.message,
        sessionId: mfaSession.sessionId
      });
      throw error;
    }
  }

  /**
   * Get delivery methods for OTP
   * @param {object} mfaSession - MFA session data
   * @returns {Array} - Delivery methods
   */
  getDeliveryMethods(mfaSession) {
    const methods = [];
    
    if (mfaSession.phone) {
      methods.push('SMS');
    }
    
    if (mfaSession.email) {
      methods.push('Email');
    }
    
    return methods;
  }

  /**
   * Validate MFA session for ITR submission
   * @param {string} sessionId - MFA session ID
   * @returns {Promise<boolean>} - Validation result
   */
  async validateSessionForSubmission(sessionId) {
    try {
      const mfaSession = this.mfaSessions.get(sessionId);
      
      if (!mfaSession) {
        return false;
      }

      if (mfaSession.status !== 'verified') {
        return false;
      }

      if (new Date() > mfaSession.expiresAt) {
        this.mfaSessions.delete(sessionId);
        return false;
      }

      return true;

    } catch (error) {
      enterpriseLogger.error('Failed to validate MFA session', {
        error: error.message,
        sessionId
      });
      return false;
    }
  }
}

module.exports = new MFAService();
