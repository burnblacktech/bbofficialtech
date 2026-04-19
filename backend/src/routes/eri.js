// =====================================================
// ERI ROUTES — Client Management & ERI Operations
// =====================================================

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const eriGateway = require('../services/eri/ERIGatewayService');
const enterpriseLogger = require('../utils/logger');
const Joi = require('joi');

// ── Validation schemas ──

const addClientSchema = Joi.object({
  pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/).required(),
  dob: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  otpSource: Joi.string().valid('E', 'A').default('E'),
});

const validateOtpSchema = Joi.object({
  pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/).required(),
  transactionId: Joi.string().required(),
  otpSource: Joi.string().valid('E', 'A').required(),
  otp: Joi.string().length(6).required(),
  validUpto: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
});

const registerClientSchema = Joi.object({
  pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/).required(),
  dob: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  firstName: Joi.string().max(75).allow(''),
  lastName: Joi.string().max(125).required(),
  middleName: Joi.string().max(75).allow(''),
  gender: Joi.string().valid('M', 'F', 'T').required(),
  residentialStatus: Joi.string().valid('RES', 'NRI').default('RES'),
  mobile: Joi.string().length(10).required(),
  email: Joi.string().email().required(),
  flatDoorBlock: Joi.string().max(60).required(),
  premisesBuilding: Joi.string().max(60).required(),
  areaLocality: Joi.string().max(60).required(),
  districtCity: Joi.string().max(60).required(),
  postOffice: Joi.string().max(60).allow(''),
  pincode: Joi.string().length(6).required(),
  stateCode: Joi.string().max(3).allow(''),
  countryCode: Joi.string().max(3).default('91'),
});

const validateRegOtpSchema = Joi.object({
  pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/).required(),
  smsTransactionId: Joi.string().required(),
  emailTransactionId: Joi.string().required(),
  mobileOtp: Joi.string().length(6).required(),
  emailOtp: Joi.string().length(6).required(),
  validUpto: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
});

// ══════════════════════════════════════════════════════
// ADD CLIENT — Registered taxpayer
// ══════════════════════════════════════════════════════

/**
 * @route POST /api/eri/add-client
 * @desc Initiate adding a registered taxpayer as ERI client. Sends OTP.
 */
router.post('/add-client', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = addClientSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });

    const result = await eriGateway.addClient(value.pan, value.dob, value.otpSource);

    enterpriseLogger.info('ERI add-client initiated', {
      userId: req.user.userId,
      pan: value.pan.substring(0, 5) + '****' + value.pan.substring(9),
    });

    res.json({
      success: true,
      data: {
        transactionId: result.transactionId,
        otpSource: value.otpSource,
        message: value.otpSource === 'A'
          ? 'OTP sent to Aadhaar-linked mobile number'
          : 'OTP sent to e-Filing registered mobile and email',
      },
    });
  } catch (err) { next(err); }
});

/**
 * @route POST /api/eri/validate-client-otp
 * @desc Validate OTP to confirm adding registered taxpayer as client.
 */
router.post('/validate-client-otp', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = validateOtpSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });

    const result = await eriGateway.validateClientOtp(
      value.pan, value.transactionId, value.otpSource, value.otp, value.validUpto,
    );

    enterpriseLogger.info('ERI client OTP validated', {
      userId: req.user.userId,
      pan: value.pan.substring(0, 5) + '****' + value.pan.substring(9),
    });

    res.json({
      success: true,
      data: { status: result.httpStatus, message: 'Client added successfully' },
    });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════
// REGISTER CLIENT — Unregistered taxpayer
// ══════════════════════════════════════════════════════

/**
 * @route POST /api/eri/register-client
 * @desc Register an unregistered taxpayer on e-Filing + add as ERI client. Sends OTP.
 */
router.post('/register-client', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = registerClientSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });

    const result = await eriGateway.registerClient(value);

    enterpriseLogger.info('ERI register-client initiated', {
      userId: req.user.userId,
      pan: value.pan.substring(0, 5) + '****' + value.pan.substring(9),
    });

    res.json({
      success: true,
      data: {
        smsTransactionId: result.smsTransactionId,
        emailTransactionId: result.emailTransactionId,
        message: 'OTP sent to provided mobile and email',
      },
    });
  } catch (err) { next(err); }
});

/**
 * @route POST /api/eri/validate-reg-otp
 * @desc Validate OTP to confirm registering + adding unregistered taxpayer.
 */
router.post('/validate-reg-otp', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = validateRegOtpSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });

    const result = await eriGateway.validateRegOtp(
      value.pan, value.smsTransactionId, value.emailTransactionId,
      value.mobileOtp, value.emailOtp, value.validUpto,
    );

    enterpriseLogger.info('ERI register OTP validated', {
      userId: req.user.userId,
      pan: value.pan.substring(0, 5) + '****' + value.pan.substring(9),
    });

    res.json({
      success: true,
      data: { status: result.httpStatus, message: 'Client registered and added successfully' },
    });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════
// STATUS — Check ERI configuration
// ══════════════════════════════════════════════════════

/**
 * @route GET /api/eri/status
 * @desc Check ERI service configuration and mode
 */
router.get('/status', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    data: {
      mode: eriGateway.mode,
      eriUserId: eriGateway.eriUserId || null,
      hasP12Cert: !!eriGateway.p12CertPath,
      hasClientCredentials: !!(eriGateway.clientId && eriGateway.clientSecret),
    },
  });
});

module.exports = router;
