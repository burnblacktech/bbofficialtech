// =====================================================
// FILING COMMENT MODEL
// Granular comments on specific parts of a filing
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FilingComment = sequelize.define('FilingComment', {
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
    reviewId: {
        type: DataTypes.UUID,
        allowNull: true, // Can be part of a formal review or ad-hoc
        field: 'review_id',
        references: {
            model: 'filing_reviews',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    authorId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'author_id',
        references: {
            model: 'users',
            key: 'id',
        },
    },

    // Context
    fieldPath: {
        type: DataTypes.STRING, // e.g., 'income.salary.grossSalary'
        allowNull: true,
        field: 'field_path',
    },
    section: {
        type: DataTypes.STRING, // e.g., 'SALARY', 'DEDUCTIONS'
        allowNull: true,
    },

    // Content
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    severity: {
        type: DataTypes.ENUM('INFO', 'WARNING', 'ERROR', 'BLOCKER'),
        defaultValue: 'INFO',
    },

    // Resolution
    isResolved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_resolved',
    },
    resolvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'resolved_by',
    },
    resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'resolved_at',
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
    tableName: 'filing_comments',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['filing_id'],
        },
        {
            fields: ['review_id'],
        },
    ],
});

module.exports = FilingComment;
