// =====================================================
// FINANCIAL STORY SERVICE
// Aggregates multi-year financial data for storytelling
// =====================================================

const { FinancialSnapshot, ITRFiling, User } = require('../../models');
const enterpriseLogger = require('../../utils/logger');

class FinancialStoryService {
    /**
     * Get complete financial story for user
     * @param {string} userId - User ID
     * @param {number} years - Number of years to fetch (default: 5)
     * @returns {Promise<object>} Financial story data
     */
    async getFinancialStory(userId, years = 5) {
        try {
            // Get all snapshots for user, ordered by year
            const snapshots = await FinancialSnapshot.findAll({
                where: { userId },
                order: [['assessment_year', 'DESC']],
                limit: years,
            });

            if (snapshots.length === 0) {
                return {
                    hasData: false,
                    message: 'No financial data available yet',
                };
            }

            // Calculate summary metrics
            const latestSnapshot = snapshots[0];
            const oldestSnapshot = snapshots[snapshots.length - 1];

            const totalGrowth = this.calculateGrowth(
                parseFloat(oldestSnapshot.totalIncome),
                parseFloat(latestSnapshot.totalIncome)
            );

            const avgTaxRate = this.calculateAverageTaxRate(snapshots);

            return {
                hasData: true,
                years: snapshots.length,
                snapshots: snapshots.map(s => this.formatSnapshot(s)),
                summary: {
                    latestYear: latestSnapshot.assessmentYear,
                    latestIncome: parseFloat(latestSnapshot.totalIncome),
                    totalGrowth,
                    avgTaxRate,
                    yearsTracked: snapshots.length,
                },
            };
        } catch (error) {
            enterpriseLogger.error('Error fetching financial story', {
                userId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Create or update snapshot from filing
     * @param {string} filingId - Filing ID
     * @returns {Promise<object>} Created/updated snapshot
     */
    async createSnapshotFromFiling(filingId) {
        try {
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new Error('Filing not found');
            }

            const payload = filing.jsonPayload || {};
            const income = payload.income || {};
            const deductions = payload.deductions || {};
            const computed = payload.computed || filing.taxComputation || {};

            // Extract income breakdown
            const salaryIncome = parseFloat(income.salary || 0);
            const businessIncome = parseFloat(income.businessIncome || income.business?.netProfit || 0);
            const rentalIncome = parseFloat(income.houseProperty || 0);
            const capitalGains = parseFloat(income.capitalGains || 0);
            const otherIncome = parseFloat(income.otherIncome || 0);
            const totalIncome = salaryIncome + businessIncome + rentalIncome + capitalGains + otherIncome;

            // Extract tax details
            const tdsPaid = parseFloat(computed.totalTDS || 0);
            const advanceTaxPaid = parseFloat(computed.advanceTax || 0);
            const totalTaxPaid = tdsPaid + advanceTaxPaid;
            const effectiveTaxRate = totalIncome > 0 ? (totalTaxPaid / totalIncome * 100) : 0;

            // Extract deductions
            const section80C = parseFloat(deductions.section80C || 0);
            const section80D = parseFloat(deductions.section80D || 0);
            const totalDeductions = section80C + section80D;

            // Create or update snapshot
            const [snapshot, created] = await FinancialSnapshot.upsert({
                userId: filing.createdBy,
                filingId: filing.id,
                assessmentYear: filing.assessmentYear,
                totalIncome,
                salaryIncome,
                businessIncome,
                rentalIncome,
                capitalGains,
                otherIncome,
                totalTaxPaid,
                tdsPaid,
                advanceTaxPaid,
                effectiveTaxRate,
                totalDeductions,
                section80C,
                section80D,
            }, {
                returning: true,
            });

            enterpriseLogger.info('Financial snapshot created/updated', {
                filingId,
                assessmentYear: filing.assessmentYear,
                created,
            });

            return snapshot;
        } catch (error) {
            enterpriseLogger.error('Error creating snapshot from filing', {
                filingId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Get year-over-year comparison
     * @param {string} userId - User ID
     * @param {string} currentYear - Current assessment year
     * @param {string} previousYear - Previous assessment year
     * @returns {Promise<object>} Comparison data
     */
    async getYearOverYearComparison(userId, currentYear, previousYear) {
        try {
            const current = await FinancialSnapshot.findOne({
                where: { userId, assessmentYear: currentYear },
            });

            const previous = await FinancialSnapshot.findOne({
                where: { userId, assessmentYear: previousYear },
            });

            if (!current || !previous) {
                return {
                    hasData: false,
                    message: 'Insufficient data for comparison',
                };
            }

            const incomeGrowth = this.calculateGrowth(
                parseFloat(previous.totalIncome),
                parseFloat(current.totalIncome)
            );

            const taxRateChange = parseFloat(current.effectiveTaxRate) - parseFloat(previous.effectiveTaxRate);

            return {
                hasData: true,
                current: this.formatSnapshot(current),
                previous: this.formatSnapshot(previous),
                comparison: {
                    incomeGrowth,
                    incomeChange: parseFloat(current.totalIncome) - parseFloat(previous.totalIncome),
                    taxRateChange,
                    taxSavings: taxRateChange < 0 ? Math.abs(taxRateChange) : 0,
                },
            };
        } catch (error) {
            enterpriseLogger.error('Error fetching year-over-year comparison', {
                userId,
                currentYear,
                previousYear,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Calculate growth metrics
     * @param {string} userId - User ID
     * @param {number} years - Number of years
     * @returns {Promise<object>} Growth metrics
     */
    async calculateGrowthMetrics(userId, years = 5) {
        try {
            const snapshots = await FinancialSnapshot.findAll({
                where: { userId },
                order: [['assessment_year', 'ASC']],
                limit: years,
            });

            if (snapshots.length < 2) {
                return { hasData: false };
            }

            const oldest = snapshots[0];
            const latest = snapshots[snapshots.length - 1];

            const totalGrowth = this.calculateGrowth(
                parseFloat(oldest.totalIncome),
                parseFloat(latest.totalIncome)
            );

            const cagr = this.calculateCAGR(
                parseFloat(oldest.totalIncome),
                parseFloat(latest.totalIncome),
                snapshots.length - 1
            );

            return {
                hasData: true,
                totalGrowth,
                cagr,
                yearsTracked: snapshots.length,
                startIncome: parseFloat(oldest.totalIncome),
                endIncome: parseFloat(latest.totalIncome),
            };
        } catch (error) {
            enterpriseLogger.error('Error calculating growth metrics', {
                userId,
                error: error.message,
            });
            throw error;
        }
    }

    // =====================================================
    // HELPER METHODS
    // =====================================================

    /**
     * Calculate percentage growth
     */
    calculateGrowth(oldValue, newValue) {
        if (oldValue === 0) return 0;
        return ((newValue - oldValue) / oldValue * 100).toFixed(1);
    }

    /**
     * Calculate CAGR (Compound Annual Growth Rate)
     */
    calculateCAGR(startValue, endValue, years) {
        if (startValue === 0 || years === 0) return 0;
        return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
    }

    /**
     * Calculate average tax rate across snapshots
     */
    calculateAverageTaxRate(snapshots) {
        const sum = snapshots.reduce((acc, s) => acc + parseFloat(s.effectiveTaxRate), 0);
        return (sum / snapshots.length).toFixed(2);
    }

    /**
     * Format snapshot for API response
     */
    formatSnapshot(snapshot) {
        return {
            year: snapshot.assessmentYear,
            totalIncome: parseFloat(snapshot.totalIncome),
            salaryIncome: parseFloat(snapshot.salaryIncome),
            businessIncome: parseFloat(snapshot.businessIncome),
            rentalIncome: parseFloat(snapshot.rentalIncome),
            capitalGains: parseFloat(snapshot.capitalGains),
            otherIncome: parseFloat(snapshot.otherIncome),
            totalTaxPaid: parseFloat(snapshot.totalTaxPaid),
            effectiveTaxRate: parseFloat(snapshot.effectiveTaxRate),
            totalDeductions: parseFloat(snapshot.totalDeductions),
        };
    }
}

module.exports = new FinancialStoryService();
