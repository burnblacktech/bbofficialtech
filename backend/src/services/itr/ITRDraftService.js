const { sequelize } = require('../../config/database');
const { QueryTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { query: dbQuery } = require('../../utils/dbQuery');
const enterpriseLogger = require('../../utils/logger');
const { getDefaultAssessmentYear } = require('../../constants/assessmentYears');
const { validateITRType } = require('../../utils/validationUtils');
// const validationEngine = require('../core/ValidationEngine');
const serviceTicketService = require('../common/ServiceTicketService');
const DomainCore = require('../../domain/ITRDomainCore');
const { ITRFiling, ITRDraft } = require('../../models'); // Assuming models index exports these
const User = require('../../models/User');
const { FamilyMember } = require('../../models/Member');

class ITRDraftService {
    /**
     * Create a new ITR Draft
     */
    async createDraft(userId, draftData, meta = {}) {
        const transaction = await sequelize.transaction();
        try {
            const { itrType, formData, assessmentYear, filingId: providedFilingId, idempotencyKey } = draftData;

            // 1. Validate ITR Type
            const itrTypeValidation = validateITRType(itrType);
            if (!itrTypeValidation.isValid) {
                throw { statusCode: 400, message: itrTypeValidation.error.message };
            }

            const finalAssessmentYear = assessmentYear || getDefaultAssessmentYear();

            // 2. Resolve Filing ID (Create or Get Existing)
            let filing;
            if (!providedFilingId) {
                // Idempotency check
                if (idempotencyKey) {
                    filing = await ITRFiling.findOne({
                        where: { createdBy: userId, idempotencyKey },
                        transaction
                    });
                }

                if (!filing) {
                    // Create Filing
                    filing = await ITRFiling.create({
                        createdBy: userId,
                        userId, // Legacy shadow field
                        caFirmId: draftData.caFirmId || null,
                        assessmentYear: finalAssessmentYear,
                        taxpayerPan: formData?.personalInfo?.pan || formData?.personal_info?.pan || 'PENDING',
                        itrType,
                        lifecycleState: 'draft',
                        status: 'draft',
                        idempotencyKey,
                        jsonPayload: {}
                    }, { transaction });
                }
            } else {
                filing = await ITRFiling.findByPk(providedFilingId, { transaction });
                if (!filing || filing.createdBy !== userId) {
                    throw { statusCode: 404, message: 'Filing not found or access denied' };
                }
            }

            // 3. Create/Update Draft Record
            const [draft] = await ITRDraft.findOrCreate({
                where: { filingId: filing.id, step: 'personal_info' },
                defaults: { data: formData || {}, isCompleted: false },
                transaction
            });

            if (formData) {
                await draft.update({ data: formData }, { transaction });
                // Sync to payload
                await this._syncDraftToPayload(filing, 'personal_info', formData, transaction);
            }

            await transaction.commit();

            return {
                id: draft.id,
                filingId: filing.id,
                step: draft.step,
                itrType,
                status: 'draft',
                createdAt: draft.createdAt
            };

        } catch (error) {
            if (transaction && !transaction.finished) await transaction.rollback();
            enterpriseLogger.error('Create draft failed', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Update an existing ITR Draft
     */
    async updateDraft(userId, draftId, formData, meta = {}) {
        const transaction = await sequelize.transaction();
        try {
            const draft = await ITRDraft.findByPk(draftId, {
                include: [{ model: ITRFiling, as: 'filing' }],
                transaction
            });

            if (!draft || draft.filing.createdBy !== userId) {
                throw { statusCode: 404, message: 'Draft not found' };
            }

            const filing = draft.filing;

            // Guard: Read-only check
            const allowed = await DomainCore.isActionAllowed(filing.id, 'edit_data', { role: 'END_USER' });
            if (!allowed) {
                throw { statusCode: 403, message: 'Filing is not editable in current state.' };
            }

            // Domain Logic: Snapshot comparison for rollback/recompute
            const prevSnapshot = DomainCore.extractDomainSnapshot(draft.data);
            const newSnapshot = DomainCore.extractDomainSnapshot(formData);

            const rollback = DomainCore.requiresStateRollback(filing.lifecycleState, prevSnapshot, newSnapshot);
            if (rollback.required) {
                await DomainCore.transitionState(filing.id, rollback.targetState, { userId, reason: rollback.reason });
            }

            const needsRecompute = DomainCore.shouldRecompute(prevSnapshot, newSnapshot);

            // Update Draft
            await draft.update({ data: formData, lastSavedAt: new Date() }, { transaction });

            // Sync to Filing jsonPayload (SSOT Enforcement)
            await this._syncDraftToPayload(filing, draft.step, formData, transaction);

            await transaction.commit();

            return {
                id: draft.id,
                itrType: filing.itrType,
                updatedAt: draft.updatedAt,
                rollbackApplied: rollback.required,
                needsRecompute
            };
        } catch (error) {
            if (transaction && !transaction.finished) await transaction.rollback();
            enterpriseLogger.error('Update draft failed', { error: error.message, draftId });
            throw error;
        }
    }

    /**
     * Synchronize partial draft data into the canonical jsonPayload
     * Enforces Single Source of Truth rule.
     */
    async _syncDraftToPayload(filing, step, data, transaction) {
        const payload = { ...(filing.jsonPayload || {}) };

        // Map step to payload keys
        const stepMap = {
            'personal_info': 'personalInfo',
            'income_sources': 'income',
            'deductions': 'deductions',
            'tax_computation': 'taxComputation',
            'bank_details': 'bankDetails',
            'verification': 'verification'
        };

        const key = stepMap[step] || step;

        // Deep merge logic (simplified for now, replace if nested partial updates are common)
        payload[key] = { ...(payload[key] || {}), ...data };

        // Special case: Sync PAN and ITR Type if present in personal_info
        if (step === 'personal_info' && data.pan) {
            filing.taxpayerPan = data.pan;
        }

        // Mark as changed for Sequelize
        filing.jsonPayload = payload;
        filing.changed('jsonPayload', true);

        await filing.save({ transaction });

        enterpriseLogger.info('Draft synced to jsonPayload', { filingId: filing.id, step });
    }

    async _triggerServiceTicket(filingId, userId, itrType) {
        await serviceTicketService.autoCreateFilingTicket({ id: filingId, userId, itrType });
    }
}

module.exports = new ITRDraftService();
