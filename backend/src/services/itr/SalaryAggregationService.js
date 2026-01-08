// =====================================================
// SALARY AGGREGATION SERVICE (F1.2.1)
// Aggregates salary from multiple employers
// CRITICAL: Applies standard deduction ONCE
// =====================================================

const enterpriseLogger = require('../../utils/logger');

class SalaryAggregationService {
    /**
     * Aggregate salary from multiple employers
     * @param {Array} employers - Array of employer objects
     * @param {string} assessmentYear - Assessment year
     * @returns {object} - Aggregated salary details
     */
    aggregateSalary(employers, assessmentYear = '2024-25') {
        try {
            if (!employers || employers.length === 0) {
                return this.getEmptyAggregation();
            }

            // Sum gross salary and TDS across all employers
            const totalGross = employers.reduce((sum, emp) => sum + (emp.gross || 0), 0);
            const totalTDS = employers.reduce((sum, emp) => sum + (emp.tds || 0), 0);

            // CRITICAL: Standard deduction applied ONCE (not per employer)
            const standardDeduction = this.getStandardDeduction(assessmentYear);

            // Calculate net salary
            const netSalary = totalGross - standardDeduction;

            // Per-employer breakdown for audit trail
            const breakdown = employers.map(emp => ({
                employerId: emp.id,
                employerName: emp.name,
                workPeriod: emp.workPeriod,
                gross: emp.gross || 0,
                tds: emp.tds || 0,
            }));

            const aggregated = {
                totalGross,
                totalTDS,
                standardDeduction,
                netSalary: Math.max(0, netSalary), // Cannot be negative
                employerCount: employers.length,
                breakdown,
                aggregatedAt: new Date().toISOString(),
            };

            enterpriseLogger.info('Salary aggregated', {
                employerCount: employers.length,
                totalGross,
                standardDeduction,
            });

            return aggregated;
        } catch (error) {
            enterpriseLogger.error('Salary aggregation failed', {
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Get standard deduction amount for assessment year
     * @param {string} assessmentYear - Assessment year
     * @returns {number}
     */
    getStandardDeduction(assessmentYear) {
        // Standard deduction: ₹50,000 for AY 2024-25 onwards
        // (Can be made configurable per AY if rules change)
        return 50000;
    }

    /**
     * Get empty aggregation (no employers)
     * @returns {object}
     */
    getEmptyAggregation() {
        return {
            totalGross: 0,
            totalTDS: 0,
            standardDeduction: 0,
            netSalary: 0,
            employerCount: 0,
            breakdown: [],
            aggregatedAt: new Date().toISOString(),
        };
    }

    /**
     * Validate aggregated salary
     * @param {object} aggregated - Aggregated salary object
     * @returns {object} - Validation result
     */
    validateAggregation(aggregated) {
        const warnings = [];

        // Check for missing TDS
        if (aggregated.totalGross > 250000 && aggregated.totalTDS === 0) {
            warnings.push({
                code: 'MISSING_TDS',
                message: 'Salary exceeds ₹2.5L but no TDS deducted. Verify with employer.',
                severity: 'warning',
            });
        }

        // Check for unusually high TDS
        const tdsPercentage = (aggregated.totalTDS / aggregated.totalGross) * 100;
        if (tdsPercentage > 30) {
            warnings.push({
                code: 'HIGH_TDS',
                message: `TDS is ${tdsPercentage.toFixed(1)}% of gross salary. This seems high.`,
                severity: 'info',
            });
        }

        // Check for multiple employers
        if (aggregated.employerCount > 1) {
            warnings.push({
                code: 'MULTIPLE_EMPLOYERS',
                message: `${aggregated.employerCount} employers detected. Standard deduction applied once.`,
                severity: 'info',
            });
        }

        return {
            isValid: true,
            warnings,
        };
    }
}

module.exports = new SalaryAggregationService();
