const { sequelize } = require('../../config/database');
const { QueryTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { query: dbQuery } = require('../../utils/dbQuery');
const enterpriseLogger = require('../../utils/logger');
const { getDefaultAssessmentYear } = require('../../constants/assessmentYears');
const { validateITRType } = require('../../utils/validationUtils');
const validationEngine = require('../core/ValidationEngine');
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
            const { correlationId, clientRequestId } = meta;

            // 1. Validate ITR Type
            const itrTypeValidation = validateITRType(itrType);
            if (!itrTypeValidation.isValid) {
                throw { statusCode: 400, message: itrTypeValidation.error.message };
            }

            // 2. Validate Form Data (Initial Schema check)
            const validation = validationEngine.validate(itrType.replace('-', '').toLowerCase(), formData);
            if (!validation.isValid) {
                throw { statusCode: 400, message: 'Validation failed', errors: validation.errors };
            }

            const finalAssessmentYear = assessmentYear || getDefaultAssessmentYear();

            // 3. Resolve Filing ID (Create or Get Existing)
            let filingId = providedFilingId;
            if (!filingId) {
                // Idempotency check
                if (idempotencyKey) {
                    const existing = await this._checkIdempotency(userId, idempotencyKey, transaction);
                    if (existing) {
                        await transaction.rollback();
                        return { isExisting: true, draft: existing };
                    }
                }

                // Validate User & PAN
                await this._validateUserForFiling(userId, formData?.personalInfo, transaction);

                // Create Filing
                filingId = await this._createFilingRecord({
                    userId, itrType, assessmentYear: finalAssessmentYear, idempotencyKey
                }, transaction);
            } else {
                // Verify ownership
                await this._verifyFilingOwnership(filingId, userId, transaction);
            }

            // 4. Create Draft Record
            const draft = await this._createDraftRecord(filingId, formData, transaction);

            // 5. Post-Creation Actions
            await transaction.commit();

            // Auto-create service ticket (async, non-blocking)
            this._triggerServiceTicket(filingId, userId, itrType).catch(err =>
                enterpriseLogger.error('Failed to auto-create service ticket', { error: err.message, filingId })
            );

            return {
                id: draft.id,
                filingId,
                step: draft.step,
                itrType,
                status: 'draft',
                createdAt: draft.created_at
            };

        } catch (error) {
            if (transaction && !transaction.finished) await transaction.rollback();
            throw error;
        }
    }

    /**
     * Update an existing ITR Draft
     */
    async updateDraft(userId, draftId, formData, meta = {}) {
        // Get draft and filing info
        const { draft, filing } = await this._getDraftWithFiling(draftId, userId);

        // Guard: Read-only check
        const currentState = await DomainCore.getCurrentState(filing.id);
        if (!DomainCore.canTransition(currentState, currentState)) { // Simple check if state is valid, but here we want to check editability
            // Actually Domain Core should have "isEditable" guard. 
            // For now using the existing check from controller:
            const readOnlyStates = ['submitted', 'filed', 'acknowledged', 'completed']; // Mapping manual list for now until DomainCore exposes group
            // Better: use allow actions
            const allowed = await DomainCore.isActionAllowed(filing.id, 'edit_data', { role: 'END_USER' }); // Assuming role
            if (!allowed) {
                throw { statusCode: 403, message: 'Filing is not editable in current state.' };
            }
        }

        // Domain Logic: Extract Snapshots
        const prevSnapshot = DomainCore.extractDomainSnapshot(draft.data);
        const newSnapshot = DomainCore.extractDomainSnapshot(formData);

        // Domain Logic: Check Rollback
        const rollback = DomainCore.requiresStateRollback(currentState, prevSnapshot, newSnapshot);
        if (rollback.required) {
            await DomainCore.transitionState(filing.id, rollback.targetState, { userId, reason: rollback.reason });
        }

        // Domain Logic: Check Recompute
        const needsRecompute = DomainCore.shouldRecompute(prevSnapshot, newSnapshot);

        // Update DB
        const updatedDraft = await this._updateDraftRecord(draftId, formData);

        return {
            id: updatedDraft.id,
            itrType: filing.itr_type,
            updatedAt: updatedDraft.updated_at,
            rollbackApplied: rollback.required,
            rollbackReason: rollback.reason,
            needsRecompute
        };
    }

    // --- Helpers ---

    async _checkIdempotency(userId, key, transaction) {
        const query = `
        SELECT d.id AS draft_id, d.step, f.id AS filing_id, f.itr_type, f.assessment_year
        FROM itr_filings f
        JOIN itr_drafts d ON d.filing_id = f.id
        WHERE f.user_id = $1 AND f.idempotency_key = $2
        ORDER BY d.created_at DESC LIMIT 1
      `;
        const res = await sequelize.query(query, { bind: [userId, key], type: QueryTypes.SELECT, transaction });
        if (res && res.length > 0) {
            return {
                id: res[0].draft_id,
                filingId: res[0].filing_id,
                step: res[0].step,
                itrType: res[0].itr_type,
                status: 'draft'
            };
        }
        return null;
    }

    async _validateUserForFiling(userId, personalInfo, transaction) {
        let person = null;
        if (personalInfo?.filingFor === 'family' && personalInfo?.memberId) {
            person = await FamilyMember.findOne({ where: { id: personalInfo.memberId, userId } });
            if (!person) throw { statusCode: 404, message: 'Family member not found' };
        } else {
            person = await User.findByPk(userId);
        }

        if (!person || !person.panNumber || !person.panVerified) {
            throw { statusCode: 403, message: 'PAN must be verified before starting ITR filing.' };
        }
    }

    async _createFilingRecord({ userId, itrType, assessmentYear, idempotencyKey }, transaction) {
        const id = uuidv4();
        const query = `
        INSERT INTO itr_filings (id, user_id, itr_type, assessment_year, status, json_payload, idempotency_key, created_at, updated_at, lifecycle_state)
        VALUES ($1, $2, $3, $4, 'draft', '{}'::jsonb, $5, NOW(), NOW(), 'DRAFT_INIT')
        RETURNING id
      `;
        await sequelize.query(query, {
            bind: [id, userId, itrType, assessmentYear, idempotencyKey],
            type: QueryTypes.INSERT,
            transaction
        });
        return id;
    }

    async _verifyFilingOwnership(filingId, userId, transaction) {
        const res = await sequelize.query(
            `SELECT id FROM itr_filings WHERE id = $1 AND user_id = $2`,
            { bind: [filingId, userId], type: QueryTypes.SELECT, transaction }
        );
        if (!res.length) throw { statusCode: 404, message: 'Filing not found or access denied' };
    }

    async _createDraftRecord(filingId, data, transaction) {
        const id = uuidv4();
        const json = JSON.stringify(data || {});
        const query = `
        INSERT INTO itr_drafts (id, filing_id, step, data, is_completed, last_saved_at, created_at, updated_at)
        VALUES ($1, $2, 'personal_info', $3::jsonb, false, NOW(), NOW(), NOW())
        RETURNING id, step, created_at
      `;
        const res = await sequelize.query(query, {
            bind: [id, filingId, json],
            type: QueryTypes.SELECT,
            transaction
        });
        return res[0];
    }

    async _getDraftWithFiling(draftId, userId) {
        const query = `
        SELECT d.id, d.data, f.id as filing_id, f.itr_type, f.status, f.lifecycle_state
        FROM itr_drafts d
        JOIN itr_filings f ON d.filing_id = f.id
        WHERE d.id = $1 AND f.user_id = $2
      `;
        const res = await dbQuery(query, [draftId, userId]);
        if (!res.rows.length) throw { statusCode: 404, message: 'Draft not found' };

        const row = res.rows[0];
        return {
            draft: { id: row.id, data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data },
            filing: { id: row.filing_id, itr_type: row.itr_type, status: row.status, lifecycle_state: row.lifecycle_state }
        };
    }

    async _updateDraftRecord(draftId, data) {
        const query = `
        UPDATE itr_drafts SET data = $1::jsonb, updated_at = NOW()
        WHERE id = $2
        RETURNING id, updated_at
      `;
        const res = await dbQuery(query, [JSON.stringify(data), draftId]);
        return res.rows[0];
    }

    async _triggerServiceTicket(filingId, userId, itrType) {
        await serviceTicketService.autoCreateFilingTicket({ id: filingId, userId, itrType });
    }
}

module.exports = new ITRDraftService();
