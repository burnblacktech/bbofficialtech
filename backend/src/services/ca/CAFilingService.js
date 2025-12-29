/**
 * CAFilingService.js
 * V3.2 CA Workspace - Filing Review
 * 
 * Responsibilities:
 * - Fetch single filing with full Snapshot + Intelligence.
 * - Access Control: Ensure CA has right to view this filing.
 * - Return Read-Only DTO.
 */

const ITRFiling = require('../../models/ITRFiling');
const User = require('../../models/User');
const { AppError } = require('../../utils/AppError'); // Assuming AppError exists or use generic Error

class CAFilingService {

    /**
     * Get Filing for Review
     * @param {String} filingId 
     * @param {Object} caUser - The CA user requesting access
     * @returns {Object} Read-Only DTO
     */
    async getFilingForReview(filingId, caUser) {

        // 1. Fetch Filing with Association
        // We need User details, and the JSON payload/computation
        const filing = await ITRFiling.findOne({
            where: { id: filingId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'email', 'panNumber', 'phone']
            }]
        });

        if (!filing) {
            throw new Error('Filing not found'); // Use AppError.notFound if available
        }

        // 2. Access Control
        // Rule: CA role checked in middleware.
        // Rule: Filing must be assigned to CA's Firm.
        // For V3.2 MVP, if filing.firmId is NULL, maybe allow any CA to "pick" it?
        // Or strictly enforce match.
        // Assuming caUser has caFirmId.
        if (filing.firmId && caUser.caFirmId && filing.firmId !== caUser.caFirmId) {
            throw new Error('Access Denied: Filing belongs to another firm');
        }

        // If filing has NO firmId, should we allow?
        // For now, let's assume we can view it if we are a CA (Global Viewer for Alpha).
        // PROD: STRICT CHECK.

        // 3. Construct Read-Only DTO
        const taxComp = filing.taxComputation || {};
        const confidence = taxComp.confidence || {};
        const signals = taxComp.signals || [];
        const caContext = taxComp.caContext || {};

        return {
            meta: {
                filingId: filing.id,
                status: filing.status,
                lifecycleState: filing.lifecycleState,
                updatedAt: filing.updatedAt,
                assignedTo: filing.assignedTo
            },
            client: {
                name: `${filing.user?.firstName || ''} ${filing.user?.lastName || ''}`.trim(),
                pan: filing.user?.panNumber || 'N/A',
                email: filing.user?.email,
                phone: filing.user?.phone
            },
            snapshot: {
                income: {
                    total: taxComp.totalIncome || 0,
                    breakdown: taxComp.incomeBreakdown || {} // Assuming structure
                },
                deductions: {
                    total: taxComp.totalDeductions || 0,
                    breakdown: taxComp.deductionsBreakdown || {}
                },
                taxOutcome: {
                    taxableIncome: taxComp.taxableIncome || 0,
                    totalTax: taxComp.totalTax || 0,
                    refundOrPayable: taxComp.refundOrPayable || 0
                }
            },
            intelligence: {
                trustScore: confidence.trustScore || 0,
                confidenceBand: confidence.confidenceBand || 'UNKNOWN',
                signals: signals, // Array of signal objects
                caContext: caContext,
                drivers: confidence.drivers || { positive: [], negative: [] } // Drivers from ConfidenceEngine
            }
        };
    }
}

module.exports = new CAFilingService();
