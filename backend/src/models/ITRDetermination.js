// =====================================================
// ITR DETERMINATION MODEL
// Persists the results of ITR form determination logic
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ITRDetermination = sequelize.define('ITRDetermination', {
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
    filingId: {
        type: DataTypes.UUID,
        allowNull: true, // Can be determined before a filing object exists
        field: 'filing_id',
        references: {
            model: 'itr_filings',
            key: 'id',
        },
        onDelete: 'SET NULL',
    },
    assessmentYear: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'assessment_year',
    },

    // Results
    recommendedForm: {
        type: DataTypes.ENUM('ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'),
        allowNull: false,
        field: 'recommended_form',
    },
    eligibleForms: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        field: 'eligible_forms',
    },

    // Logic inputs snapshot
    incomeSources: {
        type: DataTypes.JSONB, // { salary: true, business: false, capitalGains: true... }
        defaultValue: {},
        field: 'income_sources',
    },
    residentialStatus: {
        type: DataTypes.STRING,
        defaultValue: 'RESIDENT',
        field: 'residential_status',
    },
    totalIncomeEstimate: {
        type: DataTypes.DECIMAL(15, 2),
        field: 'total_income_estimate',
    },

    // Audit
    determinationLog: {
        type: DataTypes.JSONB, // Explanation of why this form was chosen
        field: 'determination_log',
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
    tableName: 'itr_determinations',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['user_id', 'assessment_year'],
        },
    ],
});

module.exports = ITRDetermination;
