// =====================================================
// CA FIRMS ROUTES - ENTERPRISE GRADE
// Manages CA firm entities and their associations
// =====================================================

const express = require('express');
const { CAFirm, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { requireRole, requirePermission, requireCAFirmAccess } = require('../middleware/rbac');
const enterpriseLogger = require('../utils/logger');
const { Op } = require('sequelize');

const router = express.Router();

// =====================================================
// CA FIRM MANAGEMENT ROUTES
// =====================================================

// Get all CA firms (Platform Admin only)
router.get('/', authenticateToken, requireRole(['SUPER_ADMIN', 'PLATFORM_ADMIN']), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) {whereClause.status = status;}
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: firms } = await CAFirm.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'email', 'fullName'],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    // Get stats for each firm
    const firmsWithStats = await Promise.all(
      firms.map(async (firm) => {
        const stats = await CAFirm.getFirmStats(firm.id);
        return {
          ...firm.toJSON(),
          stats: stats.stats,
        };
      }),
    );

    res.json({
      success: true,
      data: {
        firms: firmsWithStats,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    enterpriseLogger.error('Get CA firms failed', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get CA firm by ID
router.get('/:firmId', authenticateToken, requireCAFirmAccess('firmId'), async (req, res) => {
  try {
    const { firmId } = req.params;

    const firm = await CAFirm.findByPk(firmId, {
      include: [
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'email', 'fullName'],
        },
      ],
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
    enterpriseLogger.error('Get CA firm failed', {
      error: error.message,
      stack: error.stack,
      firmId: req.params.firmId,
      userId: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Create new CA firm
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN', 'PLATFORM_ADMIN']), async (req, res) => {
  try {
    const { name, gstNumber, address, phone, email } = req.body;
    const createdBy = req.user.userId;

    const firm = await CAFirm.create({
      name,
      gstNumber,
      address,
      phone,
      email,
      createdBy,
      status: 'active',
    });

    enterpriseLogger.info('CA firm created', {
      firmId: firm.id,
      name: firm.name,
      createdBy,
    });

    res.status(201).json({
      success: true,
      data: { firm },
      message: 'CA firm created successfully',
    });
  } catch (error) {
    enterpriseLogger.error('Create CA firm failed', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Update CA firm
router.put('/:firmId', authenticateToken, requireCAFirmAccess('firmId'), async (req, res) => {
  try {
    const { firmId } = req.params;
    const { name, gstNumber, address, phone, email, status } = req.body;

    const firm = await CAFirm.findByPk(firmId);
    if (!firm) {
      return res.status(404).json({
        success: false,
        error: 'CA firm not found',
      });
    }

    await firm.update({
      name,
      gstNumber,
      address,
      phone,
      email,
      status,
    });

    enterpriseLogger.info('CA firm updated', {
      firmId: firm.id,
      updatedFields: Object.keys(req.body),
      userId: req.user.userId,
    });

    res.json({
      success: true,
      data: { firm },
      message: 'CA firm updated successfully',
    });
  } catch (error) {
    enterpriseLogger.error('Update CA firm failed', {
      error: error.message,
      stack: error.stack,
      firmId: req.params.firmId,
      userId: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Delete CA firm (Soft delete by setting status to inactive)
router.delete('/:firmId', authenticateToken, requireRole(['SUPER_ADMIN', 'PLATFORM_ADMIN']), async (req, res) => {
  try {
    const { firmId } = req.params;

    const firm = await CAFirm.findByPk(firmId);
    if (!firm) {
      return res.status(404).json({
        success: false,
        error: 'CA firm not found',
      });
    }

    await firm.update({ status: 'inactive' });

    enterpriseLogger.info('CA firm deactivated', {
      firmId: firm.id,
      userId: req.user.userId,
    });

    res.json({
      success: true,
      message: 'CA firm deactivated successfully',
    });
  } catch (error) {
    enterpriseLogger.error('Delete CA firm failed', {
      error: error.message,
      stack: error.stack,
      firmId: req.params.firmId,
      userId: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// =====================================================
// CA FIRM STAFF MANAGEMENT ROUTES
// =====================================================

// Get CA firm staff
router.get('/:firmId/staff', authenticateToken, requireCAFirmAccess('firmId'), async (req, res) => {
  try {
    const { firmId } = req.params;

    const staff = await User.findAll({
      where: {
        caFirmId: firmId,
        role: ['CA', 'CA_FIRM_ADMIN'],
      },
      attributes: ['id', 'email', 'fullName', 'role', 'status', 'createdAt'],
      order: [['role', 'DESC'], ['createdAt', 'ASC']],
    });

    res.json({
      success: true,
      data: { staff },
    });
  } catch (error) {
    enterpriseLogger.error('Get CA firm staff failed', {
      error: error.message,
      stack: error.stack,
      firmId: req.params.firmId,
      userId: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Add staff to CA firm
router.post('/:firmId/staff', authenticateToken, requirePermission('ca_firm.staff_manage'), async (req, res) => {
  try {
    const { firmId } = req.params;
    const { userId, role } = req.body;

    // Verify the firm exists
    const firm = await CAFirm.findByPk(firmId);
    if (!firm) {
      return res.status(404).json({
        success: false,
        error: 'CA firm not found',
      });
    }

    // Verify the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Update user's CA firm association
    await user.update({
      caFirmId: firmId,
      role: role || 'CA',
    });

    enterpriseLogger.info('Staff added to CA firm', {
      firmId,
      userId,
      role,
      addedBy: req.user.userId,
    });

    res.json({
      success: true,
      message: 'Staff added to CA firm successfully',
    });
  } catch (error) {
    enterpriseLogger.error('Add staff to CA firm failed', {
      error: error.message,
      stack: error.stack,
      firmId: req.params.firmId,
      userId: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Remove staff from CA firm
router.delete('/:firmId/staff/:userId', authenticateToken, requirePermission('ca_firm.staff_manage'), async (req, res) => {
  try {
    const { firmId, userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user || user.caFirmId !== firmId) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found in this CA firm',
      });
    }

    // Remove CA firm association
    await user.update({
      caFirmId: null,
      role: 'END_USER',
    });

    enterpriseLogger.info('Staff removed from CA firm', {
      firmId,
      userId,
      removedBy: req.user.userId,
    });

    res.json({
      success: true,
      message: 'Staff removed from CA firm successfully',
    });
  } catch (error) {
    enterpriseLogger.error('Remove staff from CA firm failed', {
      error: error.message,
      stack: error.stack,
      firmId: req.params.firmId,
      userId: req.params.userId,
      removedBy: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

module.exports = router;
