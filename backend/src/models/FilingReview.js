// =====================================================
// FILING REVIEW MODEL
// Stores review feedback from CAs or automated systems
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FilingReview = sequelize.define('FilingReview', {
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
    reviewerId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'reviewer_id',
        references: {
            model: 'users',
            key: 'id',
        },
    },

    // Review Status
    status: {
        type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'),
        defaultValue: 'PENDING',
    },

    // Overall Feedback
    summary: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    overallRating: {
        type: DataTypes.INTEGER, // 1-5
        allowNull: true,
        field: 'overall_rating',
    },

    completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'completed_at',
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
    tableName: 'filing_reviews',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['filing_id'],
        },
        {
            fields: ['reviewer_id'],
        },
    ],
});

module.exports = FilingReview;
