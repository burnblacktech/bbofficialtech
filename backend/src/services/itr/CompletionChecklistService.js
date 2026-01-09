// =====================================================
// COMPLETION CHECKLIST SERVICE (S17)
// Generates completion checklist from filing data
// =====================================================

const { ITRFiling } = require('../../models');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class CompletionChecklistService {
    /**
     * Get completion checklist for filing
     * @param {string} filingId - Filing ID
     * @returns {Promise<object>}
     */
    async getChecklist(filingId) {
        try {
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            const payload = filing.jsonPayload || {};
            const items = this.generateChecklistItems(payload);

            const completedItems = items.filter(item => item.completed).length;
            const percentage = Math.round((completedItems / items.length) * 100);

            return {
                items,
                totalItems: items.length,
                completedItems,
                percentage,
                filingId,
            };
        } catch (error) {
            enterpriseLogger.error('Get checklist failed', {
                filingId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Generate checklist items from payload
     * @param {object} payload - Filing jsonPayload
     * @returns {Array}
     */
    generateChecklistItems(payload) {
        const items = [];

        // Salary Income
        const salaryEmployers = payload.income?.salary?.employers || [];
        items.push({
            section: 'salary',
            name: 'Salary Income',
            completed: salaryEmployers.length > 0,
            required: false,
            details: salaryEmployers.length > 0
                ? `${salaryEmployers.length} employer${salaryEmployers.length > 1 ? 's' : ''} added`
                : 'Not started',
            order: 1
        });

        // Capital Gains
        const cgIntent = payload.income?.capitalGains?.intent;
        items.push({
            section: 'capitalGains',
            name: 'Capital Gains',
            completed: !!cgIntent,
            required: false,
            details: cgIntent
                ? `Intent captured: ${cgIntent.userResponse}`
                : 'Not started',
            order: 2
        });

        // Other Income
        items.push({
            section: 'otherIncome',
            name: 'Other Income',
            completed: !!payload.income?.other,
            required: false,
            details: payload.income?.other ? 'Added' : 'Not started',
            order: 3
        });

        // Deductions (80C, 80D, etc.)
        const hasDeductions = payload.deductions && Object.keys(payload.deductions).length > 0;
        items.push({
            section: 'deductions',
            name: 'Deductions (80C, 80D, etc.)',
            completed: hasDeductions,
            required: false,
            details: hasDeductions
                ? `${Object.keys(payload.deductions).length} deduction(s) claimed`
                : 'Not started',
            order: 4
        });

        // Bank Details
        items.push({
            section: 'bankDetails',
            name: 'Bank Account Details',
            completed: !!payload.bankDetails,
            required: false,
            details: payload.bankDetails ? 'Added' : 'Not started',
            order: 5
        });

        // Personal Details
        items.push({
            section: 'personalDetails',
            name: 'Personal Details',
            completed: !!payload.personalDetails,
            required: false,
            details: payload.personalDetails ? 'Complete' : 'Not started',
            order: 6
        });

        // Tax Regime Selection
        items.push({
            section: 'regimeSelection',
            name: 'Tax Regime Selection',
            completed: !!payload.regimeSelection,
            required: false,
            details: payload.regimeSelection
                ? `Selected: ${payload.regimeSelection}`
                : 'Not selected',
            order: 7
        });

        // Verification
        items.push({
            section: 'verification',
            name: 'Final Verification',
            completed: !!payload.verified,
            required: true,
            details: payload.verified ? 'Verified' : 'Pending',
            order: 8
        });

        return items.sort((a, b) => a.order - b.order);
    }
}

module.exports = new CompletionChecklistService();
