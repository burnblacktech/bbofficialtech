/**
 * Filing Controller
 * Handles ITR filing CRUD operations and tax calculations
 */

const ITRFiling = require('../models/ITRFiling');
const User = require('../models/User');
const taxCalculationService = require('../services/taxCalculationService');
const { getCurrentFinancialYear } = require('../utils/dateHelpers');
const enterpriseLogger = require('../utils/logger');

/**
 * Create new filing
 * @route POST /api/filings/create
 */
const createFiling = async (req, res) => {
    try {
        // Fix: Use userId from JWT token (set by auth middleware)
        const userId = req.user?.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const { financialYear, pan } = req.body;

        // Validate input
        if (!financialYear || !pan) {
            return res.status(400).json({
                success: false,
                message: 'Financial year and PAN are required',
            });
        }

        // Check if filing already exists for this year
        const existingFiling = await ITRFiling.findOne({
            where: {
                createdBy: userId,
                assessmentYear: financialYear,
                taxpayerPan: pan,
            },
        });

        if (existingFiling) {
            return res.status(400).json({
                success: false,
                message: 'Filing already exists for this financial year',
                data: { filingId: existingFiling.id },
            });
        }

        // Create new filing
        const filing = await ITRFiling.create({
            createdBy: userId,
            userId,
            assessmentYear: financialYear,
            taxpayerPan: pan,
            lifecycleState: 'draft',
            status: 'draft',
            progress: 0,
            filingData: {
                incomeFromSalary: [],
                incomeFromHouseProperty: [],
                capitalGains: { shortTerm: [], longTerm: [] },
                otherSources: {},
                deductions: {
                    section80C: {},
                    section80D: {},
                    section80G: [],
                    otherDeductions: {},
                },
            },
        });

        enterpriseLogger.info('Filing created', {
            filingId: filing.id,
            userId,
            financialYear,
        });

        res.status(201).json({
            success: true,
            message: 'Filing created successfully',
            data: {
                filingId: filing.id,
                financialYear,
                status: filing.lifecycleState,
                progress: filing.progress,
            },
        });
    } catch (error) {
        enterpriseLogger.error('Create filing error', {
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            success: false,
            message: 'Error creating filing',
            error: error.message,
        });
    }
};

/**
 * Get filing by ID
 * @route GET /api/filings/:filingId
 */
const getFiling = async (req, res) => {
    try {
        const userId = req.user.id;
        const { filingId } = req.params;

        const filing = await ITRFiling.findOne({
            where: {
                id: filingId,
                createdBy: userId,
            },
        });

        if (!filing) {
            return res.status(404).json({
                success: false,
                message: 'Filing not found',
            });
        }

        res.json({
            success: true,
            data: filing,
        });
    } catch (error) {
        enterpriseLogger.error('Get filing error', {
            error: error.message,
            filingId: req.params.filingId,
        });
        res.status(500).json({
            success: false,
            message: 'Error fetching filing',
            error: error.message,
        });
    }
};

/**
 * Update filing (auto-save)
 * @route PATCH /api/filings/:filingId
 */
const updateFiling = async (req, res) => {
    try {
        const userId = req.user.id;
        const { filingId } = req.params;
        const updates = req.body;

        const filing = await ITRFiling.findOne({
            where: {
                id: filingId,
                createdBy: userId,
            },
        });

        if (!filing) {
            return res.status(404).json({
                success: false,
                message: 'Filing not found',
            });
        }

        // Update filing data
        const updatedFilingData = {
            ...filing.filingData,
            ...updates.filingData,
        };

        await filing.update({
            filingData: updatedFilingData,
            progress: updates.progress || filing.progress,
            lastUpdated: new Date(),
        });

        enterpriseLogger.info('Filing updated', {
            filingId,
            userId,
            progress: filing.progress,
        });

        res.json({
            success: true,
            message: 'Filing updated successfully',
            data: {
                filingId: filing.id,
                progress: filing.progress,
            },
        });
    } catch (error) {
        enterpriseLogger.error('Update filing error', {
            error: error.message,
            filingId: req.params.filingId,
        });
        res.status(500).json({
            success: false,
            message: 'Error updating filing',
            error: error.message,
        });
    }
};

/**
 * Delete filing
 * @route DELETE /api/filings/:filingId
 */
