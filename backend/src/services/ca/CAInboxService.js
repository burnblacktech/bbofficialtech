/**
 * CAInboxService.js
 * V3.1 CA Workspace Core Service
 * 
 * Responsibilities:
 * - Fetch filings for CA Queue.
 * - Sort by Risk/Confidence (Intelligence-driven).
 * - Enrich with User details.
 */

const { QueryTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const ITRFiling = require('../../models/ITRFiling');
const User = require('../../models/User');

class CAInboxService {

    /**
     * Get CA Inbox Items
     * @param {Object} options 
     * @param {String} options.status - Filter by status
     * @param {String} options.search - Text search (name/pan)
     * @param {Number} options.page - Pagination
     * @param {Number} options.limit - Pagination
     * @returns {Object} { data, count }
     */
    async getInboxItems({ status, search, page = 1, limit = 20 }) {
        // We might use raw query for performance on complex JSON sorts, 
        // but for V3.1 Sequelize is fine if we fetch and sort in memory for < 1000 items,
        // OR use specific JSON operators if DB supports it (Postgres specific).
        // Let's stick to standard Sequelize findAndCountAll for safety first.

        const offset = (page - 1) * limit;
        const whereClause = {};

        if (status) {
            whereClause.status = status;
        } else {
            // Default: exclude completed if not explicitly asked?
            // V3 spec: Inbox likely wants "Active" work.
            // Let's show everything for now, or statuses != 'draft'?
            // Usually CA wants to see 'submitted_to_ca' or similar. 
            // In V3.1, let's assume we see ALL filings that are NOT 'draft' (user working) 
            // OR include 'draft' if we want proactive monitoring.
            // Let's include everything except maybe 'deleted'.
        }

        // For Search, we need to join User.

        const { count, rows } = await ITRFiling.findAndCountAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'user', // Ensure association exists
                attributes: ['firstName', 'lastName', 'email', 'panNumber', 'phone'],
                where: search ? {
                    // Simple search logic
                    [sequelize.Sequelize.Op.or]: [
                        { firstName: { [sequelize.Sequelize.Op.iLike]: `%${search}%` } },
                        { lastName: { [sequelize.Sequelize.Op.iLike]: `%${search}%` } },
                        { panNumber: { [sequelize.Sequelize.Op.iLike]: `%${search}%` } }
                    ]
                } : undefined
            }],
            limit,
            offset,
            order: [['updatedAt', 'DESC']] // Default Sort
        });

        // Post-process for Intelligence Sorting
        // V3 Principle: "Sort by Low Trust, High Risk"
        // We can do this in memory for the current page, OR we need a comprehensive strategy.
        // For V3.1 MVP, let's map the results to a clean ViewModel.

        const viewModels = rows.map(filing => {
            const taxComp = filing.taxComputation || {};
            const confidence = taxComp.confidence || {};
            const signals = taxComp.signals || [];

            return {
                filingId: filing.id,
                clientName: `${filing.user?.firstName || ''} ${filing.user?.lastName || ''}`.trim(),
                pan: filing.user?.panNumber || 'N/A',
                itrType: filing.itrType,
                assessmentYear: filing.assessmentYear,
                status: filing.status,
                lifecycleState: filing.lifecycleState,
                updatedAt: filing.updatedAt,

                // Intelligence Data
                trustScore: confidence.trustScore || 0, // 0 if missing
                confidenceBand: confidence.confidenceBand || 'UNKNOWN',
                riskSignalCount: signals.length,

                // Urgency (Derived)
                // Low Score (<70) = High Urgency
                isHighRisk: (confidence.trustScore && confidence.trustScore < 70) || signals.length >= 2
            };
        });

        // Intelligence Sort (override DB sort for the fetched chunk? 
        // Ideally DB sort is best, but JSON sort is heavy. 
        // For V3.1, let's sort the PAGE by risk.
        viewModels.sort((a, b) => {
            // 1. High Risk First
            if (a.isHighRisk && !b.isHighRisk) return -1;
            if (!a.isHighRisk && b.isHighRisk) return 1;

            // 2. Lowest Trust Score First
            return a.trustScore - b.trustScore;
        });

        return {
            items: viewModels,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        };
    }
}

module.exports = new CAInboxService();
