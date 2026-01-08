// =====================================================
// EMPLOYER ROUTES (F1.2.1)
// Multi-employer salary management
// =====================================================

const express = require('express');
const router = express.Router();
const employerManagementService = require('../services/itr/EmployerManagementService');
const salaryAggregationService = require('../services/itr/SalaryAggregationService');
const section89ReliefService = require('../services/itr/Section89ReliefService');
const { authenticateToken } = require('../middleware/auth');

/**
 * Add employer to filing
 * POST /api/employers/:filingId
 */
router.post('/:filingId', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;
        const employerData = req.body;

        const result = await employerManagementService.addEmployer(filingId, employerData);

        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get all employers for filing
 * GET /api/employers/:filingId
 */
router.get('/:filingId', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;

        const result = await employerManagementService.getEmployers(filingId);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Update employer
 * PATCH /api/employers/:filingId/:employerId
 */
router.patch('/:filingId/:employerId', authenticateToken, async (req, res, next) => {
    try {
        const { filingId, employerId } = req.params;
        const updates = req.body;

        const result = await employerManagementService.updateEmployer(filingId, employerId, updates);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Remove employer
 * DELETE /api/employers/:filingId/:employerId
 */
router.delete('/:filingId/:employerId', authenticateToken, async (req, res, next) => {
    try {
        const { filingId, employerId } = req.params;

        await employerManagementService.removeEmployer(filingId, employerId);

        res.status(200).json({
            success: true,
            message: 'Employer removed successfully',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get aggregated salary for filing
 * GET /api/employers/:filingId/aggregate
 */
router.get('/:filingId/aggregate', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;

        // Get employers
        const { employers } = await employerManagementService.getEmployers(filingId);

        // Aggregate salary
        const aggregated = salaryAggregationService.aggregateSalary(employers);

        // Validate
        const validation = salaryAggregationService.validateAggregation(aggregated);

        // Check Section 89 eligibility
        const section89 = section89ReliefService.calculateRelief(employers);

        res.status(200).json({
            success: true,
            data: {
                aggregated,
                validation,
                section89,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get Section 89 explanation
 * GET /api/employers/section89/info
 */
router.get('/section89/info', authenticateToken, async (req, res, next) => {
    try {
        const explanation = section89ReliefService.getExplanation();

        res.status(200).json({
            success: true,
            data: explanation,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
