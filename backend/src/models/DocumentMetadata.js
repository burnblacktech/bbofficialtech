// =====================================================
// DOCUMENT METADATA MODEL
// Extensible metadata key-values for documents
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DocumentMetadata = sequelize.define('DocumentMetadata', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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

    // Key-Value Pair
    key: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    value: {
        type: DataTypes.STRING, // Text value
        allowNull: true,
    },
    numericValue: {
        type: DataTypes.DECIMAL(15, 2), // Numeric value for searching
        allowNull: true,
        field: 'numeric_value',
    },

    // OCR Confidence
    confidenceScore: {
        type: DataTypes.FLOAT, // 0.0 to 1.0
        allowNull: true,
        field: 'confidence_score',
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
    tableName: 'document_metadata',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['document_id'],
        },
        {
            fields: ['document_id', 'key'],
        },
    ],
});

module.exports = DocumentMetadata;
