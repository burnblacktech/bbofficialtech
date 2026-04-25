/**
 * OTP Routes — Generate and verify OTPs
 */

const express = require('express');
const router = express.Router();
const OTPService = require('../services/core/OTPService');
const enterpriseLogger = require('../utils/logger');
const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many OTP requests. Please wait.' },
});

/**
 * POST /api/otp/generate
 * Generate and send OTP to phone or email
 */
router.post('/generate', otpLimiter, async (req, res, next) => {
  try {
    const { identifier, channel = 'email' } = req.body;
    if (!identifier) return res.status(400).json({ success: false, error: 'identifier (phone or email) is required' });
    if (!['sms', 'email'].includes(channel)) return res.status(400).json({ success: false, error: 'channel must be sms or email' });

    const { code, expiresAt } = await OTPService.generateOTP(identifier, channel);

    // In production, send via Twilio/email. In dev, code is logged.
    // TODO: Wire NotificationService.sendSMS / sendEmail here

    res.json({
      success: true,
      message: `OTP sent to ${channel === 'sms' ? 'phone' : 'email'}`,
      expiresAt,
      ...(process.env.NODE_ENV !== 'production' && { code }),
    });
  } catch (err) { next(err); }
});

/**
 * POST /api/otp/verify
 * Verify an OTP code
 */
router.post('/verify', otpLimiter, async (req, res, next) => {
  try {
    const { identifier, code, channel = 'email' } = req.body;
    if (!identifier || !code) return res.status(400).json({ success: false, error: 'identifier and code are required' });

    const result = await OTPService.verifyOTP(identifier, code, channel);

    if (!result.valid) {
      const messages = {
        expired: 'OTP has expired. Please request a new one.',
        invalid: 'Incorrect OTP. Please try again.',
        locked_out: 'Too many failed attempts. Please wait 30 minutes.',
      };
      return res.status(result.reason === 'locked_out' ? 429 : 400).json({
        success: false,
        error: messages[result.reason] || 'OTP verification failed',
        reason: result.reason,
      });
    }

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) { next(err); }
});

module.exports = router;
