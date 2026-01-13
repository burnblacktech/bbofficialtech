// =====================================================
// USER INSIGHT MODEL
// Stores AI-generated financial insights
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserInsight = sequelize.define('UserInsight', {
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
    assessmentYear: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'assessment_year',
    },
    insightType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'insight_type',
        comment: 'Type: income_growth, tax_efficiency, diversification, opportunity, etc.',
    },
    insightText: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'insight_text',
    },
    priority: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
        comment: '1-10 scale, 10 being highest priority',
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
    tableName: 'user_insights',
    timestamps: false,
    underscored: true,
    indexes: [
        {
            fields: ['user_id', 'assessment_year'],
        },
        {
            fields: ['insight_type'],
        },
        {
            fields: ['priority'],
        },
    ],
});

module.exports = UserInsight;
