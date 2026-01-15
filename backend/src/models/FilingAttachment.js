// =====================================================
// FILING ATTACHMENT MODEL
// Links documents to specific filings with context
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FilingAttachment = sequelize.define('FilingAttachment', {
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
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    documentId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'document_id',
        references: {
            model: 'documents',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },

    // Context
    attachmentType: {
        type: DataTypes.ENUM('PROOF_OF_INCOME', 'PROOF_OF_DEDUCTION', 'FORM_16', 'OTHER'),
        defaultValue: 'OTHER',
        field: 'attachment_type',
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // Validation
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_verified',
    },

    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
    },
}, {
    tableName: 'filing_attachments',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['filing_id'],
        },
        {
            fields: ['document_id'],
        },
    ],
});

module.exports = FilingAttachment;
