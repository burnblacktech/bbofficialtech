/**
 * Tax Calculation Controller
 * Handles HTTP requests for tax calculations
 */

const taxCalculationService = require('../services/taxCalculationService');

class TaxController {
    /**
     * Calculate tax for both regimes
     * POST /api/tax/calculate
     */
    async calculateTax(req, res) {
        try {
            const userId = req.user?.userId || req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
            }

            const { filingData, regime = 'OLD', saveCalculation = false } = req.body;

            if (!filingData) {
                return res.status(400).json({
                    success: false,
                    message: 'Filing data is required',
                });
            }

            // Calculate tax
            const calculation = taxCalculationService.calculateCompleteTax(filingData, regime);

            // Optionally save calculation
            if (saveCalculation) {
                // Save to database (implement if needed)
            }

            return res.status(200).json({
                success: true,
                data: calculation,
            });
        } catch (error) {
            console.error('Error calculating tax:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to calculate tax',
                error: error.message,
            });
        }
    }

    /**
     * Compare old vs new regime
     * POST /api/tax/compare-regimes
     */
    async compareRegimes(req, res) {
        try {
            const userId = req.user?.userId || req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
            }

            const { filingData } = req.body;

            if (!filingData) {
                return res.status(400).json({
                    success: false,
                    message: 'Filing data is required',
                });
            }

            // Compare regimes
            const comparison = taxCalculationService.compareRegimes(filingData);

            return res.status(200).json({
                success: true,
                data: comparison,
            });
        } catch (error) {
            console.error('Error comparing regimes:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to compare regimes',
                error: error.message,
            });
        }
    }

    /**
     * Get tax slabs information
     * GET /api/tax/slabs
     */
    async getTaxSlabs(req, res) {
        try {
            const { regime = 'both' } = req.query;

            const {
                oldRegimeSlabs,
                newRegimeSlabs,
                deductionLimits,
                rebateAndCess,
            } = require('../utils/taxSlabs');

            let slabs = {};

            if (regime === 'old' || regime === 'both') {
                slabs.oldRegime = oldRegimeSlabs;
            }

            if (regime === 'new' || regime === 'both') {
                slabs.newRegime = newRegimeSlabs;
            }

            return res.status(200).json({
                success: true,
                data: {
                    slabs,
                    deductionLimits,
                    rebateAndCess,
                },
            });
        } catch (error) {
            console.error('Error fetching tax slabs:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch tax slabs',
                error: error.message,
            });
        }
    }
}

module.exports = new TaxController();
