// =====================================================
// SECTION 89 RELIEF SERVICE (F1.2.1 MVP)
// Estimates tax relief for salary arrears/advance
// Common in job switch scenarios
// =====================================================

const enterpriseLogger = require('../../utils/logger');

class Section89ReliefService {
    /**
     * Calculate Section 89 relief (MVP estimation)
     * @param {Array} employers - Array of employer objects
     * @param {string} assessmentYear - Assessment year
     * @returns {object} - Relief details
     */
    calculateRelief(employers, assessmentYear = '2024-25') {
        try {
            // Section 89 applies when:
            // 1. Salary received in arrears or advance
            // 2. Multiple employers (common scenario)
            // 3. Significant salary variation

            if (!employers || employers.length < 2) {
                return {
                    eligible: false,
                    reason: 'Single employer - Section 89 not applicable',
                };
            }

            // MVP Heuristic: Estimate based on salary variation
            const salaries = employers.map(e => e.gross || 0);
            const maxSalary = Math.max(...salaries);
            const minSalary = Math.min(...salaries);
            const salaryDiff = maxSalary - minSalary;

            // Only offer if significant variation (>20% or >₹1L)
            const variationPercent = (salaryDiff / maxSalary) * 100;
            const significantVariation = variationPercent > 20 || salaryDiff > 100000;

            if (!significantVariation) {
                return {
                    eligible: false,
                    reason: 'Salary variation not significant enough for relief',
                };
            }

            // Estimate potential relief
            // Simplified: ~10-15% of salary difference (conservative)
            const estimatedRelief = Math.round(salaryDiff * 0.12);

            // Only show if relief > ₹5,000 (meaningful amount)
            if (estimatedRelief < 5000) {
                return {
                    eligible: false,
                    reason: 'Estimated relief too small to be meaningful',
                };
            }

            return {
                eligible: true,
                estimatedRelief,
                salaryDiff,
                requiresForm10E: true,
                confidence: 'estimate', // Not exact calculation
                explanation: 'You may be eligible for tax relief under Section 89 due to salary variation between employers.',
                nextSteps: [
                    'We can help you calculate the exact relief',
                    'You will need to file Form 10E',
                    'Relief will be claimed in your ITR',
                ],
            };
        } catch (error) {
            enterpriseLogger.error('Section 89 calculation failed', {
                error: error.message,
            });
            return {
                eligible: false,
                reason: 'Calculation error',
            };
        }
    }

    /**
     * Get Section 89 explanation for user
     * @returns {object}
     */
    getExplanation() {
        return {
            title: 'Section 89 Relief',
            description: 'Tax relief for salary received in arrears or advance',
            whenApplicable: [
                'You changed jobs mid-year',
                'Significant salary difference between employers',
                'Arrears or bonus received',
            ],
            howItWorks: 'The relief reduces your tax burden by recalculating tax as if salary was received in the correct year.',
            documents: ['Form 10E', 'Salary breakup from employers'],
        };
    }
}

module.exports = new Section89ReliefService();