const deleteFiling = async (req, res) => {
    try {
        const userId = req.user.id;
        const { filingId } = req.params;

        const filing = await ITRFiling.findOne({
            where: {
                id: filingId,
                createdBy: userId,
            },
        });

        if (!filing) {
            return res.status(404).json({
                success: false,
                message: 'Filing not found',
            });
        }

        // Only allow deletion of draft filings
        if (filing.lifecycleState !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Only draft filings can be deleted',
            });
        }

        await filing.destroy();

        enterpriseLogger.info('Filing deleted', {
            filingId,
            userId,
        });

        res.json({
            success: true,
            message: 'Filing deleted successfully',
        });
    } catch (error) {
        enterpriseLogger.error('Delete filing error', {
            error: error.message,
            filingId: req.params.filingId,
        });
        res.status(500).json({
            success: false,
            message: 'Error deleting filing',
            error: error.message,
        });
    }
};

/**
 * Add/Update salary income
 * @route POST /api/filings/:filingId/income/salary
 */
const addSalaryIncome = async (req, res) => {
    try {
        const userId = req.user.id;
        const { filingId } = req.params;
        const salaryData = req.body;

        const filing = await ITRFiling.findOne({
            where: {
                id: filingId,
                createdBy: userId,
            },
        });

        if (!filing) {
            return res.status(404).json({
                success: false,
                message: 'Filing not found',
            });
        }

        // Calculate net salary
        const grossSalary = salaryData.grossSalary || 0;
        const exemptions = salaryData.exemptions || 0;
        const standardDeduction = 50000; // Standard deduction
        const professionalTax = salaryData.professionalTax || 0;

        const netSalary = grossSalary - exemptions - standardDeduction - professionalTax;

        const salaryEntry = {
            ...salaryData,
            standardDeduction,
            netSalary,
            id: salaryData.id || Date.now().toString(),
        };

        // Update filing data
        const filingData = filing.filingData || {};
        const incomeFromSalary = filingData.incomeFromSalary || [];

        // Check if updating existing entry
        const existingIndex = incomeFromSalary.findIndex(s => s.id === salaryEntry.id);
        if (existingIndex >= 0) {
            incomeFromSalary[existingIndex] = salaryEntry;
        } else {
            incomeFromSalary.push(salaryEntry);
        }

        filingData.incomeFromSalary = incomeFromSalary;

        await filing.update({
            filingData,
            progress: Math.max(filing.progress, 30),
            lastUpdated: new Date(),
        });

        res.json({
            success: true,
            message: 'Salary income added successfully',
            data: {
                netSalary,
                standardDeduction,
                updatedProgress: filing.progress,
            },
        });
    } catch (error) {
        enterpriseLogger.error('Add salary income error', {
            error: error.message,
            filingId: req.params.filingId,
        });
        res.status(500).json({
            success: false,
            message: 'Error adding salary income',
            error: error.message,
        });
    }
};

/**
 * Add/Update 80C deductions
 * @route POST /api/filings/:filingId/deductions/80c
 */
const add80CDeductions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { filingId } = req.params;
        const deductionData = req.body;

        const filing = await ITRFiling.findOne({
            where: {
                id: filingId,
                createdBy: userId,
            },
        });

        if (!filing) {
            return res.status(404).json({
                success: false,
                message: 'Filing not found',
            });
        }

        // Calculate total 80C (max 1.5 lakhs)
        const total80C = Object.values(deductionData).reduce((sum, val) => sum + (val || 0), 0);
        const eligible80C = Math.min(total80C, 150000);
        const taxSavings = eligible80C * 0.3; // Assuming 30% tax bracket

        // Update filing data
        const filingData = filing.filingData || {};
        filingData.deductions = filingData.deductions || {};
        filingData.deductions.section80C = {
            ...deductionData,
            total: eligible80C,
        };

        await filing.update({
            filingData,
            progress: Math.max(filing.progress, 70),
            lastUpdated: new Date(),
        });

        res.json({
            success: true,
            message: '80C deductions added successfully',
            data: {
                total80C: eligible80C,
                taxSavings,
                updatedProgress: filing.progress,
            },
        });
    } catch (error) {
        enterpriseLogger.error('Add 80C deductions error', {
            error: error.message,
            filingId: req.params.filingId,
        });
        res.status(500).json({
            success: false,
            message: 'Error adding 80C deductions',
            error: error.message,
        });
    }
};

