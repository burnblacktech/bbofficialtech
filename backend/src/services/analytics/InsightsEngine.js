// =====================================================
// INSIGHTS ENGINE
// Generates automated financial insights
// =====================================================

const { UserInsight, FinancialSnapshot } = require('../../models');
const { Op } = require('sequelize');
const enterpriseLogger = require('../../utils/logger');

class InsightsEngine {
    /**
     * Generate all insights for a year
     * @param {string} userId - User ID
     * @param {string} assessmentYear - Assessment year
     * @returns {Promise<Array>} Generated insights
     */
    async generateInsights(userId, assessmentYear) {
        try {
            const insights = [];

            // Get current and previous snapshots
            const current = await FinancialSnapshot.findOne({
                where: { userId, assessmentYear },
            });

            if (!current) {
                return [];
            }

            const previousYear = this.getPreviousYear(assessmentYear);
            const previous = await FinancialSnapshot.findOne({
                where: { userId, assessmentYear: previousYear },
            });

            // Generate income growth insights
            if (previous) {
                insights.push(...await this.generateIncomeGrowthInsights(current, previous));
                insights.push(...await this.generateTaxEfficiencyInsights(current, previous));
                insights.push(...await this.generateIncomeDiversificationInsights(current, previous));
            }

            // Generate deduction insights
            insights.push(...await this.generateDeductionInsights(current));

            // Save insights
            const insightRecords = insights.map(insight => ({
                userId,
                assessmentYear,
                ...insight,
            }));

            await UserInsight.bulkCreate(insightRecords, {
                ignoreDuplicates: true,
            });

            enterpriseLogger.info('Insights generated', {
                userId,
                assessmentYear,
                count: insights.length,
            });

            return insights;
        } catch (error) {
            enterpriseLogger.error('Error generating insights', {
                userId,
                assessmentYear,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Generate income growth insights
     */
    async generateIncomeGrowthInsights(current, previous) {
        const insights = [];
        const currentIncome = parseFloat(current.totalIncome);
        const previousIncome = parseFloat(previous.totalIncome);
        const growth = ((currentIncome - previousIncome) / previousIncome * 100).toFixed(1);

        if (growth > 20) {
            insights.push({
                insightType: 'income_growth',
                insightText: `Congratulations! Your income grew by ${growth}% this year. You earned ₹${currentIncome.toLocaleString('en-IN')} compared to ₹${previousIncome.toLocaleString('en-IN')} last year. That's fantastic growth!`,
                priority: 9,
                metadata: { growth, currentIncome, previousIncome },
            });
        } else if (growth > 0) {
            insights.push({
                insightType: 'income_growth',
                insightText: `Your income increased by ${growth}% this year, from ₹${previousIncome.toLocaleString('en-IN')} to ₹${currentIncome.toLocaleString('en-IN')}. Steady progress!`,
                priority: 7,
                metadata: { growth, currentIncome, previousIncome },
            });
        }

        return insights;
    }

    /**
     * Generate tax efficiency insights
     */
    async generateTaxEfficiencyInsights(current, previous) {
        const insights = [];
        const currentRate = parseFloat(current.effectiveTaxRate);
        const previousRate = parseFloat(previous.effectiveTaxRate);
        const improvement = previousRate - currentRate;

        if (improvement > 0) {
            const savings = (parseFloat(current.totalIncome) * improvement / 100).toFixed(0);
            insights.push({
                insightType: 'tax_efficiency',
                insightText: `Your tax efficiency improved by ${improvement.toFixed(1)}%! You're paying ${currentRate.toFixed(1)}% effective tax rate compared to ${previousRate.toFixed(1)}% last year. That's ₹${parseInt(savings).toLocaleString('en-IN')} in savings!`,
                priority: 8,
                metadata: { improvement, currentRate, previousRate, savings },
            });
        }

        return insights;
    }

    /**
     * Generate income diversification insights
     */
    async generateIncomeDiversificationInsights(current, previous) {
        const insights = [];
        const currentSources = this.countIncomeSources(current);
        const previousSources = this.countIncomeSources(previous);

        if (currentSources > previousSources) {
            insights.push({
                insightType: 'income_diversification',
                insightText: `You diversified your income sources from ${previousSources} to ${currentSources} this year. Great risk management!`,
                priority: 7,
                metadata: { currentSources, previousSources },
            });
        }

        return insights;
    }

    /**
     * Generate deduction insights
     */
    async generateDeductionInsights(current) {
        const insights = [];
        const section80C = parseFloat(current.section80C);
        const section80CLimit = 150000;

        if (section80C < section80CLimit) {
            const remaining = section80CLimit - section80C;
            const potentialSavings = (remaining * 0.312).toFixed(0); // Assuming 31.2% tax rate
            insights.push({
                insightType: 'deduction_opportunity',
                insightText: `You could save ₹${parseInt(potentialSavings).toLocaleString('en-IN')} more in taxes by maxing out your 80C deductions. You have ₹${remaining.toLocaleString('en-IN')} remaining.`,
                priority: 6,
                metadata: { remaining, potentialSavings },
            });
        }

        return insights;
    }

    /**
     * Get insights for user
     * @param {string} userId - User ID
     * @param {string} assessmentYear - Assessment year (optional)
     * @returns {Promise<Array>} Insights
     */
    async getInsights(userId, assessmentYear = null) {
        try {
            const where = { userId };
            if (assessmentYear) {
                where.assessmentYear = assessmentYear;
            }

            return await UserInsight.findAll({
                where,
                order: [['priority', 'DESC'], ['created_at', 'DESC']],
            });
        } catch (error) {
            enterpriseLogger.error('Error fetching insights', {
                userId,
                assessmentYear,
                error: error.message,
            });
            throw error;
        }
    }

    // =====================================================
    // HELPER METHODS
    // =====================================================

    /**
     * Count income sources
     */
    countIncomeSources(snapshot) {
        let count = 0;
        if (parseFloat(snapshot.salaryIncome) > 0) count++;
        if (parseFloat(snapshot.businessIncome) > 0) count++;
        if (parseFloat(snapshot.rentalIncome) > 0) count++;
        if (parseFloat(snapshot.capitalGains) > 0) count++;
        if (parseFloat(snapshot.otherIncome) > 0) count++;
        return count;
    }

    /**
     * Get previous year
     */
    getPreviousYear(assessmentYear) {
        const [startYear, endYear] = assessmentYear.split('-');
        const prevStart = parseInt(startYear) - 1;
        const prevEnd = parseInt(endYear) - 1;
        return `${prevStart}-${prevEnd}`;
    }
}

module.exports = new InsightsEngine();
