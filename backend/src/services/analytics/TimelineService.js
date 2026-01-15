// =====================================================
// TIMELINE SERVICE
// Builds financial timeline with milestones
// =====================================================

const { FinancialMilestone, FinancialSnapshot, ITRFiling, FinancialEvent } = require('../../models');
const { Op } = require('sequelize');
const enterpriseLogger = require('../../utils/logger');

class TimelineService {
    /**
     * Get complete timeline for user
     * @param {string} userId - User ID
     * @param {string} startYear - Start assessment year (optional)
     * @param {string} endYear - End assessment year (optional)
     * @returns {Promise<object>} Timeline data
     */
    async getTimeline(userId, startYear = null, endYear = null) {
        try {
            // Build where clause
            const where = { userId };
            if (startYear && endYear) {
                where.assessmentYear = {
                    [Op.between]: [startYear, endYear],
                };
            }

            // Get snapshots
            const snapshots = await FinancialSnapshot.findAll({
                where,
                order: [['assessment_year', 'ASC']],
            });

            // Get milestones
            const milestones = await FinancialMilestone.findAll({
                where: { userId },
                order: [['milestone_date', 'ASC']],
            });

            return {
                snapshots: snapshots.map(s => this.formatSnapshotForTimeline(s)),
                milestones: milestones.map(m => this.formatMilestone(m)),
                years: snapshots.map(s => s.assessmentYear),
            };
        } catch (error) {
            enterpriseLogger.error('Error fetching timeline', {
                userId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Detect and create milestones from filing
     * @param {string} userId - User ID
     * @param {string} filingId - Filing ID
     * @returns {Promise<Array>} Created milestones
     */
    async detectMilestones(userId, filingId) {
        try {
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new Error('Filing not found');
            }

            const snapshot = await FinancialSnapshot.findOne({
                where: { userId, filingId },
            });

            if (!snapshot) {
                return [];
            }

            const milestones = [];
            const totalIncome = parseFloat(snapshot.totalIncome);

            // Check income milestones
            const incomeMilestones = [
                { threshold: 1000000, type: 'income_10L', description: 'Crossed ₹10 Lakh income!' },
                { threshold: 2000000, type: 'income_20L', description: 'Crossed ₹20 Lakh income!' },
                { threshold: 5000000, type: 'income_50L', description: 'Crossed ₹50 Lakh income!' },
                { threshold: 10000000, type: 'income_1Cr', description: 'Crossed ₹1 Crore income!' },
            ];

            for (const milestone of incomeMilestones) {
                if (totalIncome >= milestone.threshold) {
                    const exists = await this.hasMilestone(userId, milestone.type);
                    if (!exists) {
                        milestones.push({
                            userId,
                            milestoneType: milestone.type,
                            milestoneDate: new Date(),
                            amount: totalIncome,
                            description: milestone.description,
                            metadata: { filingId, assessmentYear: filing.assessmentYear },
                        });
                    }
                }
            }

            // Check first business income
            if (parseFloat(snapshot.businessIncome) > 0) {
                const exists = await this.hasMilestone(userId, 'first_business_income');
                if (!exists) {
                    milestones.push({
                        userId,
                        milestoneType: 'first_business_income',
                        milestoneDate: new Date(),
                        amount: parseFloat(snapshot.businessIncome),
                        description: 'Started earning business income!',
                        metadata: { filingId, assessmentYear: filing.assessmentYear },
                    });
                }
            }

            // Check first rental income
            if (parseFloat(snapshot.rentalIncome) > 0) {
                const exists = await this.hasMilestone(userId, 'first_rental_income');
                if (!exists) {
                    milestones.push({
                        userId,
                        milestoneType: 'first_rental_income',
                        milestoneDate: new Date(),
                        amount: parseFloat(snapshot.rentalIncome),
                        description: 'Started earning rental income!',
                        metadata: { filingId, assessmentYear: filing.assessmentYear },
                    });
                }
            }

            // Create milestones
            if (milestones.length > 0) {
                await FinancialMilestone.bulkCreate(milestones);
                enterpriseLogger.info('Milestones detected and created', {
                    userId,
                    filingId,
                    count: milestones.length,
                });
            }

            return milestones;
        } catch (error) {
            enterpriseLogger.error('Error detecting milestones', {
                userId,
                filingId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Get milestones by type
     * @param {string} userId - User ID
     * @param {string} type - Milestone type
     * @returns {Promise<Array>} Milestones
     */
    async getMilestonesByType(userId, type) {
        try {
            return await FinancialMilestone.findAll({
                where: { userId, milestoneType: type },
                order: [['milestone_date', 'DESC']],
            });
        } catch (error) {
            enterpriseLogger.error('Error fetching milestones by type', {
                userId,
                type,
                error: error.message,
            });
            throw error;
        }
    }

    // =====================================================
    // HELPER METHODS
    // =====================================================

    /**
     * Check if milestone exists
     */
    async hasMilestone(userId, type) {
        const count = await FinancialMilestone.count({
            where: { userId, milestoneType: type },
        });
        return count > 0;
    }

    /**
     * Format snapshot for timeline
     */
    formatSnapshotForTimeline(snapshot) {
        return {
            year: snapshot.assessmentYear,
            totalIncome: parseFloat(snapshot.totalIncome),
            totalTax: parseFloat(snapshot.totalTaxPaid),
            effectiveTaxRate: parseFloat(snapshot.effectiveTaxRate),
        };
    }

    /**
     * Format milestone
     */
    formatMilestone(milestone) {
        return {
            id: milestone.id,
            type: milestone.milestoneType,
            date: milestone.milestoneDate,
            amount: milestone.amount ? parseFloat(milestone.amount) : null,
            description: milestone.description,
            metadata: milestone.metadata,
        };
    }

    /**
     * Log a granular financial event
     * @param {Object} eventData
     */
    async logEvent(eventData) {
        try {
            await FinancialEvent.create({
                userId: eventData.userId,
                eventType: eventData.eventType, // income_added, etc.
                eventDate: eventData.eventDate || new Date(),
                entityType: eventData.entityType,
                entityId: eventData.entityId,
                amount: eventData.amount,
                description: eventData.description,
                source: eventData.source || 'manual',
                metadata: eventData.metadata || {}
            });
        } catch (error) {
            // Non-blocking log
            console.error('Failed to log financial event', { error: error.message, userId: eventData.userId });
        }
    }
}

module.exports = new TimelineService();
