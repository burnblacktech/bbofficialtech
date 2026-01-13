// =====================================================
// FINANCIAL MILESTONE MODEL
// Tracks key financial events and achievements
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FinancialMilestone = sequelize.define('FinancialMilestone', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    milestoneType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'milestone_type',
        comment: 'Type: income_10L, income_20L, first_property, first_business, etc.',
    },
    milestoneDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'milestone_date',
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
    },
}, {
    tableName: 'financial_milestones',
    timestamps: false,
    underscored: true,
    indexes: [
        {
            fields: ['user_id', 'milestone_date'],
        },
        {
            fields: ['milestone_type'],
        },
    ],
});

module.exports = FinancialMilestone;
