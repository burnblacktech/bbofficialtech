// =====================================================
// ERI SUBMISSION ATTEMPT MODEL (S21)
// Tracks submission attempts separately from filing
// Keeps execution history out of Ring 1
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ERISubmissionAttempt = sequelize.define('ERISubmissionAttempt', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    filingId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'filing_id',
        references: {
            model: 'itr_filings',
            key: 'id'
        }
    },
    attemptNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'attempt_number',
        defaultValue: 1
    },
    lastAttemptAt: {
        type: DataTypes.DATE,
        field: 'last_attempt_at',
        allowNull: true
    },
    nextAttemptAt: {
        type: DataTypes.DATE,
        field: 'next_attempt_at',
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'success', 'retryable_failure', 'terminal_failure'),
        allowNull: false,
        defaultValue: 'pending'
    },
    errorCode: {
        type: DataTypes.STRING(100),
        field: 'error_code',
        allowNull: true
    },
    responseHash: {
        type: DataTypes.STRING(255),
        field: 'response_hash',
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        field: 'created_at',
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        field: 'updated_at',
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'eri_submission_attempts',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['filing_id']
        },
        {
            fields: ['next_attempt_at']
        },
        {
            fields: ['status']
        }
    ]
});

/**
 * Get or create active attempt for filing
 * @param {UUID} filingId
 * @returns {Promise<ERISubmissionAttempt>}
 */
ERISubmissionAttempt.getOrCreateActive = async function (filingId) {
    let attempt = await this.findOne({
        where: { filingId, status: 'pending' },
        order: [['attemptNumber', 'DESC']]
    });

    if (!attempt) {
        attempt = await this.create({
            filingId,
            attemptNumber: 1,
            status: 'pending'
        });
    }

    return attempt;
};

/**
 * Record submission result
 * @param {Object} result - { outcome, referenceId?, errorCode?, errorMessage? }
 */
ERISubmissionAttempt.prototype.recordResult = async function (result) {
    this.lastAttemptAt = new Date();

    if (result.outcome === 'SUCCESS') {
        this.status = 'success';
        this.responseHash = result.referenceId;
    } else if (result.outcome === 'TERMINAL_FAILURE') {
        this.status = 'terminal_failure';
        this.errorCode = result.errorCode;
    } else if (result.outcome === 'RETRYABLE_FAILURE') {
        this.status = 'retryable_failure';
        this.errorCode = result.errorCode;

        // Calculate next attempt time (exponential backoff)
        const delayMinutes = Math.pow(2, this.attemptNumber - 1);
        this.nextAttemptAt = new Date(Date.now() + delayMinutes * 60 * 1000);
        this.attemptNumber += 1;
    }

    await this.save();
};

module.exports = ERISubmissionAttempt;
