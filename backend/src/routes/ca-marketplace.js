// =====================================================
// CA MARKETPLACE ROUTES - PUBLIC ENDPOINTS
// Public endpoints for browsing CA firms
// =====================================================

const express = require('express');
const { CAFirm, User, CAFirmReview, CAMarketplaceInquiry, CABooking } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const enterpriseLogger = require('../utils/logger');
const { Op } = require('sequelize');

const router = express.Router();

// =====================================================
// PUBLIC MARKETPLACE ENDPOINTS
// =====================================================

/**
 * Get all CA firms for marketplace (public)
 * GET /api/ca-marketplace/firms
 */
router.get('/firms', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      location,
      specialization,
      minRating,
      minPrice,
      maxPrice,
      search,
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      status: 'active', // Only show active firms
    };

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Location filter (from address)
    if (location) {
      whereClause.address = { [Op.iLike]: `%${location}%` };
    }

    // Get firms with pagination
    const { count, rows: firms } = await CAFirm.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    // Get stats and metadata for each firm
    const firmsWithMetadata = await Promise.all(
      firms.map(async (firm) => {
        const stats = await CAFirm.getFirmStats(firm.id);
        const metadata = firm.metadata || {};

        // Apply filters that require metadata
        let includeFirm = true;

        if (specialization && metadata.specialization !== specialization) {
          includeFirm = false;
        }

        if (minRating && (metadata.rating || 0) < parseFloat(minRating)) {
          includeFirm = false;
        }

        if (minPrice && (metadata.startingPrice || 0) < parseFloat(minPrice)) {
          includeFirm = false;
        }

        if (maxPrice && (metadata.startingPrice || 0) > parseFloat(maxPrice)) {
          includeFirm = false;
        }

        if (!includeFirm) {
          return null;
        }

        return {
          id: firm.id,
          name: firm.name,
          address: firm.address,
          phone: firm.phone,
          email: firm.email,
          metadata: {
            rating: metadata.rating || 0,
            reviewCount: metadata.reviewCount || 0,
            startingPrice: metadata.startingPrice || null,
            specialization: metadata.specialization || 'General Tax',
            description: metadata.description || '',
            services: metadata.services || [],
            experience: metadata.experience || '',
          },
          stats: stats.stats,
        };
      }),
    );

    // Filter out nulls (firms that didn't match metadata filters)
    const filteredFirms = firmsWithMetadata.filter(Boolean);

    res.json({
      success: true,
      data: {
        firms: filteredFirms,
        pagination: {
          total: filteredFirms.length, // Note: This is approximate after metadata filtering
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    enterpriseLogger.error('Get CA firms for marketplace failed', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Get CA firm details by ID (public)
 * GET /api/ca-marketplace/firms/:firmId
 */
router.get('/firms/:firmId', async (req, res) => {
  try {
    const { firmId } = req.params;

    const firm = await CAFirm.findByPk(firmId, {
      where: {
        status: 'active',
      },
    });

    if (!firm) {
      return res.status(404).json({
        success: false,
        error: 'CA firm not found',
      });
    }

    const stats = await CAFirm.getFirmStats(firmId);

    res.json({
      success: true,
      data: {
        firm: {
          ...firm.toJSON(),
          stats: stats.stats,
        },
      },
    });
  } catch (error) {
    enterpriseLogger.error('Get CA firm details failed', {
      error: error.message,
      stack: error.stack,
      firmId: req.params.firmId,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Get CA firm reviews (public)
 * GET /api/ca-marketplace/firms/:firmId/reviews
 */
router.get('/firms/:firmId/reviews', async (req, res) => {
  try {
    const { firmId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;
    const { validatePagination, isValidUUID } = require('../utils/validators');
    const { sendPaginated, sendError, sendValidationError } = require('../utils/responseFormatter');

    if (!isValidUUID(firmId)) {
      return sendValidationError(res, ['Invalid firm ID format']);
    }

    const { page: validatedPage, limit: validatedLimit, offset } = validatePagination(req.query);

    // Verify firm exists
    const firm = await CAFirm.findByPk(firmId);
    if (!firm || firm.status !== 'active') {
      return res.status(404).json({
        success: false,
        error: 'CA firm not found',
      });
    }

    // Fetch reviews
    const { count, rows: reviews } = await CAFirmReview.findByFirm(firmId, {
      rating: rating ? parseInt(rating) : undefined,
      limit: validatedLimit,
      offset,
    });

    sendPaginated(
      res,
      reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        clientName: review.clientName,
        date: review.date,
        helpfulCount: review.helpfulCount,
        verified: review.verified,
        createdAt: review.createdAt,
      })),
      count,
      validatedPage,
      validatedLimit,
      'Reviews retrieved successfully'
    );
  } catch (error) {
    enterpriseLogger.error('Get CA firm reviews failed', {
      error: error.message,
      stack: error.stack,
      firmId: req.params.firmId,
    });
    sendError(res, 500, 'Internal server error');
  }
});

/**
 * Get available time slots for CA firm (public)
 * GET /api/ca-marketplace/firms/:firmId/slots
 */
router.get('/firms/:firmId/slots', async (req, res) => {
  try {
    const { firmId } = req.params;
    const { date } = req.query;
    const { isValidUUID } = require('../utils/validators');
    const { sendSuccess, sendError, sendValidationError } = require('../utils/responseFormatter');

    if (!isValidUUID(firmId)) {
      return sendValidationError(res, ['Invalid firm ID format']);
    }

    if (!date) {
      return sendValidationError(res, ['Date parameter is required']);
    }

    // Verify date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return sendValidationError(res, ['Invalid date format']);
    }

    // Verify firm exists
    const firm = await CAFirm.findByPk(firmId);
    if (!firm || firm.status !== 'active') {
      return res.status(404).json({
        success: false,
        error: 'CA firm not found',
      });
    }

    // Get available slots using CABooking model
    const availableSlots = await CABooking.getAvailableSlots(firmId, date);

    sendSuccess(res, 200, null, {
      slots: availableSlots,
      date,
      firmId,
    });
  } catch (error) {
    enterpriseLogger.error('Get available slots failed', {
      error: error.message,
      stack: error.stack,
      firmId: req.params.firmId,
    });
    sendError(res, 500, 'Internal server error');
  }
});

// =====================================================
// AUTHENTICATED ENDPOINTS
// =====================================================

/**
 * Send inquiry to CA firm (requires authentication)
 * POST /api/ca-marketplace/firms/:firmId/inquiry
 */
router.post('/firms/:firmId/inquiry', authenticateToken, async (req, res) => {
  try {
    const { firmId } = req.params;
    const userId = req.user.userId;
    const { message, type, filingId, clientName, clientEmail } = req.body;
    const { isValidUUID, validateRequiredFields, isValidEmail } = require('../utils/validators');
    const { sendSuccess, sendError, sendValidationError, sendNotFound } = require('../utils/responseFormatter');

    if (!isValidUUID(firmId)) {
      return sendValidationError(res, ['Invalid firm ID format']);
    }

    // Validate required fields
    const validation = validateRequiredFields(req.body, ['message']);
    if (!validation.isValid) {
      return sendValidationError(res, validation.missingFields.map(f => `${f} is required`));
    }

    // Get user details for inquiry
    const { User } = require('../models');
    const user = await User.findByPk(userId);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Verify firm exists
    const firm = await CAFirm.findByPk(firmId);
    if (!firm || firm.status !== 'active') {
      return sendNotFound(res, 'CA firm');
    }

    // Create inquiry
    const inquiry = await CAMarketplaceInquiry.create({
      firmId,
      userId,
      clientName: clientName || user.fullName,
      clientEmail: clientEmail || user.email,
      message,
      status: 'pending',
      metadata: {
        type: type || 'general',
        filingId: filingId || null,
      },
    });

    enterpriseLogger.info('CA inquiry sent', {
      inquiryId: inquiry.id,
      firmId,
      userId,
      type,
      filingId,
    });

    // TODO: Send email notification to CA firm
    // This can be implemented using a notification service or email service

    sendSuccess(res, 201, 'Inquiry sent successfully', {
      inquiryId: inquiry.id,
      status: inquiry.status,
      createdAt: inquiry.createdAt,
    });
  } catch (error) {
    enterpriseLogger.error('Send inquiry failed', {
      error: error.message,
      stack: error.stack,
      firmId: req.params.firmId,
      userId: req.user?.userId,
    });
    sendError(res, 500, 'Internal server error');
  }
});

/**
 * Book consultation with CA firm (requires authentication)
 * POST /api/ca-marketplace/firms/:firmId/book
 */
router.post('/firms/:firmId/book', authenticateToken, async (req, res) => {
  try {
    const { firmId } = req.params;
    const userId = req.user.userId;
    const { date, time, type, notes, clientName, clientEmail } = req.body;
    const { isValidUUID, validateRequiredFields } = require('../utils/validators');
    const { sendSuccess, sendError, sendValidationError, sendNotFound, sendCreated } = require('../utils/responseFormatter');

    if (!isValidUUID(firmId)) {
      return sendValidationError(res, ['Invalid firm ID format']);
    }

    // Validate required fields
    const validation = validateRequiredFields(req.body, ['date', 'time']);
    if (!validation.isValid) {
      return sendValidationError(res, validation.missingFields.map(f => `${f} is required`));
    }

    // Verify date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return sendValidationError(res, ['Invalid date format']);
    }

    // Get user details
    const { User } = require('../models');
    const user = await User.findByPk(userId);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Verify firm exists
    const firm = await CAFirm.findByPk(firmId);
    if (!firm || firm.status !== 'active') {
      return sendNotFound(res, 'CA firm');
    }

    // Check availability
    const availableSlots = await CABooking.getAvailableSlots(firmId, date);
    if (!availableSlots.includes(time)) {
      return sendError(res, 400, 'Selected time slot is not available');
    }

    // Check if slot is already booked
    const existingBooking = await CABooking.findOne({
      where: {
        firmId,
        date,
        timeSlot: time,
        status: {
          [require('sequelize').Op.in]: ['pending', 'confirmed'],
        },
      },
    });

    if (existingBooking) {
      return sendError(res, 400, 'This time slot is already booked');
    }

    // Create booking
    const booking = await CABooking.create({
      firmId,
      userId,
      clientName: clientName || user.fullName,
      clientEmail: clientEmail || user.email,
      date,
      timeSlot: time,
      notes: notes || null,
      status: 'pending',
      metadata: {
        type: type || 'consultation',
      },
    });

    enterpriseLogger.info('CA consultation booked', {
      bookingId: booking.id,
      firmId,
      userId,
      date,
      time,
      type,
    });

    // TODO: Send email notifications to both user and CA firm
    // This can be implemented using a notification service or email service

    sendCreated(res, 'Consultation booked successfully', {
      bookingId: booking.id,
      status: booking.status,
      date: booking.date,
      timeSlot: booking.timeSlot,
      createdAt: booking.createdAt,
    });
  } catch (error) {
    enterpriseLogger.error('Book consultation failed', {
      error: error.message,
      stack: error.stack,
      firmId: req.params.firmId,
      userId: req.user?.userId,
    });
    sendError(res, 500, 'Internal server error');
  }
});

module.exports = router;