/**
 * Calculate tax
 * @route POST /api/filings/:filingId/calculate-tax
 */
const calculateTax = async (req, res) => {
    try {
        const userId = req.user.id;
        const { filingId } = req.params;
        const { regime = 'OLD' } = req.body;

        const filing = await ITRFiling.findOne({
            where: {
                id: filingId,
                createdBy: userId,
            },
        });

        if (!filing) {
            return res.status(404).json({
                success: false,
                message: 'Filing not found',
            });
        }

        // Calculate tax using tax calculation service
        const taxCalculation = taxCalculationService.calculateCompleteTax(
            filing.filingData,
            regime
        );

        // Update filing with tax calculation
        const filingData = filing.filingData || {};
        filingData.taxCalculation = taxCalculation;

        await filing.update({
            filingData,
            progress: Math.max(filing.progress, 85),
            lastUpdated: new Date(),
        });

        res.json({
            success: true,
            message: 'Tax calculated successfully',
            data: taxCalculation,
        });
    } catch (error) {
        enterpriseLogger.error('Calculate tax error', {
            error: error.message,
            filingId: req.params.filingId,
        });
        res.status(500).json({
            success: false,
            message: 'Error calculating tax',
            error: error.message,
        });
    }
};

/**
 * Compare regimes
 * @route POST /api/filings/:filingId/compare-regimes
 */
const compareRegimes = async (req, res) => {
    try {
        const userId = req.user.id;
        const { filingId } = req.params;

        const filing = await ITRFiling.findOne({
            where: {
                id: filingId,
                createdBy: userId,
            },
        });

        if (!filing) {
            return res.status(404).json({
                success: false,
                message: 'Filing not found',
            });
        }

        // Compare regimes using tax calculation service
        const comparison = taxCalculationService.compareRegimes(filing.filingData);

        res.json({
            success: true,
            message: 'Regimes compared successfully',
            data: comparison,
        });
    } catch (error) {
        enterpriseLogger.error('Compare regimes error', {
            error: error.message,
            filingId: req.params.filingId,
        });
        res.status(500).json({
            success: false,
            message: 'Error comparing regimes',
            error: error.message,
        });
    }
};

/**
 * Validate filing
 * @route POST /api/filings/:filingId/validate
 */
const validateFiling = async (req, res) => {
    try {
        const userId = req.user.id;
        const { filingId } = req.params;

        const filing = await ITRFiling.findOne({
            where: {
                id: filingId,
                createdBy: userId,
            },
        });

        if (!filing) {
            return res.status(404).json({
                success: false,
                message: 'Filing not found',
            });
        }

        const errors = [];
        const warnings = [];
        const filingData = filing.filingData || {};

        // Validate required fields
        if (!filing.taxpayerPan) {
            errors.push('PAN is required');
        }

        // Validate income sources
        const hasIncome =
            (filingData.incomeFromSalary && filingData.incomeFromSalary.length > 0) ||
            (filingData.incomeFromHouseProperty && filingData.incomeFromHouseProperty.length > 0) ||
            (filingData.incomeFromBusiness && filingData.incomeFromBusiness.netProfit > 0);

        if (!hasIncome) {
            errors.push('At least one income source is required');
        }

        // Check for deductions
        const hasDeductions =
            filingData.deductions &&
            (Object.keys(filingData.deductions.section80C || {}).length > 0 ||
                Object.keys(filingData.deductions.section80D || {}).length > 0);

        if (!hasDeductions) {
            warnings.push('No deductions claimed - you may be missing tax savings');
        }

        const isValid = errors.length === 0;
        const completeness = filing.progress;

        res.json({
            success: true,
            data: {
                isValid,
                errors,
                warnings,
                completeness,
            },
        });
    } catch (error) {
        enterpriseLogger.error('Validate filing error', {
            error: error.message,
            filingId: req.params.filingId,
        });
        res.status(500).json({
            success: false,
            message: 'Error validating filing',
            error: error.message,
        });
    }
};

module.exports = {
    createFiling,
    getFiling,
    updateFiling,
    deleteFiling,
    addSalaryIncome,
    add80CDeductions,
    calculateTax,
    compareRegimes,
    validateFiling,
};
